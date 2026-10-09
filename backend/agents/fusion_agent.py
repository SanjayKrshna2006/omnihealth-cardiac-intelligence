import json
import logging
from typing import Optional, Dict, Any, List
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from backend.graph.state import OmniHealthState
from backend.api.schemas import FusionResultSchema, FusionStatus, ECGEvidenceSchema, EchoEvidenceSchema
from backend.config import get_settings

logger = logging.getLogger(__name__)

FUSION_SYSTEM_PROMPT = """You are a specialized cardiac evidence fusion system for OMNIHEALTH.
You receive structured findings from two cardiac diagnostic modalities:
1. 12-lead ECG (Electrocardiogram) — reflects cardiac electrical conduction and repolarization.
2. Echocardiogram — reflects cardiac chamber structure, mechanical wall motion, and ejection fraction (LVEF).

Your task is to analyze how these findings relate:
- AGREEMENT: Both modalities concordantly support normal function or concordantly point to the same structural/ischemic pathology (e.g., prior MI on ECG with reduced systolic function on Echo, or normal rhythm with normal LVEF).
- COMPLEMENTARY: Modalities provide distinct but non-contradictory physiological insights (e.g., electrical conduction disturbance or repolarization STTC on ECG with preserved mechanical pump function on Echo).
- CONFLICT: Findings appear clinically paradoxical or inconsistent (e.g., strictly normal electrical ECG alongside severe structural systolic collapse without explanation).
- MISSING_MODALITY: One or both modalities are missing.
- INSUFFICIENT: Provided evidence is too ambiguous or low confidence to classify.

CRITICAL: Respond ONLY with a valid JSON object matching this schema:
{
  "status": "agreement" | "complementary" | "conflict" | "missing_modality" | "insufficient",
  "agreement_summary": "<concise 1-2 sentence clinical summary of the relationship>",
  "conflict_description": "<description of discrepancy only if status is conflict, otherwise null>",
  "combined_evidence": ["<key synthesized point 1>", "<key synthesized point 2>"],
  "fusion_confidence": 0.0 to 1.0,
  "reasoning": "<step-by-step physiological reasoning>"
}"""

def _rule_based_fusion(ecg: Optional[ECGEvidenceSchema], echo: Optional[EchoEvidenceSchema]) -> FusionResultSchema:
    """
    Deterministic rule-based clinical fusion fallback when LLM is offline or in development mock mode.
    """
    if not ecg and not echo:
        return FusionResultSchema(
            status=FusionStatus.MISSING_MODALITY,
            ecg_finding=None,
            echo_finding=None,
            agreement_summary="No modality data available for multimodal fusion.",
            conflict_description=None,
            missing_modalities=["ECG", "Echo"],
            combined_evidence=[],
            fusion_confidence=None,
        )

    if not ecg or not echo:
        missing = ["ECG"] if not ecg else ["Echo"]
        present_modality = "Echo" if ecg is None else "ECG"
        present_finding = echo.finding if ecg is None else ecg.finding
        return FusionResultSchema(
            status=FusionStatus.MISSING_MODALITY,
            ecg_finding=ecg.finding if ecg else None,
            echo_finding=echo.finding if echo else None,
            agreement_summary=f"Unimodal analysis only ({present_modality}: {present_finding}). Cross-modal fusion limited.",
            conflict_description=None,
            missing_modalities=missing,
            combined_evidence=[f"{present_modality} evidence: {present_finding}"],
            fusion_confidence=0.5,
        )

    # Both ECG and Echo evidence present
    ecg_finding_lower = ecg.finding.lower()
    echo_finding_lower = echo.finding.lower()

    is_ecg_normal = "normal sinus rhythm" in ecg_finding_lower or "norm" in ecg.model_name.lower()
    is_echo_normal = "normal ef" in echo_finding_lower or "≥55%" in echo_finding_lower
    is_echo_reduced = "reduced ef" in echo_finding_lower or "mildly reduced" in echo_finding_lower

    if is_ecg_normal and is_echo_normal:
        return FusionResultSchema(
            status=FusionStatus.AGREEMENT,
            ecg_finding=ecg.finding,
            echo_finding=echo.finding,
            agreement_summary="Concordant normal findings: Normal electrical rhythm on ECG aligned with preserved left ventricular ejection fraction on Echocardiogram.",
            conflict_description=None,
            missing_modalities=[],
            combined_evidence=[
                "Normal sinus rhythm without ischemic ST/T changes",
                "Preserved left ventricular systolic function (LVEF ≥ 55%)"
            ],
            fusion_confidence=0.92,
        )

    if ("mi" in ecg_finding_lower or "infarction" in ecg_finding_lower or "hypertrophy" in ecg_finding_lower) and is_echo_reduced:
        return FusionResultSchema(
            status=FusionStatus.AGREEMENT,
            ecg_finding=ecg.finding,
            echo_finding=echo.finding,
            agreement_summary="Concordant pathological findings: Electrical ischemic/hypertrophic patterns on ECG correspond with reduced mechanical ejection fraction on Echocardiogram.",
            conflict_description=None,
            missing_modalities=[],
            combined_evidence=[
                f"ECG electrical pattern: {ecg.finding}",
                f"Echocardiogram systolic function: {echo.finding}"
            ],
            fusion_confidence=0.88,
        )

    if ("st" in ecg_finding_lower or "conduction" in ecg_finding_lower or "sttc" in ecg_finding_lower or "cd" in ecg_finding_lower) and is_echo_normal:
        return FusionResultSchema(
            status=FusionStatus.COMPLEMENTARY,
            ecg_finding=ecg.finding,
            echo_finding=echo.finding,
            agreement_summary="Complementary findings: Isolated electrical repolarization/conduction alteration on ECG with preserved global mechanical systolic performance on Echocardiogram.",
            conflict_description=None,
            missing_modalities=[],
            combined_evidence=[
                f"Electrical alteration: {ecg.finding}",
                f"Preserved mechanical pump: {echo.finding}"
            ],
            fusion_confidence=0.85,
        )

    if is_ecg_normal and "reduced ef (≤40%)" in echo_finding_lower:
        return FusionResultSchema(
            status=FusionStatus.CONFLICT,
            ecg_finding=ecg.finding,
            echo_finding=echo.finding,
            agreement_summary="Discrepancy detected: Normal electrical baseline contrasts with severe systolic impairment on Echocardiogram.",
            conflict_description="Normal surface ECG rhythm is clinically discordant with severe mechanical ejection fraction impairment (LVEF ≤ 40%). Cardiologist review advised to rule out silent non-ischemic cardiomyopathy.",
            missing_modalities=[],
            combined_evidence=[
                "Surface ECG appears normal",
                "Severe LV systolic impairment identified on Echo"
            ],
            fusion_confidence=0.75,
        )

    # General default complementary
    return FusionResultSchema(
        status=FusionStatus.COMPLEMENTARY,
        ecg_finding=ecg.finding,
        echo_finding=echo.finding,
        agreement_summary=f"Multimodal synthesis: Electrical ECG finding ({ecg.finding}) paired with structural Echo finding ({echo.finding}).",
        conflict_description=None,
        missing_modalities=[],
        combined_evidence=[
            f"ECG: {ecg.finding}",
            f"Echo: {echo.finding}"
        ],
        fusion_confidence=0.80,
    )

