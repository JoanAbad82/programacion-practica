export interface BlockManifest {
  block_id: "B1";
  title: string;
  canonical_version: "BLOCK1_CANONICAL_V1.0";
  concept_bank_version: "B1_CONCEPT_BANK_V1.0";
  coverage_matrix_version: "B1_TEST_MATRIX_V1.0";
  test_bank_version: "BLOCK1_TEST_BANK_V1.0";
  flashcard_bank_version: "BLOCK1_FLASHCARD_BANK_V1.0";
  flashcard_coverage_version: "B1_FLASHCARD_MATRIX_V1.0";
  units: 12;
  concepts: 56;
  questions: 200;
  flashcards: 80;
  content_import_status: "IMPORTED_PHASE_2";
  language: "es";
  unit_index: string;
  concept_file: string;
  question_files: string[];
  flashcard_files: string[];
  coverage_file: string;
  flashcard_coverage_file: string;
}
