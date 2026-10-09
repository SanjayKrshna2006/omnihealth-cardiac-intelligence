import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from backend.graph.state import OmniHealthState
from backend.api.schemas import (
    HistoryAnalysisSchema,
    HistoryRelationship,
    FusionResultSchema,
)
from backend.config import get_settings

logger = logging.getLogger(__name__)

HISTORY_SYSTEM_PROMPT = """You are a specialized clinical cardiac history comparison agent for OMNIHEALTH.
You receive:
1. PREVIOUS CARDIAC RECORDS: Prior ECG findings, prior echocardiograms, or previous clinical discharge summaries.
2. CURRENT MULTIMODAL ASSESSMENT: The newly analyzed ECG, Echo, and Multimodal Fusion findings.

Your task is to perform an explainable longitudinal comparison and classify the temporal relationship:
- SIMILAR: Current findings match prior baseline without significant new abnormality or alteration.
- PERSISTENT: A specific chronic finding from prior records continues to appear (e.g., known prior Q-wave MI, chronic bundle branch block, or stable mildly reduced EF).
- CHANGED: Clinically meaningful evolution detected (e.g., progressive drop in LVEF, resolution of acute ischemia, or worsening conduction delay).
- NEW: An acute or previously undocumented finding has appeared that was not in prior records.
- CONFLICTING: Prior and current records present medically contradictory or irreconcilable observations.
- UNKNOWN: Previous records are absent or insufficient for longitudinal tracking.

CRITICAL: Respond ONLY with a valid JSON object matching this schema:
{
  "relationship": "similar" | "persistent" | "changed" | "new" | "conflicting" | "unknown",
  "previous_summary": "<summary of prior findings>",
  "current_summary": "<summary of current multimodal findings>",
  "changes_detected": ["<specific clinical change 1>", "..."],
  "persistent_findings": ["<specific persistent finding 1>", "..."],
  "new_findings": ["<specific new finding 1>", "..."],
  "analysis_notes": "<clinical reasoning for the longitudinal relationship classification>"
}"""

def _extract_text_from_file_or_string(entry: str) -> str:
    """Helper to load text from a file path or return the string as text."""
    path = Path(entry)
    if path.exists() and path.is_file():
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read().strip()
        except Exception as e:
            return f"File {path.name} (read error: {e})"
    return entry

def _rule_based_history_comparison(
    history_text: str,
    current_summary: str,
    fusion: Optional[FusionResultSchema],
    ecg_finding: Optional[str],
    echo_finding: Optional[str]
) -> HistoryAnalysisSchema:
    """
    Deterministic rule-based longitudinal comparison fallback.
    """
    hist_lower = history_text.lower()
    curr_lower = current_summary.lower()
    ecg_lower = (ecg_finding or "").lower()
    echo_lower = (echo_finding or "").lower()

    # If history text is trivial or empty
    if not history_text.strip():
        return HistoryAnalysisSchema(
            relationship=HistoryRelationship.UNKNOWN,
            previous_ecg_finding=None,
            previous_echo_finding=None,
            current_summary=current_summary,
            changes_detected=[],
            persistent_findings=[],
            new_findings=[],
            analysis_notes="No prior records available for comparison.",
        )

    # 1. Check for worsening / change
    if ("normal" in hist_lower or "preserved" in hist_lower or "ef 60" in hist_lower or "ef 65" in hist_lower) and \
       ("reduced" in echo_lower or "mi" in ecg_lower or "ischemia" in ecg_lower or "sttc" in ecg_lower):
        return HistoryAnalysisSchema(
            relationship=HistoryRelationship.CHANGED,
            previous_ecg_finding="Prior baseline noted as normal / preserved function.",
            previous_echo_finding=None,
            current_summary=current_summary,
            changes_detected=[
                "Deterioration from prior normal baseline to newly detected cardiac abnormality/reduced function."
            ],
            persistent_findings=[],
            new_findings=[f"Current finding: {ecg_finding or echo_finding}"],
            analysis_notes="Patient had prior documented normal baseline; current investigation demonstrates acute or progressive change.",
        )

    # 2. Check for persistent chronic condition
    if ("infarct" in hist_lower or "mi" in hist_lower or "bundle branch" in hist_lower or "hypertrophy" in hist_lower) and \
       ("infarct" in ecg_lower or "mi" in ecg_lower or "conduction" in ecg_lower or "hypertrophy" in ecg_lower):
        return HistoryAnalysisSchema(
            relationship=HistoryRelationship.PERSISTENT,
            previous_ecg_finding="Prior documented ischemic / conduction disease.",
            previous_echo_finding=None,
            current_summary=current_summary,
            changes_detected=[],
            persistent_findings=["Chronic electrical/structural pattern continues to persist."],
            new_findings=[],
            analysis_notes="Comparison confirms persistence of known chronic cardiac changes identified on earlier records.",
        )

    # 3. Check for similar stable normal baseline
    if ("normal" in hist_lower or "sinus" in hist_lower) and \
       ("normal" in curr_lower or "preserved" in curr_lower):
        return HistoryAnalysisSchema(
            relationship=HistoryRelationship.SIMILAR,
            previous_ecg_finding="Prior normal sinus rhythm / normal baseline.",
            previous_echo_finding=None,
            current_summary=current_summary,
            changes_detected=[],
            persistent_findings=["Normal baseline cardiac parameters"],
            new_findings=[],
            analysis_notes="Current findings are concordant and similar to prior normal investigations.",
        )

    # 4. New finding
    if "prior" in hist_lower or "baseline" in hist_lower:
        return HistoryAnalysisSchema(
            relationship=HistoryRelationship.NEW,
            previous_ecg_finding="Prior record on file.",
            previous_echo_finding=None,
            current_summary=current_summary,
            changes_detected=["Difference noted from prior documented state."],
            persistent_findings=[],
            new_findings=[f"New presentation: {ecg_finding or echo_finding or current_summary}"],
            analysis_notes="Current investigation demonstrates new parameters not reflected in previous documentation.",
        )

    # Default fallback
    return HistoryAnalysisSchema(
        relationship=HistoryRelationship.SIMILAR,
        previous_ecg_finding="Prior records reviewed.",
        previous_echo_finding=None,
        current_summary=current_summary,
        changes_detected=[],
        persistent_findings=["Stable overall cardiac profile"],
        new_findings=[],
        analysis_notes="Longitudinal review indicates stability across documented parameters.",
    )

