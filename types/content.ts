export type Language = "COMMON" | "PYTHON" | "POWERSHELL" | "PYTHON_POWERSHELL";
export type Priority = "CRITICAL" | "HIGH" | "MEDIUM";
export type Competency = "R" | "I" | "A" | "D";

export interface Concept {
  conceptId: string;
  blockId: string;
  unitId: string;
  name: string;
  definition: string;
  language: Language;
  priority: Priority;
  difficultyMin: 1 | 2 | 3;
  difficultyMax: 1 | 2 | 3;
  competencies: Competency[];
  sourceVersion: string;
  status: "ACTIVE" | "RETIRED";
}
