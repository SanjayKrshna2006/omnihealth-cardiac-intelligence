from langgraph.graph import StateGraph, START, END
from backend.graph.state import OmniHealthState
from backend.agents.ecg_agent import ecg_agent_node
from backend.agents.echo_agent import echo_agent_node
from backend.agents.fusion_agent import fusion_agent_node
from backend.agents.history_agent import history_agent_node
from backend.agents.final_reasoning_agent import final_reasoning_node
from typing import Optional
import logging

logger = logging.getLogger(__name__)

def has_echo(state: OmniHealthState) -> str:
    """Routing condition: check if echo video input is available."""
    return "run_echo"

def has_history(state: OmniHealthState) -> str:
    """Routing condition: check if prior records or reports exist."""
    has_prev = any([
        state.get("previous_ecg_path"),
        state.get("previous_echo_path"),
        state.get("previous_reports"),
    ])
    if has_prev:
        return "run_history"
    return "skip_history"

def build_omnihealth_graph():
    """
    Constructs and compiles the OMNIHEALTH multi-agent StateGraph.
    """
    workflow = StateGraph(OmniHealthState)

    # 1. Register agent nodes
    workflow.add_node("ecg_agent", ecg_agent_node)
    workflow.add_node("echo_agent", echo_agent_node)
    workflow.add_node("fusion", fusion_agent_node)
    workflow.add_node("history_agent", history_agent_node)
    workflow.add_node("final_reasoning", final_reasoning_node)

    # 2. Add entry edge
    workflow.add_edge(START, "ecg_agent")

    # 3. Conditional execution after ECG Agent
    workflow.add_conditional_edges(
        "ecg_agent",
        has_echo,
        {
            "run_echo": "echo_agent",
            "skip_echo": "fusion",
        },
    )

    # 4. Echo Agent -> Multimodal Fusion
    workflow.add_edge("echo_agent", "fusion")

    # 5. Conditional execution after Fusion Agent
    workflow.add_conditional_edges(
        "fusion",
        has_history,
        {
            "run_history": "history_agent",
            "skip_history": "final_reasoning",
        },
    )

    # 6. History Agent -> Final Reasoning -> End
    workflow.add_edge("history_agent", "final_reasoning")
    workflow.add_edge("final_reasoning", END)

    compiled_graph = workflow.compile()
    logger.info("Compiled OMNIHEALTH StateGraph successfully.")
    return compiled_graph

_graph = None

def get_graph():
    """Singleton getter for compiled LangGraph instance."""
    global _graph
    if _graph is None:
        _graph = build_omnihealth_graph()
    return _graph