def history_agent_node(state: OmniHealthState) -> OmniHealthState:
    """
    LangGraph node: History Agent.
    Compares previous clinical history and reports against current multimodal assessment.
    """
    patient_id = state.get("patient_id", "Unknown")
    logger.info(f"History Agent starting analysis for patient {patient_id}")
    state["pipeline_stage"] = "history_analysis"

    previous_ecg = state.get("previous_ecg_path")
    previous_echo = state.get("previous_echo_path")
    previous_reports = state.get("previous_reports") or []
    fusion = state.get("fusion_result")
    ecg_ev = state.get("ecg_evidence")
    echo_ev = state.get("echo_evidence")

    current_summary = (
        fusion.agreement_summary if fusion else
        f"ECG: {ecg_ev.finding if ecg_ev else 'N/A'}, Echo: {echo_ev.finding if echo_ev else 'N/A'}"
    )

    # Check if any prior history was provided
    if not any([previous_ecg, previous_echo, previous_reports]):
        logger.info(f"No prior cardiac records provided for patient {patient_id}.")
        state["history_analysis"] = HistoryAnalysisSchema(
            relationship=HistoryRelationship.UNKNOWN,
            previous_ecg_finding=None,
            previous_echo_finding=None,
            current_summary=current_summary,
            changes_detected=[],
            persistent_findings=[],
            new_findings=[],
            analysis_notes="No previous cardiac records provided for longitudinal comparison.",
        )
        return state

    # Aggregate history textual evidence
    history_snippets = []
    if previous_ecg:
        history_snippets.append(f"Prior ECG Record: {_extract_text_from_file_or_string(previous_ecg)}")
    if previous_echo:
        history_snippets.append(f"Prior Echo Record: {_extract_text_from_file_or_string(previous_echo)}")
    for i, rep in enumerate(previous_reports):
        history_snippets.append(f"Prior Report {i+1}: {_extract_text_from_file_or_string(rep)}")

    full_history_text = "\n\n".join(history_snippets)

    settings = get_settings()
    # Check if Anthropic API key is available
    if not settings.anthropic_api_key or settings.anthropic_api_key in ["mock-dev-key", ""]:
        logger.info("Using deterministic rule-based history comparison engine (development mode).")
        state["history_analysis"] = _rule_based_history_comparison(
            history_text=full_history_text,
            current_summary=current_summary,
            fusion=fusion,
            ecg_finding=ecg_ev.finding if ecg_ev else None,
            echo_finding=echo_ev.finding if echo_ev else None,
        )
        return state

    try:
        llm = ChatAnthropic(
            model="claude-3-5-sonnet-20241022",
            anthropic_api_key=settings.anthropic_api_key,
            max_tokens=1000,
            temperature=0.0
        )
        user_msg = f"""
PATIENT ID: {patient_id}

PREVIOUS CARDIAC RECORDS:
{full_history_text}

CURRENT MULTIMODAL CARDIAC FINDINGS:
- Current ECG: {ecg_ev.finding if ecg_ev else 'Not provided'}
- Current Echo: {echo_ev.finding if echo_ev else 'Not provided'}
- Fusion Summary: {fusion.agreement_summary if fusion else 'Not provided'}
- Fusion Status: {fusion.status if fusion else 'N/A'}

Compare the previous records with current findings and classify the longitudinal relationship.
"""
        response = llm.invoke([
            SystemMessage(content=HISTORY_SYSTEM_PROMPT),
            HumanMessage(content=user_msg),
        ])

        content = response.content.strip()
        if content.startswith("```"):
            lines = content.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            content = "\n".join(lines).strip()

        result = json.loads(content)

        state["history_analysis"] = HistoryAnalysisSchema(
            relationship=HistoryRelationship(result["relationship"].lower()),
            previous_ecg_finding=result.get("previous_summary"),
            previous_echo_finding=None,
            current_summary=result.get("current_summary", current_summary),
            changes_detected=result.get("changes_detected", []),
            persistent_findings=result.get("persistent_findings", []),
            new_findings=result.get("new_findings", []),
            analysis_notes=result.get("analysis_notes", ""),
        )
        logger.info(f"LLM History analysis successful. Relationship: {state['history_analysis'].relationship}")

    except Exception as e:
        logger.warning(f"LLM History comparison failed ({e}). Falling back to rule-based comparison.")
        state["history_analysis"] = _rule_based_history_comparison(
            history_text=full_history_text,
            current_summary=current_summary,
            fusion=fusion,
            ecg_finding=ecg_ev.finding if ecg_ev else None,
            echo_finding=echo_ev.finding if echo_ev else None,
        )

    return state
