import type { Language } from "./content";
export type QuestionType = "A" | "B" | "C" | "D" | "E" | "F";
export interface QuestionOption { id: string; text: string; }
export interface Question {
  id: string;
  blockId: string;
  unitId: string;
  primaryConceptId: string;
  secondaryConceptIds: string[];
  type: QuestionType;
  difficulty: 1 | 2 | 3;
  language: Language;
  prompt: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
  sourceVersion: string;
  conceptBankVersion: string;
  testBankVersion: string;
  status: "ACTIVE" | "RETIRED";
}
