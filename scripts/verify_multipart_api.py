import urllib.request, json, time, sys, uuid

sys.stdout.reconfigure(encoding='utf-8')

def post_multipart(fields):
    boundary = '----WebKitFormBoundary' + uuid.uuid4().hex
    body = bytearray()
    for k, v in fields.items():
        body.extend(f'--{boundary}\r\n'.encode('utf-8'))
        body.extend(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode('utf-8'))
        body.extend(f'{v}\r\n'.encode('utf-8'))
    body.extend(f'--{boundary}--\r\n'.encode('utf-8'))
    
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/analysis/run',
        data=bytes(body),
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    res = urllib.request.urlopen(req)
    job = json.loads(res.read().decode())
    job_id = job['job_id']
    
    for i in range(25):
        time.sleep(0.4)
        sres = urllib.request.urlopen(f'http://127.0.0.1:8000/api/analysis/{job_id}/status')
        status_data = json.loads(sres.read().decode())
        if status_data.get('status') == 'complete':
            report_id = status_data['report_id']
            rres = urllib.request.urlopen(f'http://127.0.0.1:8000/api/reports/{report_id}')
            report = json.loads(rres.read().decode())
            return report
        elif status_data.get('status') == 'failed':
            print('Job failed:', status_data)
            return None
    return None

if __name__ == '__main__':
    # Test 1: Marcus Chen (Case 1 - Normal)
    r1 = post_multipart({
        'patient_id': 'PT-10483',
        'patient_name': 'Marcus Chen',
        'age': '42',
        'gender': 'Male',
        'presenting_symptoms': 'Executive athletic screening',
        'medical_history': 'No prior history'
    })
    print('=== CASE 1 (MARCUS CHEN - NORMAL) ===')
    print('Suspected:', r1['final_assessment'].get('suspected_condition'))
    print('Priority:', r1['final_assessment'].get('clinical_priority'))
    print('ECG HR:', r1['ecg_analysis'].get('heart_rate'), 'bpm | Rhythm:', r1['ecg_analysis'].get('rhythm_type'))
    print('Echo LVEF:', r1['echo_analysis'].get('lvef'), '%')

    # Test 2: Eleanor Vance (Case 2 - Anterior STEMI)
    r2 = post_multipart({
        'patient_id': 'PT-10482',
        'patient_name': 'Eleanor Vance',
        'age': '64',
        'gender': 'Female',
        'presenting_symptoms': 'Acute crushing chest pain',
        'medical_history': 'Hypertension'
    })
    print('\n=== CASE 2 (ELEANOR VANCE - ANTERIOR STEMI) ===')
    print('Suspected:', r2['final_assessment'].get('suspected_condition'))
    print('Priority:', r2['final_assessment'].get('clinical_priority'))
    print('ECG HR:', r2['ecg_analysis'].get('heart_rate'), 'bpm | Rhythm:', r2['ecg_analysis'].get('rhythm_type'))
    print('Echo LVEF:', r2['echo_analysis'].get('lvef'), '%')

    # Test 3: Carlos Morales (Case 8 - Monomorphic VT)
    r3 = post_multipart({
        'patient_id': 'PT-10491',
        'patient_name': 'Carlos Morales',
        'age': '61',
        'gender': 'Male',
        'presenting_symptoms': 'Pounding palpitations',
        'medical_history': 'Prior CABG'
    })
    print('\n=== CASE 8 (CARLOS MORALES - MONOMORPHIC VT) ===')
    print('Suspected:', r3['final_assessment'].get('suspected_condition'))
    print('Priority:', r3['final_assessment'].get('clinical_priority'))
    print('ECG HR:', r3['ecg_analysis'].get('heart_rate'), 'bpm | Rhythm:', r3['ecg_analysis'].get('rhythm_type'))
    print('Echo LVEF:', r3['echo_analysis'].get('lvef'), '%')

    # Test 4: Sofia Rossi (Case 12 - HOCM)
    r4 = post_multipart({
        'patient_id': 'PT-10488',
        'patient_name': 'Sofia Rossi',
        'age': '38',
        'gender': 'Female',
        'presenting_symptoms': 'Exertional presyncope',
        'medical_history': 'Family history of SCD'
    })
    print('\n=== CASE 12 (SOFIA ROSSI - HOCM) ===')
    print('Suspected:', r4['final_assessment'].get('suspected_condition'))
    print('Priority:', r4['final_assessment'].get('clinical_priority'))
    print('ECG HR:', r4['ecg_analysis'].get('heart_rate'), 'bpm | Rhythm:', r4['ecg_analysis'].get('rhythm_type'))
    print('Echo LVEF:', r4['echo_analysis'].get('lvef'), '%')

    # Test 5: Dmitri Volkov (Case 24 - Left Main CAD)
    r5 = post_multipart({
        'patient_id': 'PT-10509',
        'patient_name': 'Dmitri Volkov',
        'age': '68',
        'gender': 'Male',
        'presenting_symptoms': 'Resting angina',
        'medical_history': 'Triple vessel CAD'
    })
    print('\n=== CASE 24 (DMITRI VOLKOV - LEFT MAIN CAD) ===')
    print('Suspected:', r5['final_assessment'].get('suspected_condition'))
    print('Priority:', r5['final_assessment'].get('clinical_priority'))
    print('ECG HR:', r5['ecg_analysis'].get('heart_rate'), 'bpm | Rhythm:', r5['ecg_analysis'].get('rhythm_type'))
    print('Echo LVEF:', r5['echo_analysis'].get('lvef'), '%')