def fusion_agent_node(state: OmniHealthState) -> OmniHealthState:
    """
    LangGraph node: Multimodal Fusion Agent.
    Synthesizes ECG and Echo evidence into unified clinical relationship classification.
    """
    patient_id = state.get("patient_id", "Unknown")
    logger.info(f"Multimodal Fusion Agent starting analysis for patient {patient_id}")
    state["pipeline_stage"] = "multimodal_fusion"

    ecg = state.get("ecg_evidence")
    echo = state.get("echo_evidence")

    # Missing modality check
    missing = []
    if not ecg:
        missing.append("ECG")
    if not echo:
        missing.append("Echo")

    if missing:
        state["fusion_result"] = _rule_based_fusion(ecg, echo)
        logger.info(f"Fusion completed (Missing modalities: {missing})")
        return state

    settings = get_settings()
    # Check if real Anthropic API key is available
    if not settings.anthropic_api_key or settings.anthropic_api_key in ["mock-dev-key", ""]:
        logger.info("Using deterministic rule-based cardiac fusion engine (development mode).")
        state["fusion_result"] = _rule_based_fusion(ecg, echo)
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

ECG AGENT EVIDENCE:
- Primary Finding: {ecg.finding}
- Model Confidence: {ecg.confidence if ecg.confidence else 'Uncalibrated'}
- Supporting Points: {json.dumps(ecg.supporting_evidence)}
- Raw Predictions: {json.dumps(ecg.raw_predictions or {})}

ECHOCARDIOGRAM AGENT EVIDENCE:
- Primary Finding: {echo.finding}
- Model Confidence: {echo.confidence if echo.confidence else 'Uncalibrated'}
- Supporting Points: {json.dumps(echo.evidence)}
- Raw Predictions: {json.dumps(echo.raw_predictions or {})}

Analyze the cardiac physiological relationship between the electrical (ECG) and mechanical/structural (Echo) evidence.
"""
        response = llm.invoke([
            SystemMessage(content=FUSION_SYSTEM_PROMPT),
            HumanMessage(content=user_msg),
        ])

        content = response.content.strip()
        # Handle markdown code fences if LLM wraps in ```json
        if content.startswith("```"):
            lines = content.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            content = "\n".join(lines).strip()

        result = json.loads(content)

        state["fusion_result"] = FusionResultSchema(
            status=FusionStatus(result["status"].lower()),
            ecg_finding=ecg.finding,
            echo_finding=echo.finding,
            agreement_summary=result.get("agreement_summary", "Multimodal analysis complete."),
            conflict_description=result.get("conflict_description"),
            missing_modalities=[],
            combined_evidence=result.get("combined_evidence", []),
            fusion_confidence=float(result.get("fusion_confidence", 0.85)) if result.get("fusion_confidence") is not None else None,
        )
        logger.info(f"LLM Fusion successful. Status: {state['fusion_result'].status}")

    except Exception as e:
        logger.warning(f"LLM Fusion call failed ({e}). Falling back to rule-based fusion.")
        state["fusion_result"] = _rule_based_fusion(ecg, echo)

    return state
