export type Subject =
  | "math"
  | "science"
  | "english"
  | "geography"
  | "history"
  | "computer_science"
  | "business"
  | "economics";

export interface Homework {
  id: string;
  userId: string;
  subject: Subject;
  title: string;
  description: string | null;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

export interface GradeEntry {
  id: string;
  userId: string;
  subject: Subject;
  assignmentName: string;
  score: number;
  maxScore: number;
  weight: number;
  date: string;
}

export interface StudyPlanItem {
  id: string;
  userId: string;
  subject: Subject;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  completed: boolean;
}

export interface Exam {
  id: string;
  userId: string;
  subject: Subject;
  title: string;
  date: string;
  location: string | null;
}

export interface ReadingEntry {
  id: string;
  userId: string;
  title: string;
  author: string | null;
  totalPages: number | null;
  pagesRead: number;
  status: "reading" | "completed" | "wishlist";
  startedAt: string | null;
  finishedAt: string | null;
}

export interface StudySession {
  id: string;
  userId: string;
  subject: Subject | null;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
}

export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  difficulty: QuestionDifficulty;
}

export interface Quiz {
  id: string;
  userId: string;
  subject: Subject;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: number[];
  score: number;
  totalQuestions: number;
  completedAt: string;
}

export interface QuizRecommendation {
  books: string[];
  courses: string[];
  studyPlans: string[];
  practiceExercises: string[];
}

export type MiniGameKey =
  | "memory_challenge"
  | "focus_challenge"
  | "sudoku"
  | "logic_puzzles"
  | "vocabulary_games"
  | "math_battle"
  | "science_challenge";

export interface MiniGameScore {
  id: string;
  userId: string;
  game: MiniGameKey;
  score: number;
  playedAt: string;
}

export const SUBJECTS: Subject[] = [
  "math",
  "science",
  "english",
  "geography",
  "history",
  "computer_science",
  "business",
  "economics",
];

export const MINI_GAMES: MiniGameKey[] = [
  "memory_challenge",
  "focus_challenge",
  "sudoku",
  "logic_puzzles",
  "vocabulary_games",
  "math_battle",
  "science_challenge",
];
