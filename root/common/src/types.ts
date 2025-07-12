// common/src/types.ts

export type PlayerRole = 'Brainiac' | 'Clueless';
export type PlayerStatus = 'Alive' | 'Ghost' | 'Disconnected';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  status: PlayerStatus;
  score: number;
}

export type QuestionType = 'Solo' | 'Group';

export interface Question {
  id: number;
  type: QuestionType;
  topic: string;
  text: string;
  options: [string, string, string, string];
  correctAnswerIndex: number;
  explanation: string;
}

export type BrainiacQuestion = Omit<Question, 'correctAnswerIndex' | 'explanation'>;
export type CluelessQuestion = Omit<Question, 'explanation'>;

export interface ChatMessage {
  sender: string;
  message: string;
  timestamp: number;
}

export interface GameState {
  players: Player[];
  currentQuestion: Question | null;
  round: number;
}
