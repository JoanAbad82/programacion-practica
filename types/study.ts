export type StudyUnitStatus = "NOT_STARTED" | "IN_PROGRESS" | "STUDIED";

export interface StudyUnitMeta {
  blockId: string;
  unitId: string;
  title: string;
  objective: string;
  order: number;
  canonicalFile: string;
  sourceVersion: string;
  status: "ACTIVE";
}

export type StudyContentBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "code"; language: string; code: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "quote"; text: string };

export interface StudySection {
  id: string;
  title: string;
  blocks: StudyContentBlock[];
}

export interface StudyUnitDocument extends StudyUnitMeta {
  slug: string;
  sections: StudySection[];
}

export interface UnitStudyProgress {
  unitId: string;
  status: StudyUnitStatus;
  startedAt: string | null;
  studiedAt: string | null;
  updatedAt: string;
}

export interface StudyProgressSnapshot {
  schemaVersion: "STUDY_PROGRESS_V1";
  units: Record<string, UnitStudyProgress>;
}
