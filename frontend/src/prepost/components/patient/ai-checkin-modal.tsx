'use client';

import React, { useState } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, HelpCircle, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { checkRedFlags } from '@/lib/ai/provider';

interface AiCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: 'before' | 'after';
  language: string;
  onConfirmLogs: (confirmedLogs: Array<{ kind: string; data: Record<string, unknown> }>, doctorQuestion?: string) => void;
  onTriggerEmergency: (reason: string) => void;
  onSwitchToQuickForm: () => void;
}

interface StepQuestion {
  id: string;
  title: string;
  question: string;
  quickReplies: string[];
  kind: 'meal' | 'workout' | 'medicine' | 'pain' | 'vital';
}

export const AiCheckinModal: React.FC<AiCheckinModalProps> = ({
  isOpen,
  onClose,
  stage,
  language,
  onConfirmLogs,
  onTriggerEmergency,
  onSwitchToQuickForm,
}) => {
  const isHindi = language === 'hi';

  const questions: StepQuestion[] = stage === 'before'
    ? [
        {
          id: 'q1',
          title: isHindi ? 'भोजन' : 'Meals',
          question: isHindi
            ? 'क्या आपने आज डॉक्टर द्वारा सुझाया गया कम नमक वाला स्वस्थ भोजन लिया?'
            : 'Did you follow your prescribed pre-op low-sodium meal plan today?',
          quickReplies: isHindi ? ['हाँ, सभी भोजन', 'एक भोजन छूट गया', 'नहीं'] : ['Yes, all meals', 'Skipped one meal', 'No'],
          kind: 'meal',
        },
        {
          id: 'q2',
          title: isHindi ? 'व्यायाम' : 'Workout',
          question: isHindi
            ? 'क्या आपने आज अपनी 15 मिनट की सैर और गहरी सांस के व्यायाम पूरे किए?'
            : 'Did you complete your 15-minute gentle walk and deep breathing exercises?',
          quickReplies: isHindi ? ['हाँ, पूरे किए', 'थोड़ा बहुत', 'नहीं, छूट गया'] : ['Yes, completed', 'Partially done', 'No, skipped'],
          kind: 'workout',
        },
        {
          id: 'q3',
          title: isHindi ? 'दवाएं' : 'Medicines',
          question: isHindi
            ? 'क्या आपने डॉक्टर के निर्देशानुसार अपनी दवाएं ली हैं या रोकी हैं?'
            : 'Did you take (or stop) your pre-surgery medications exactly as instructed?',
          quickReplies: isHindi ? ['हाँ, बिल्कुल', 'एक खुराक छूट गई', 'अस्पष्ट है'] : ['Yes, exactly', 'Missed a dose', 'Not sure'],
          kind: 'medicine',
        },
        {
          id: 'q4',
          title: isHindi ? 'स्वास्थ्य स्थिति' : 'Vitals & General',
          question: isHindi
            ? 'आज आप कैसा महसूस कर रहे हैं? क्या आज का रक्तचाप या शुगर सामान्य रहा?'
            : 'How are you feeling today? Any unusual dizziness, blood pressure, or blood sugar readings?',
          quickReplies: isHindi ? ['बिल्कुल ठीक', 'हल्की थकान', 'सवाल है'] : ['Feeling great', 'Mild fatigue', 'Have a question'],
          kind: 'vital',
        },
      ]
    : [
        {
          id: 'q1',
          title: isHindi ? 'दर्द स्तर' : 'Pain Level',
          question: isHindi
            ? '0 से 10 के पैमाने पर, आज आपका सीने या चीरे का दर्द स्तर कितना है?'
            : 'On a scale of 0 to 10, what is your current chest or incision pain score?',
          quickReplies: ['0 (None)', '2 (Mild)', '4 (Moderate)', '8+ (Severe)'],
          kind: 'pain',
        },
        {
          id: 'q2',
          title: isHindi ? 'भोजन' : 'Healing Diet',
          question: isHindi
            ? 'क्या आपने आज रिकवरी के लिए पौष्टिक हल्का भोजन आसानी से खाया?'
            : 'Were you able to comfortably eat your post-surgery recovery meals today?',
          quickReplies: isHindi ? ['हाँ, पूरा खाया', 'कम भूख लगी', 'नहीं खाया'] : ['Yes, ate well', 'Low appetite', 'Skipped'],
          kind: 'meal',
        },
        {
          id: 'q3',
          title: isHindi ? 'दवाएं' : 'Dose Reminders',
          question: isHindi
            ? 'क्या आपने अपनी निर्धारित दर्द निवारक और हृदय की दवाएं समय पर ली हैं?'
            : 'Did you take all your prescribed post-op cardiac medications on time?',
          quickReplies: isHindi ? ['हाँ, सभी लीं', 'एक छूट गई', 'उलझन है'] : ['Yes, all taken', 'Missed one dose', 'Confused about dose'],
          kind: 'medicine',
        },
        {
          id: 'q4',
          title: isHindi ? 'पुनर्वास' : 'Rehab & Breathing',
          question: isHindi
            ? 'क्या आपने आज अपने फेफड़ों के लिए सांस के व्यायाम (स्पिरोमीटर) किए?'
            : 'Did you complete your gentle breathing exercises and sternal posture care?',
          quickReplies: isHindi ? ['हाँ, पूरे किए', 'थोड़े किए', 'दर्द के कारण नहीं'] : ['Yes, done', 'Done partially', 'Skipped due to pain'],
          kind: 'workout',
        },
      ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [collectedAnswers, setCollectedAnswers] = useState<Array<{ stepId: string; question: string; answer: string; kind: string }>>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [doctorQuestionNote, setDoctorQuestionNote] = useState<string | null>(null);
  const [aiClarification, setAiClarification] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];

  const handleProcessAnswer = (answerText: string) => {
    // 1. Red-flag symptom check BEFORE any AI processing
    const redFlagCheck = checkRedFlags(answerText);
    if (redFlagCheck.flagged) {
      onTriggerEmergency(`Emergency red-flag symptom detected: "${redFlagCheck.matchedKeyword}"`);
      onClose();
      return;
    }

    // 2. Doctor consultation check: If user asks medical advice, disclaim and offer note
    const lower = answerText.toLowerCase();
    if (lower.includes('should i stop') || lower.includes('can i take') || lower.includes('is it safe') || lower.includes('kya mai')) {
      setAiClarification("I cannot give medical advice or change prescriptions. Please ask your cardiologist. I've noted this as a 'Question for your Doctor'.");
      setDoctorQuestionNote(answerText);
    }

    // 3. Store answer
    const newAnswers = [
      ...collectedAnswers.filter((a) => a.stepId !== currentQ.id),
      { stepId: currentQ.id, question: currentQ.question, answer: answerText, kind: currentQ.kind },
    ];
    setCollectedAnswers(newAnswers);
    setUserInput('');

    // 4. Advance or show confirm summary
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsConfirming(true);
    }
  };

  const handleConfirmAndSave = () => {
    // Format confirmed structured logs
    const confirmedLogs = collectedAnswers.map((a) => {
      if (a.kind === 'pain') {
        const match = a.answer.match(/\b([0-9]|10)\b/);
        const score = match ? parseInt(match[1], 10) : 3;
        return { kind: 'pain', data: { score, notes: a.answer } };
      }
      if (a.kind === 'meal') {
        const skipped = a.answer.toLowerCase().includes('skip') || a.answer.toLowerCase().includes('नहीं');
        return { kind: 'meal', data: { status: skipped ? 'skipped' : 'eaten', notes: a.answer } };
      }
      if (a.kind === 'workout') {
        const done = !a.answer.toLowerCase().includes('skip') && !a.answer.toLowerCase().includes('नहीं');
        return { kind: 'workout', data: { status: done ? 'done' : 'skipped', notes: a.answer } };
      }
      if (a.kind === 'medicine') {
        const missed = a.answer.toLowerCase().includes('miss') || a.answer.toLowerCase().includes('छूट');
        return { kind: 'medicine', data: { status: missed ? 'missed' : 'taken', notes: a.answer } };
      }
      return { kind: 'vital', data: { notes: a.answer } };
    });

    onConfirmLogs(confirmedLogs, doctorQuestionNote || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-border w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-light text-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                {isHindi ? 'दैनिक स्वास्थ्य चेक-इन' : 'Daily Health Check-in'}
              </h3>
              <p className="text-xs text-muted">
                {isConfirming
                  ? (isHindi ? 'सत्यापन और पुष्टि' : 'Review & Confirm')
                  : `${isHindi ? 'प्रश्न' : 'Question'} ${currentIndex + 1} of ${questions.length}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSwitchToQuickForm}
              className="text-xs text-accent hover:underline font-medium"
            >
              {isHindi ? 'त्वरित फॉर्म' : 'Use Quick Form'}
            </button>
            <button onClick={onClose} className="p-1 rounded-md text-muted hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {aiClarification && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{aiClarification}</p>
              </div>
            </div>
          )}

          {!isConfirming ? (
            <div className="space-y-6">
              {/* Question bubble */}
              <div className="bg-surface border border-border rounded-2xl p-5">
                <span className="text-xs font-bold text-accent uppercase tracking-wider block mb-1">
                  {currentQ.title}
                </span>
                <p className="text-lg font-medium text-foreground leading-relaxed">
                  {currentQ.question}
                </p>
              </div>

              {/* Quick Reply Buttons */}
              <div>
                <span className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  {isHindi ? 'त्वरित उत्तर:' : 'Quick Replies:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentQ.quickReplies.map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => handleProcessAnswer(reply)}
                      className="px-4 py-2.5 rounded-xl bg-white border border-border hover:border-accent hover:bg-accent-light hover:text-accent font-medium text-sm text-foreground transition-all shadow-sm"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>

              {/* Freeform Type */}
              <div className="pt-2">
                <span className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  {isHindi ? 'या विस्तार से लिखें:' : 'Or type your answer:'}
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && userInput.trim()) {
                        handleProcessAnswer(userInput.trim());
                      }
                    }}
                    placeholder={isHindi ? 'अपना उत्तर यहां लिखें...' : 'Type specific notes or readings...'}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                  <button
                    onClick={() => userInput.trim() && handleProcessAnswer(userInput.trim())}
                    disabled={!userInput.trim()}
                    className="px-4 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors"
                  >
                    <CornerDownLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Confirm Before Save Summary Card (Hard Rule 7) */
            <div className="space-y-4">
              <div className="p-4 bg-accent-light/50 border border-accent/20 rounded-xl">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  {isHindi ? 'यहाँ है जो हमने समझा:' : 'Here is what I understood:'}
                </h4>
                <p className="text-xs text-muted">
                  {isHindi
                    ? 'कृपया समीक्षा करें। पुष्टि किए जाने तक कुछ भी सहेजा नहीं जाएगा।'
                    : 'Nothing is saved until you confirm. You can edit any answer below.'}
                </p>
              </div>

              <div className="space-y-2">
                {collectedAnswers.map((item, index) => (
                  <div key={index} className="p-3 bg-surface border border-border rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted font-medium">{item.kind.toUpperCase()}</span>
                      <p className="text-sm font-semibold text-foreground">{item.answer}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsConfirming(false);
                        setCurrentIndex(index);
                      }}
                      className="text-xs text-accent font-semibold hover:underline"
                    >
                      {isHindi ? 'संशोधन करें' : 'Edit'}
                    </button>
                  </div>
                ))}

                {doctorQuestionNote && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" /> Note for Doctor:
                    </span>
                    <p className="text-xs text-blue-900 mt-0.5">"{doctorQuestionNote}"</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface flex items-center justify-between">
          <p className="text-xs text-muted">
            Safety: Emergency check active.
          </p>

          {isConfirming && (
            <button
              onClick={handleConfirmAndSave}
              className="bg-accent hover:bg-accent-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>{isHindi ? 'पुष्टि करें और सहेजें' : 'Confirm & Save Logs'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
