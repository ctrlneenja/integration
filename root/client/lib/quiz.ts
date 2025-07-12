// client/lib/quiz.ts
import { Question } from '../../common/src/types';

/**
 * Generates a mock AI question.
 */
export async function generateQuizQuestion(topic: string, id: number = Date.now()): Promise<Question> {
  return {
    id,
    type: 'Solo',
    topic,
    text: `What is the boiling point of water at sea level?`,
    options: ['90°C', '100°C', '120°C', '80°C'],
    correctAnswerIndex: 1,
    explanation: `Water boils at 100°C (212°F) at sea level, due to the standard atmospheric pressure.`,
  };
}
