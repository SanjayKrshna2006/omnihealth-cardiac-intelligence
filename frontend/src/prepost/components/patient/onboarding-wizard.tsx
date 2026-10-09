'use client';

import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  User,
  Activity,
  Plus,
  Trash2,
} from 'lucide-react';
import type { PatientDetails, SurgeryCatalogItem } from '@/lib/types/database';
import { SURGERY_CATALOG, CONDITIONS_CATALOG } from '@/lib/services/protocols';
import { computePlanLength } from '@/lib/services/plan-builder';

interface OnboardingWizardProps {
  onComplete: (details: PatientDetails) => void;
  language: string;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, language }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Step 1: Basics
  const [name, setName] = useState('Rajesh Sharma');
  const [age, setAge] = useState('58');
  const [sex, setSex] = useState<'male' | 'female' | 'other'>('male');
  const [heightCm, setHeightCm] = useState('174');
  const [weightKg, setWeightKg] = useState('81');
  const [diet, setDiet] = useState<'veg' | 'non-veg' | 'vegan' | 'other'>('veg');
  const [allergies, setAllergies] = useState('Penicillin');

  // Step 2: Surgery
  const [surgeryType, setSurgeryType] = useState('cabg');
  const [searchSurgery, setSearchSurgery] = useState('');
  const [surgeryDate, setSurgeryDate] = useState('2026-10-15');
  const [hospital, setHospital] = useState('Fortis Heart Institute');
  const [surgeon, setSurgeon] = useState('Dr. Arun Kumar');

  // Step 3: Other Health Problems
  const [conditions, setConditions] = useState<string[]>(['diabetes', 'high_blood_pressure']);
  const [followUps, setFollowUps] = useState<Record<string, string>>({
    diabetes: 'Oral tablets (Metformin 500mg)',
  });

  // Step 4: Current Medicines
  const [medicines, setMedicines] = useState<
    Array<{ name: string; dosage: string; frequency: string; doctor_instruction?: 'continue' | 'stop' }>
  >([
    { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', doctor_instruction: 'stop' },
    { name: 'Amlodipine', dosage: '5mg', frequency: 'Morning', doctor_instruction: 'continue' },
  ]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('');

  // Step 5: Consent & Sharing
  const [alertConsent, setAlertConsent] = useState(true);
  const [doctorCode, setDoctorCode] = useState('CARDIO-DR-ARUN');
  const [doctorLinked, setDoctorLinked] = useState(true);

  // Computed plan length preview
  const lengthPreview = computePlanLength(surgeryType, conditions);

  const filteredSurgeries = SURGERY_CATALOG.filter((s) =>
    s.name.toLowerCase().includes(searchSurgery.toLowerCase())
  );

  const toggleCondition = (id: string) => {
    if (id === 'none') {
      setConditions(['none']);
      return;
    }
    const clean = conditions.filter((c) => c !== 'none');
    if (clean.includes(id)) {
      setConditions(clean.filter((c) => c !== id));
    } else {
      setConditions([...clean, id]);
    }
  };

  const handleAddMedicine = () => {
    if (!newMedName.trim()) return;
    setMedicines([
      ...medicines,
      {
        name: newMedName.trim(),
        dosage: newMedDose.trim() || 'Standard dose',
        frequency: newMedFreq.trim() || 'Daily',
        doctor_instruction: 'continue',
      },
    ]);
    setNewMedName('');
    setNewMedDose('');
    setNewMedFreq('');
  };

  const handleRemoveMedicine = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleFinish = () => {
    const finalDetails: PatientDetails = {
      patient_id: 'p-cabg-01',
      name,
      age: Number(age) || 50,
      sex,
      height_cm: Number(heightCm) || 170,
      weight_kg: Number(weightKg) || 70,
      diet,
      allergies: allergies.split(',').map((a) => a.trim()).filter(Boolean),
      language,
      surgery_type: surgeryType,
      surgery_date: surgeryDate,
      hospital,
      surgeon,
      conditions,
      condition_follow_ups: followUps,
      current_medicines: medicines.map((m) => ({
        ...m,
        confirmed_by_doctor: true,
      })),
      stage: 'before',
      total_plan_days: lengthPreview.totalDays,
      baseline_plan_days: lengthPreview.totalDays,
      plan_length_reason: lengthPreview.reason,
      alert_consent: alertConsent,
      consent_at: new Date().toISOString(),
    };

    onComplete(finalDetails);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl border border-border p-8 space-y-6 shadow-sm">
        {/* Stepper Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Recovery Journey Onboarding
            </h2>
            <p className="text-xs text-muted">
              {step <= 5 ? `Step ${step} of 5` : 'Plan Ready'}
            </p>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`w-8 h-2 rounded-full ${s <= step ? 'bg-accent' : 'bg-surface border border-border'}`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: BASICS */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-foreground">1. Basic Details</h3>
            <p className="text-muted">Personalized metrics establish baseline metabolic and recovery rates.</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-foreground mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-foreground mb-1">Sex</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-foreground mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-foreground mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-foreground mb-1">Diet Preference</label>
                <select
                  value={diet}
                  onChange={(e) => setDiet(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white"
                >
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="other">Other / Renal / Cardiac</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-foreground mb-1">Known Allergies</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Latex"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SURGERY TYPE & DATE */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-foreground">2. Surgery Type &amp; Date</h3>
            <p className="text-muted">Select your procedure to initialize the clinical milestone protocol.</p>

            <div>
              <label className="block font-semibold text-foreground mb-1">Search Surgical Catalog</label>
              <input
                type="text"
                placeholder="Search procedures (e.g. bypass, knee, hernia)..."
                value={searchSurgery}
                onChange={(e) => setSearchSurgery(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl mb-2"
              />
              <div className="max-h-40 overflow-y-auto space-y-1.5 border border-border rounded-xl p-2 bg-surface">
                {filteredSurgeries.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSurgeryType(s.id)}
                    className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                      surgeryType === s.id
                        ? 'bg-accent text-white'
                        : 'bg-white hover:bg-slate-100 text-foreground'
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] opacity-80">{s.specialty}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-foreground mb-1">Surgery Date</label>
                <input
                  type="date"
                  value={surgeryDate}
                  onChange={(e) => setSurgeryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-foreground mb-1">Hospital / Surgeon</label>
                <input
                  type="text"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  placeholder="Hospital name"
                  className="w-full px-3 py-2 border border-border rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: OTHER HEALTH PROBLEMS */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-foreground">3. Other Health Conditions</h3>
            <p className="text-muted">Condition modules add safety checks and telemetry limits to your journey.</p>

            <div className="flex flex-wrap gap-2">
              {CONDITIONS_CATALOG.map((c) => {
                const active = conditions.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCondition(c.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      active
                        ? 'bg-accent-light border-accent text-accent shadow-sm'
                        : 'bg-white border-border text-muted hover:text-foreground'
                    }`}
                  >
                    {active ? '✓ ' : '+ '} {c.name}
                  </button>
                );
              })}
            </div>

            {/* Condition Follow-ups */}
            {conditions.includes('diabetes') && (
              <div className="p-3 bg-surface rounded-xl border border-border space-y-1">
                <label className="block font-bold text-foreground">Diabetes Follow-up:</label>
                <input
                  type="text"
                  placeholder="e.g. Taking Metformin tablets, or Insulin injections?"
                  value={followUps.diabetes || ''}
                  onChange={(e) => setFollowUps({ ...followUps, diabetes: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-white"
                />
              </div>
            )}

            {conditions.includes('blood_thinner_use') && (
              <div className="p-3 bg-surface rounded-xl border border-border space-y-1">
                <label className="block font-bold text-foreground">Blood Thinner Follow-up:</label>
                <input
                  type="text"
                  placeholder="e.g. Taking Warfarin, Eliquis, Plavix, or Aspirin?"
                  value={followUps.blood_thinner_use || ''}
                  onChange={(e) => setFollowUps({ ...followUps, blood_thinner_use: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-white"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 4: CURRENT MEDICINES */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-foreground">4. Current Medications &amp; Doctor Confirmation</h3>
            <p className="text-muted">
              List what you take today. The app reminds you; your doctor confirms stop/continue instructions.
            </p>

            <div className="space-y-2">
              {medicines.map((m, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-border bg-surface flex items-center justify-between">
                  <div>
                    <span className="font-bold text-foreground">{m.name}</span>
                    <span className="text-[11px] text-muted block">{m.dosage} • {m.frequency}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      m.doctor_instruction === 'stop' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {m.doctor_instruction}
                    </span>
                    <button onClick={() => handleRemoveMedicine(idx)} className="text-muted hover:text-rose-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-surface rounded-xl border border-border space-y-2">
              <span className="font-bold text-foreground block">Add Another Medication:</span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Medication name"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="p-2 border border-border rounded-lg bg-white"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g. 50mg)"
                  value={newMedDose}
                  onChange={(e) => setNewMedDose(e.target.value)}
                  className="p-2 border border-border rounded-lg bg-white"
                />
                <input
                  type="text"
                  placeholder="Frequency"
                  value={newMedFreq}
                  onChange={(e) => setNewMedFreq(e.target.value)}
                  className="p-2 border border-border rounded-lg bg-white"
                />
              </div>
              <button
                type="button"
                onClick={handleAddMedicine}
                className="px-3 py-1.5 bg-accent text-white font-bold rounded-lg text-xs"
              >
                + Add Medication
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: CONSENT & SHARING */}
        {step === 5 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-foreground">5. Clinical Consent &amp; Doctor Link</h3>

            <label className="flex items-start gap-3 p-3.5 bg-surface border border-border rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={alertConsent}
                onChange={(e) => setAlertConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-accent rounded"
              />
              <span className="text-xs text-foreground leading-relaxed">
                I explicitly consent to sharing health logs and emergency telemetry alerts with my surgeon (Dr. Arun Kumar) when readings exceed safe clinical thresholds.
              </span>
            </label>

            <div className="p-4 bg-white border border-border rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-foreground">Dr. Arun Kumar (Surgical Lead)</h4>
                <p className="text-xs text-muted">Clinic ID: <span className="font-mono text-accent font-semibold">{doctorCode}</span></p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                ✓ Connected
              </span>
            </div>
          </div>
        )}

        {/* STEP 6: 'YOUR PLAN IS READY' CONCLUSION */}
        {step === 6 && (
          <div className="space-y-5 text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-accent-light text-accent border border-accent/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-foreground">Your Recovery Plan is Ready!</h3>
              <p className="text-xs text-muted max-w-md mx-auto mt-1">
                Your initial baseline forecast has been constructed across all recovery phases.
              </p>
            </div>

            <div className="p-4 bg-surface rounded-xl border border-border text-left max-w-md mx-auto space-y-2 text-xs">
              <div className="flex justify-between font-bold text-foreground">
                <span>Calculated Total Duration:</span>
                <span className="text-accent text-sm">{lengthPreview.totalDays} Days</span>
              </div>
              <p className="text-muted leading-relaxed text-[11px]">
                {lengthPreview.reason}
              </p>
              <div className="pt-2 border-t border-border/60 text-[11px] text-accent font-semibold">
                ⚡ Live Adaptation Notice: This is an initial baseline forecast. Every log, check-in, or discomfort report automatically rewrites upcoming days to match your personal recovery speed.
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="bg-accent hover:bg-accent-hover text-white font-bold py-3 px-8 rounded-xl text-sm transition-all shadow-sm"
            >
              Open Live Surgery Journey Planner →
            </button>
          </div>
        )}

        {/* Wizard Footer Navigation */}
        {step <= 5 && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="text-xs font-semibold text-muted hover:text-foreground flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={() => setStep((step + 1) as any)}
              className="bg-accent hover:bg-accent-hover text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors flex items-center gap-1"
            >
              <span>{step === 5 ? 'Generate Baseline Plan' : 'Next Step'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
