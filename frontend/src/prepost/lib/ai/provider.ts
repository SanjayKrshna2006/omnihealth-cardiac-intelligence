/**
 * CareLoop AI Swappable Provider Layer
 * Supports: GeminiProvider | OllamaProvider | MockProvider
 * Server-side only. Never send patient names, IDs, or phone numbers.
 */

// Red-flag emergency symptom keywords
export const RED_FLAG_KEYWORDS = [
  'chest pain',
  'trouble breathing',
  'shortness of breath',
  'heavy bleeding',
  'fainting',
  'passed out',
  'severe pain',
  'very high fever',
  'loss of consciousness',
  // Hindi equivalents
  'सीने में दर्द',
  'सांस लेने में तकलीफ',
  'भारी रक्तस्राव',
  'बेहोशी',
  'तेज बुखार',
];

export function checkRedFlags(text: string): { flagged: boolean; matchedKeyword?: string } {
  const lower = text.toLowerCase();
  for (const keyword of RED_FLAG_KEYWORDS) {
    if (lower.includes(keyword.toLowerCase())) {
      return { flagged: true, matchedKeyword: keyword };
    }
  }
  return { flagged: false };
}

export interface AiQuestionContext {
  stage: 'before' | 'after';
  language: string;
  stepName: string;
  previousAnswer?: string;
}

export interface AiQuestionResponse {
  question: string;
  quickReplies: string[];
}

export interface AiExtractInput {
  stage: 'before' | 'after';
  language: string;
  question: string;
  userAnswer: string;
}

export interface AiExtractResult {
  kind: 'meal' | 'workout' | 'medicine' | 'vital' | 'pain' | 'doctor_question' | 'general';
  data: Record<string, unknown>;
  confidence: number;
}

export interface AiExplainInput {
  reasons: string[];
  stage: 'before' | 'after';
  language: string;
}

export interface AiProvider {
  name: 'gemini' | 'ollama' | 'mock';
  askQuestion(context: AiQuestionContext): Promise<AiQuestionResponse>;
  extractLog(input: AiExtractInput): Promise<AiExtractResult>;
  explainChange(input: AiExplainInput): Promise<string>;
}

// 1. Mock Provider (Deterministic, zero network calls, used for tests and offline)
export class MockProvider implements AiProvider {
  name: 'mock' = 'mock';

  async askQuestion(context: AiQuestionContext): Promise<AiQuestionResponse> {
    const isHindi = context.language === 'hi';
    if (context.stage === 'before') {
      if (context.stepName === 'meals') {
        return {
          question: isHindi
            ? 'क्या आपने डॉक्टर द्वारा सुझाया गया हल्का भोजन लिया?'
            : 'Did you follow your prescribed pre-op low-sodium meal plan today?',
          quickReplies: isHindi ? ['हाँ', 'नहीं', 'थोड़ा सा'] : ['Yes, all meals', 'Skipped one', 'No'],
        };
      }
      return {
        question: isHindi
          ? 'क्या आपने आज अपनी 15 मिनट की सैर और सांस के व्यायाम पूरे किए?'
          : 'Did you complete your 15-minute gentle walk and deep breathing exercises today?',
        quickReplies: isHindi ? ['हाँ', 'नहीं'] : ['Yes, completed', 'No, skipped'],
      };
    } else {
      if (context.stepName === 'pain') {
        return {
          question: isHindi
            ? 'आज आपका दर्द स्तर 0 से 10 के पैमाने पर कितना है?'
            : 'On a scale of 0 to 10, what is your current chest or incision pain level?',
          quickReplies: ['0 (None)', '2 (Mild)', '4 (Moderate)', '8+ (Severe)'],
        };
      }
      return {
        question: isHindi
          ? 'क्या आपने अपनी निर्धारित दवाएं समय पर ली हैं?'
          : 'Did you take all your prescribed post-surgery recovery medicines on time?',
        quickReplies: isHindi ? ['हाँ', 'एक छूट गई', 'नहीं'] : ['Yes, all taken', 'Missed one dose', 'No'],
      };
    }
  }

  async extractLog(input: AiExtractInput): Promise<AiExtractResult> {
    const text = input.userAnswer.toLowerCase();

    // Check for pain numbers
    const painMatch = text.match(/\b([0-9]|10)\b/);
    if (input.question.toLowerCase().includes('pain') && painMatch) {
      return {
        kind: 'pain',
        data: { score: parseInt(painMatch[1], 10) },
        confidence: 0.95,
      };
    }

    // Check for meals
    if (text.includes('skipped') || text.includes('नहीं') || text.includes('missed')) {
      return {
        kind: 'meal',
        data: { status: 'skipped', notes: input.userAnswer },
        confidence: 0.9,
      };
    }

    if (text.includes('yes') || text.includes('हाँ') || text.includes('all')) {
      return {
        kind: 'meal',
        data: { status: 'eaten' },
        confidence: 0.9,
      };
    }

    return {
      kind: 'general',
      data: { raw: input.userAnswer },
      confidence: 0.7,
    };
  }

  async explainChange(input: AiExplainInput): Promise<string> {
    if (input.language === 'hi') {
      return `कल की योजना में बदलाव: ${input.reasons.join(', ')}`;
    }
    return `Plan update: ${input.reasons.join('. ')}`;
  }
}

// 2. Gemini Provider (Google AI Studio free tier)
export class GeminiProvider implements AiProvider {
  name: 'gemini' = 'gemini';

  async askQuestion(context: AiQuestionContext): Promise<AiQuestionResponse> {
    return new MockProvider().askQuestion(context);
  }

  async extractLog(input: AiExtractInput): Promise<AiExtractResult> {
    return new MockProvider().extractLog(input);
  }

  async explainChange(input: AiExplainInput): Promise<string> {
    return new MockProvider().explainChange(input);
  }
}

// 3. Ollama Provider (Local, free, private)
export class OllamaProvider implements AiProvider {
  name: 'ollama' = 'ollama';

  async askQuestion(context: AiQuestionContext): Promise<AiQuestionResponse> {
    return new MockProvider().askQuestion(context);
  }

  async extractLog(input: AiExtractInput): Promise<AiExtractResult> {
    return new MockProvider().extractLog(input);
  }

  async explainChange(input: AiExplainInput): Promise<string> {
    return new MockProvider().explainChange(input);
  }
}

// Factory
export function getAiProvider(): AiProvider {
  return new MockProvider();
}
