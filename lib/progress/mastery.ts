import type { BlockId } from "../../types/block";
import { blockIdFromContentId, studyUnitKey } from "../../types/block";
import type { Concept } from "../../types/content";
import type { FlashcardHistorySnapshot } from "../../types/flashcard-session";
import type { QuizHistorySnapshot } from "../../types/quiz";
import type {
  BlockProgressSummary,
  ConceptProgress,
  MasteryEvidence,
  MasteryState,
  MasteryStateCounts,
  ProgressModel,
  UnitProgressSummary,
} from "../../types/progress";
import type { StudyProgressSnapshot, StudyUnitMeta, StudyUnitStatus } from "../../types/study";

export const MASTERY_WINDOW_SIZE = 12;

const QUIZ_WEIGHTS: Record<1 | 2 | 3, number> = {
  1: 1.5,
  2: 2,
  3: 2.5,
};

const FLASHCARD_WEIGHT = 1;
const STUDY_IN_PROGRESS_WEIGHT = 0.35;
const STUDY_STUDIED_WEIGHT = 0.5;

const FLASHCARD_VALUES = {
  MISS: 0,
  DOUBT: 0.5,
  KNOW: 1,
} as const;

function safeTime(value: string | null | undefined): number {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function stateCounts(values: ConceptProgress[]): MasteryStateCounts {
  return {
    new: values.filter((item) => item.masteryState === "NEW").length,
    learning: values.filter((item) => item.masteryState === "LEARNING").length,
    understood: values.filter((item) => item.masteryState === "UNDERSTOOD").length,
    mastered: values.filter((item) => item.masteryState === "MASTERED").length,
  };
}

export function masteryState({
  score,
  interactions,
  objectiveInteractions,
  recentSignificantFailure,
}: {
  score: number;
  interactions: number;
  objectiveInteractions: number;
  recentSignificantFailure: boolean;
}): MasteryState {
  if (interactions === 0) return "NEW";

  if (
    score >= 85 &&
    interactions >= 6 &&
    objectiveInteractions >= 3 &&
    !recentSignificantFailure
  ) {
    return "MASTERED";
  }

  if (score >= 70 && interactions >= 4 && objectiveInteractions >= 2) {
    return "UNDERSTOOD";
  }

  return "LEARNING";
}

function weightedScore(evidence: MasteryEvidence[]): number {
  if (evidence.length === 0) return 0;

  let weighted = 0;
  let totalWeight = 0;

  for (const item of evidence) {
    weighted += item.value * item.weight;
    totalWeight += item.weight;
  }

  if (totalWeight <= 0) return 0;
  return Math.round((weighted / totalWeight) * 100);
}

function studyStatusFor(
  studyProgress: StudyProgressSnapshot,
  blockId: BlockId,
  unitId: string,
): UnitStudyProgressView {
  const blockUnit = studyProgress.units[studyUnitKey(blockId, unitId)];
  const legacy = blockId === "B1" ? studyProgress.units[unitId] : undefined;
  return blockUnit ?? legacy ?? null;
}

type UnitStudyProgressView =
  | StudyProgressSnapshot["units"][string]
  | null
  | undefined;

function buildStudyEvidence({
  concept,
  studyProgress,
}: {
  concept: Concept;
  studyProgress: StudyProgressSnapshot;
}): MasteryEvidence[] {
  const blockId = (concept.blockId as BlockId) ?? "B1";
  const progress = studyStatusFor(studyProgress, blockId, concept.unitId);
  if (!progress || progress.status === "NOT_STARTED") return [];

  const studied = progress.status === "STUDIED";
  const occurredAt = studied
    ? progress.studiedAt ?? progress.updatedAt
    : progress.startedAt ?? progress.updatedAt;

  return [{
    id: `study:${blockId}:${concept.unitId}:${concept.conceptId}`,
    kind: "STUDY",
    conceptId: concept.conceptId,
    unitId: concept.unitId,
    occurredAt,
    value: studied ? 0.65 : 0.35,
    weight: studied ? STUDY_STUDIED_WEIGHT : STUDY_IN_PROGRESS_WEIGHT,
    significantFailure: false,
    detail: studied ? "Unidad estudiada" : "Unidad iniciada",
  }];
}

function buildQuizEvidence({
  concept,
  quizHistory,
}: {
  concept: Concept;
  quizHistory: QuizHistorySnapshot;
}): MasteryEvidence[] {
  const evidence: MasteryEvidence[] = [];

  for (const session of Object.values(quizHistory.sessions)) {
    const blockId =
      (session.blockId as BlockId | undefined) ??
      blockIdFromContentId(session.sessionId) ??
      (session.questionIds ?? [])
        .map((id) => blockIdFromContentId(id))
        .find((value): value is BlockId => Boolean(value)) ??
      "B1";

    if (blockId !== concept.blockId) continue;

    session.attempts.forEach((attempt, index) => {
      if (attempt.conceptId !== concept.conceptId) return;

      evidence.push({
        id: `quiz:${session.sessionId}:${attempt.questionId}:${index}`,
        kind: "QUIZ",
        conceptId: concept.conceptId,
        unitId: attempt.unitId,
        occurredAt: attempt.answeredAt,
        value: attempt.correct ? 1 : 0,
        weight: QUIZ_WEIGHTS[attempt.difficulty],
        significantFailure: !attempt.correct && attempt.difficulty >= 2,
        detail: `${attempt.questionId} · N${attempt.difficulty} · ${attempt.correct ? "correcta" : "incorrecta"}`,
      });
    });
  }

  return evidence;
}

function buildFlashcardEvidence({
  concept,
  flashcardHistory,
}: {
  concept: Concept;
  flashcardHistory: FlashcardHistorySnapshot;
}): MasteryEvidence[] {
  const evidence: MasteryEvidence[] = [];

  for (const session of Object.values(flashcardHistory.sessions)) {
    const blockId =
      (session.blockId as BlockId | undefined) ??
      (session.cardIds ?? [])
        .map((id) => blockIdFromContentId(id))
        .find((value): value is BlockId => Boolean(value)) ??
      "B1";

    if (blockId !== concept.blockId) continue;

    session.attempts.forEach((attempt, index) => {
      if (attempt.conceptId !== concept.conceptId) return;

      evidence.push({
        id: `flashcard:${session.sessionId}:${attempt.cardId}:${index}`,
        kind: "FLASHCARD",
        conceptId: concept.conceptId,
        unitId: concept.unitId,
        occurredAt: attempt.ratedAt,
        value: FLASHCARD_VALUES[attempt.rating],
        weight: FLASHCARD_WEIGHT,
        significantFailure: attempt.rating === "MISS",
        detail: `${attempt.cardId} · ${attempt.rating}`,
      });
    });
  }

  return evidence;
}

export function buildConceptEvidence({
  concept,
  quizHistory,
  flashcardHistory,
  studyProgress,
}: {
  concept: Concept;
  quizHistory: QuizHistorySnapshot;
  flashcardHistory: FlashcardHistorySnapshot;
  studyProgress: StudyProgressSnapshot;
}): MasteryEvidence[] {
  return [
    ...buildStudyEvidence({ concept, studyProgress }),
    ...buildQuizEvidence({ concept, quizHistory }),
    ...buildFlashcardEvidence({ concept, flashcardHistory }),
  ].sort((a, b) => safeTime(b.occurredAt) - safeTime(a.occurredAt));
}

export function buildConceptProgress({
  concept,
  quizHistory,
  flashcardHistory,
  studyProgress,
}: {
  concept: Concept;
  quizHistory: QuizHistorySnapshot;
  flashcardHistory: FlashcardHistorySnapshot;
  studyProgress: StudyProgressSnapshot;
}): ConceptProgress {
  const blockId = (concept.blockId as BlockId) ?? "B1";
  const evidence = buildConceptEvidence({
    concept,
    quizHistory,
    flashcardHistory,
    studyProgress,
  });
  const recent = evidence.slice(0, MASTERY_WINDOW_SIZE);
  const activeRecallRecent = recent.filter((item) => item.kind !== "STUDY");
  const recentSignificantFailure = activeRecallRecent
    .slice(0, 3)
    .some((item) => item.significantFailure);

  const quizEvidence = evidence.filter((item) => item.kind === "QUIZ");
  const flashEvidence = evidence.filter((item) => item.kind === "FLASHCARD");
  const score = weightedScore(recent);
  const objectiveInteractions = quizEvidence.length;

  return {
    conceptId: concept.conceptId,
    blockId,
    unitId: concept.unitId,
    name: concept.name,
    priority: concept.priority,
    questionAttempts: quizEvidence.length,
    questionCorrect: quizEvidence.filter((item) => item.value === 1).length,
    flashcardSeen: flashEvidence.length,
    flashcardKnow: flashEvidence.filter((item) => item.value === 1).length,
    flashcardDoubt: flashEvidence.filter((item) => item.value === 0.5).length,
    flashcardMiss: flashEvidence.filter((item) => item.value === 0).length,
    studyStatus:
      studyStatusFor(studyProgress, blockId, concept.unitId)?.status ??
      "NOT_STARTED",
    interactions: evidence.length,
    objectiveInteractions,
    evidenceWindowCount: recent.length,
    lastInteractionAt: evidence[0]?.occurredAt ?? null,
    recentSignificantFailure,
    masteryScore: score,
    masteryState: masteryState({
      score,
      interactions: evidence.length,
      objectiveInteractions,
      recentSignificantFailure,
    }),
  };
}

function coveragePercent(progress: ConceptProgress[]): number {
  if (progress.length === 0) return 0;
  const started = progress.filter((item) => item.masteryState !== "NEW").length;
  return Math.round((started / progress.length) * 100);
}

function averageScore(progress: ConceptProgress[]): number {
  if (progress.length === 0) return 0;
  return Math.round(
    progress.reduce((sum, item) => sum + item.masteryScore, 0) / progress.length,
  );
}

function aggregateUnit({
  unit,
  concepts,
  studyStatus,
}: {
  unit: StudyUnitMeta;
  concepts: ConceptProgress[];
  studyStatus: StudyUnitStatus;
}): UnitProgressSummary {
  return {
    blockId: (unit.blockId as BlockId) ?? "B1",
    unitId: unit.unitId,
    title: unit.title,
    studyStatus,
    conceptCount: concepts.length,
    masteryScore: averageScore(concepts),
    coveragePercent: coveragePercent(concepts),
    stateCounts: stateCounts(concepts),
  };
}

function aggregateBlock({
  blockId,
  concepts,
  units,
  studyProgress,
}: {
  blockId: BlockId;
  concepts: ConceptProgress[];
  units: StudyUnitMeta[];
  studyProgress: StudyProgressSnapshot;
}): BlockProgressSummary {
  const quizAttempts = concepts.reduce(
    (sum, item) => sum + item.questionAttempts,
    0,
  );
  const quizCorrect = concepts.reduce(
    (sum, item) => sum + item.questionCorrect,
    0,
  );
  const flashcardRatings = concepts.reduce(
    (sum, item) => sum + item.flashcardSeen,
    0,
  );
  const flashcardKnow = concepts.reduce(
    (sum, item) => sum + item.flashcardKnow,
    0,
  );
  const flashcardDoubt = concepts.reduce(
    (sum, item) => sum + item.flashcardDoubt,
    0,
  );
  const flashcardMiss = concepts.reduce(
    (sum, item) => sum + item.flashcardMiss,
    0,
  );

  return {
    blockId,
    conceptCount: concepts.length,
    masteryScore: averageScore(concepts),
    coveragePercent: coveragePercent(concepts),
    stateCounts: stateCounts(concepts),
    activity: {
      studiedUnits: units.filter(
        (unit) =>
          studyStatusFor(studyProgress, blockId, unit.unitId)?.status === "STUDIED",
      ).length,
      inProgressUnits: units.filter(
        (unit) =>
          studyStatusFor(studyProgress, blockId, unit.unitId)?.status === "IN_PROGRESS",
      ).length,
      quizAttempts,
      quizCorrect,
      quizAccuracy: quizAttempts > 0
        ? Math.round((quizCorrect / quizAttempts) * 100)
        : 0,
      flashcardRatings,
      flashcardKnow,
      flashcardDoubt,
      flashcardMiss,
    },
  };
}

export function buildProgressModel({
  concepts,
  units,
  quizHistory,
  flashcardHistory,
  studyProgress,
}: {
  concepts: Concept[];
  units: StudyUnitMeta[];
  quizHistory: QuizHistorySnapshot;
  flashcardHistory: FlashcardHistorySnapshot;
  studyProgress: StudyProgressSnapshot;
}): ProgressModel {
  const conceptProgressList = concepts.map((concept) =>
    buildConceptProgress({
      concept,
      quizHistory,
      flashcardHistory,
      studyProgress,
    }),
  );

  const conceptProgress = Object.fromEntries(
    conceptProgressList.map((item) => [item.conceptId, item]),
  );

  const unitProgressEntries = units.map((unit) => {
    const blockId = (unit.blockId as BlockId) ?? "B1";
    const unitConcepts = conceptProgressList.filter(
      (item) => item.blockId === blockId && item.unitId === unit.unitId,
    );
    const summary = aggregateUnit({
      unit,
      concepts: unitConcepts,
      studyStatus:
        studyStatusFor(studyProgress, blockId, unit.unitId)?.status ??
        "NOT_STARTED",
    });
    return [studyUnitKey(blockId, unit.unitId), summary] as const;
  });

  const blockIds = Array.from(
    new Set(units.map((unit) => (unit.blockId as BlockId) ?? "B1")),
  );

  const blocks = Object.fromEntries(
    blockIds.map((blockId) => [
      blockId,
      aggregateBlock({
        blockId,
        concepts: conceptProgressList.filter((item) => item.blockId === blockId),
        units: units.filter(
          (unit) => ((unit.blockId as BlockId) ?? "B1") === blockId,
        ),
        studyProgress,
      }),
    ]),
  ) as Partial<Record<BlockId, BlockProgressSummary>>;

  const b1Summary =
    blocks.B1 ??
    aggregateBlock({ blockId: "B1", concepts: [], units: [], studyProgress });

  const latestTimes = conceptProgressList
    .map((item) => item.lastInteractionAt)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => safeTime(b) - safeTime(a));

  return {
    schemaVersion: "PROGRESS_MODEL_V1",
    generatedAt: latestTimes[0] ?? null,
    concepts: conceptProgress,
    units: Object.fromEntries(unitProgressEntries),
    block: b1Summary,
    blocks: {
      B1: b1Summary,
      B2:
        blocks.B2 ??
        aggregateBlock({ blockId: "B2", concepts: [], units: [], studyProgress }),
    },
  };
}

export function masteryScoreMap(model: ProgressModel): Record<string, number> {
  return Object.fromEntries(
    Object.values(model.concepts).map((item) => [item.conceptId, item.masteryScore]),
  );
}
