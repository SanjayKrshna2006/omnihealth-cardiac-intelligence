import { describe, it, expect } from 'vitest';
import { MockProvider, checkRedFlags } from './provider';

describe('AI Provider Layer & Red-Flag Checks', () => {
  const provider = new MockProvider();

  it('detects emergency red-flag keywords deterministically before AI calls', () => {
    // English symptoms
    expect(checkRedFlags('I have sudden chest pain and sweating').flagged).toBe(true);
    expect(checkRedFlags('I am having trouble breathing').flagged).toBe(true);
    expect(checkRedFlags('Felt severe pain near surgical wound').flagged).toBe(true);

    // Hindi symptoms
    expect(checkRedFlags('मुझे सीने में दर्द हो रहा है').flagged).toBe(true);
    expect(checkRedFlags('अचानक सांस लेने में तकलीफ हुई').flagged).toBe(true);

    // Non-flagged regular response
    expect(checkRedFlags('I ate my oatmeal and walked for 10 minutes').flagged).toBe(false);
  });

  it('asks appropriate check-in questions by stage with quick replies', async () => {
    const preOp = await provider.askQuestion({ stage: 'before', language: 'en', stepName: 'meals' });
    expect(preOp.question.length).toBeGreaterThan(0);
    expect(preOp.quickReplies.length).toBeGreaterThan(0);

    const postOp = await provider.askQuestion({ stage: 'after', language: 'en', stepName: 'pain' });
    expect(postOp.question.toLowerCase()).toContain('pain');
    expect(postOp.quickReplies.some((r) => r.includes('None') || r.includes('0'))).toBe(true);
  });

  it('extracts structured log data from answers', async () => {
    const painResult = await provider.extractLog({
      stage: 'after',
      language: 'en',
      question: 'What is your current pain level?',
      userAnswer: 'It feels like a 4 today',
    });

    expect(painResult.kind).toBe('pain');
    expect(painResult.data.score).toBe(4);
  });
});
