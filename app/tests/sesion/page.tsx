import Link from "next/link";
import { QuizSession } from "@/components/quiz/quiz-session";
import { getBlock1Questions } from "@/lib/content/quiz-content";
import type {
  QuizDifficultyFilter,
  QuizFilters,
  QuizLanguageFilter,
  QuizMode,
  QuizSessionConfig,
  QuizSessionSize,
  QuizTypeFilter,
} from "@/types/quiz";

function parseMode(value: string | undefined): QuizMode | null {
  switch (value) {
    case "block":
      return "BLOCK";
    case "unit":
      return "UNIT";
    case "errors":
      return "ERRORS";
    case "adaptive":
      return "ADAPTIVE";
    default:
      return null;
  }
}

function parseSize(value: string | undefined): QuizSessionSize | null {
  const parsed = Number(value);
  return parsed === 10 || parsed === 20 || parsed === 30 ? parsed : null;
}

function parseDifficulty(
  value: string | undefined,
): QuizDifficultyFilter | null {
  if (value === "ALL") return "ALL";
  const parsed = Number(value);
  return parsed === 1 || parsed === 2 || parsed === 3 ? parsed : null;
}

function parseFilters(params: {
  language?: string;
  difficulty?: string;
  type?: string;
}): QuizFilters | null {
  const languages: QuizLanguageFilter[] = [
    "ALL",
    "COMMON",
    "PYTHON",
    "POWERSHELL",
    "PYTHON_POWERSHELL",
  ];
  const types: QuizTypeFilter[] = ["ALL", "A", "B", "C", "D", "E", "F"];

  const language = languages.includes(
    params.language as QuizLanguageFilter,
  )
    ? (params.language as QuizLanguageFilter)
    : null;
  const difficulty = parseDifficulty(params.difficulty);
  const questionType = types.includes(params.type as QuizTypeFilter)
    ? (params.type as QuizTypeFilter)
    : null;

  if (!language || !difficulty || !questionType) return null;

  return { language, difficulty, questionType };
}

export default async function QuizSessionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const sessionId = first(raw.sid);
  const seedValue = Number(first(raw.seed));
  const mode = parseMode(first(raw.mode));
  const requestedSize = parseSize(first(raw.size));
  const unit = first(raw.unit)?.toUpperCase() ?? null;
  const filters = parseFilters({
    language: first(raw.language),
    difficulty: first(raw.difficulty),
    type: first(raw.type),
  });
  const ids = (first(raw.ids) ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const questions = await getBlock1Questions();
  const byId = new Map(questions.map((question) => [question.id, question]));
  const uniqueIds = new Set(ids);

  const valid =
    Boolean(sessionId) &&
    Number.isInteger(seedValue) &&
    seedValue >= 0 &&
    seedValue <= 4294967295 &&
    mode !== null &&
    requestedSize !== null &&
    filters !== null &&
    ids.length >= 1 &&
    ids.length <= 30 &&
    uniqueIds.size === ids.length &&
    ids.every((id) => byId.has(id)) &&
    (mode !== "UNIT" || /^U(?:0[1-9]|1[0-2])$/.test(unit ?? ""));

  if (!valid || !sessionId || !mode || !requestedSize || !filters) {
    return (
      <section className="quiz-session-state">
        <span className="eyebrow">Sesión no válida</span>
        <h1>No se puede reconstruir este test.</h1>
        <p>
          Vuelve al configurador para generar una sesión con parámetros
          válidos.
        </p>
        <Link className="button primary" href="/tests">Volver a Tests</Link>
      </section>
    );
  }

  const selectedQuestions = ids
    .map((id) => byId.get(id))
    .filter((question): question is NonNullable<typeof question> =>
      Boolean(question),
    );

  const config: QuizSessionConfig = {
    sessionId,
    seed: seedValue,
    mode,
    unitId: mode === "UNIT" ? unit : null,
    requestedSize,
    questionIds: ids,
    filters,
  };

  return <QuizSession config={config} questions={selectedQuestions} />;
}
