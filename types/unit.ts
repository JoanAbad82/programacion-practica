export interface StudyUnit {
  blockId: "B1";
  unitId: `U${string}`;
  title: string;
  objective: string;
  order: number;
  canonicalFile: string;
  sourceVersion: "BLOCK1_CANONICAL_V1.0";
  status: "ACTIVE" | "RETIRED";
}
