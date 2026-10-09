import sys, os
sys.path.insert(0, os.path.abspath('.'))

from backend.graph.workflow import get_graph
from backend.utils.clinical_cases import CLINICAL_CASES_25

def test_all_25_cases():
    graph = get_graph()
    print(f"Testing all {len(CLINICAL_CASES_25)} clinical cases through compiled StateGraph...\n")
    
    results = []
    
    for i, case in enumerate(CLINICAL_CASES_25, 1):
        slug_name = f"Case_{i:02d}"
        init_state = {
            "patient_id": case["patient_id"],
            "patient_info": {
                "patient_name": case["name"],
                "age": case["age"],
                "gender": case["gender"],
                "symptoms": case["symptoms"],
                "medical_history": case["medical_history"]
            },
            "previous_reports": [case["medical_history"]]
        }
        
        final_state = graph.invoke(init_state)
        
        final_assessment = final_state.get("final_assessment")
        ecg_ev = final_state.get("ecg_evidence")
        echo_ev = final_state.get("echo_evidence")
        fusion_ev = final_state.get("fusion_result")
        
        suspected = final_assessment.suspected_condition if final_assessment else ""
        priority = final_assessment.clinical_priority if final_assessment else ""
        hr = ecg_ev.heart_rate if ecg_ev else None
        lvef = echo_ev.lvef if echo_ev else None
        
        results.append({
            "case_number": i,
            "patient_name": case["name"],
            "patient_id": case["patient_id"],
            "hr": hr,
            "lvef": lvef,
            "suspected": suspected,
            "priority": priority,
            "differentials": [d.get("condition") if isinstance(d, dict) else getattr(d, 'condition', '') for d in (final_assessment.differential_diagnoses if final_assessment else [])]
        })
        
        print(f"[{i:02d}/25] Case {i:02d}: {case['name']} ({case['patient_id']})")
        print(f"       HR: {hr} bpm | LVEF: {lvef}%")
        print(f"       Suspected Condition: {suspected}")
        print(f"       Clinical Priority:   {priority}")
        print(f"       Top Differential:    {results[-1]['differentials'][0] if results[-1]['differentials'] else 'N/A'}")
        print("-" * 80)

    # 1. Uniqueness check
    suspected_set = set(r["suspected"] for r in results)
    print(f"\nSummary:")
    print(f"Total Unique Suspected Conditions: {len(suspected_set)} / {len(CLINICAL_CASES_25)}")
    
    # 2. Case 1 Normal check
    c1 = results[0]
    c1_is_normal = "Normal" in c1["suspected"] and ("ROUTINE" in c1["priority"] or "LOW" in c1["priority"])
    print(f"Case 1 (Marcus Chen) Normal Report Verified: {c1_is_normal}")
    print(f"Case 1 Suspected: {c1['suspected']}")
    print(f"Case 1 Priority: {c1['priority']}")

if __name__ == "__main__":
    test_all_25_cases()
