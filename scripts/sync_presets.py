import sys, os
sys.path.insert(0, os.path.abspath('.'))
import json
from backend.utils.clinical_cases import CLINICAL_CASES_25

badge_map = {
    'critical': ('bg-[#FFE4E6]', 'text-[#E11D48]', 'Critical / STAT'),
    'arrhythmia': ('bg-[#F3E8FF]', 'text-[#7C3AED]', 'Arrhythmia'),
    'heart_failure': ('bg-[#E0F2FE]', 'text-[#0369A1]', 'Heart Failure'),
    'structural': ('bg-[#FEF3C7]', 'text-[#D97706]', 'Structural / Valve'),
    'normal': ('bg-[#ECFDF5]', 'text-[#059669]', 'Normal Sinus')
}

tag_overrides = {
    1: 'Normal Sinus',
    2: 'STEMI • STAT',
    3: 'Inferior STEMI',
    4: 'LVH • Ischemia',
    5: 'LV Aneurysm',
    6: 'Normal Baseline',
    7: 'Arrhythmia • RVR',
    8: 'VT • Emergent',
    9: '3rd-Deg Block',
    10: 'HFrEF • LBBB',
    11: 'Normal Athletic',
    12: 'HOCM • Septal',
    13: 'Amyloidosis',
    14: 'Aortic Stenosis',
    15: 'Flail Mitral',
    16: 'Normal Screening',
    17: 'Takotsubo',
    18: 'Myopericarditis',
    19: 'End-Stage DCM',
    20: 'Ischemic CM',
    21: 'Normal Baseline',
    22: 'Critical AS • TAVR',
    23: 'Flail Leaflet',
    24: 'Left Main CAD',
    25: 'Severe HOCM'
}

presets = []
for i, c in enumerate(CLINICAL_CASES_25, 1):
    cat = c.get('category', 'normal')
    bg, text, default_tag = badge_map.get(cat, ('bg-[#F1F5F9]', 'text-[#475569]', 'Cardiology'))
    tag = tag_overrides.get(i, default_tag)
    
    safe_name = c['name'].lower().replace(' ', '_')
    desc = f"{c['rhythm_type']} ({c['heart_rate']} bpm) + LVEF {c['lvef']:.0f}%"
    
    preset = {
        'id': f'case_{i:02d}',
        'caseNumber': i,
        'category': cat,
        'name': c['primary_diagnosis'],
        'tag': tag,
        'badgeBg': bg,
        'badgeText': text,
        'patientId': c['patient_id'],
        'patientName': c['name'],
        'age': str(c['age']),
        'sex': c['gender'],
        'symptoms': c['symptoms'],
        'medicalHistory': c['medical_history'],
        'ecgFileName': f"{safe_name}_ecg.csv",
        'echoFileName': 'echo_apical4c.mp4',
        'description': desc
    }
    presets.append(preset)

upload_file = r's:\OmniHealth\frontend\src\pages\Upload.tsx'
with open(upload_file, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = 'const TEST_CASE_PRESETS: TestCasePreset[] = ['
end_marker = '];\n\n// Helper to generate simulated CSV File'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    presets_json = json.dumps(presets, indent=2)
    new_presets_code = f"const TEST_CASE_PRESETS: TestCasePreset[] = {presets_json};\n\n"
    new_content = content[:start_idx] + new_presets_code + content[end_idx + 3:]
    with open(upload_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated Upload.tsx with all 25 TEST_CASE_PRESETS!")
else:
    print(f"Markers not found: start_idx={start_idx}, end_idx={end_idx}")
