import {
  blockIdFromSlug,
  blockSlugOf,
  type BlockId,
  type BlockSlug,
} from "@/types/block";

/**
 * Browser-safe block helpers shared by the quiz/flashcard setup components and
 * the statically exported session and result routes. These stay free of
 * `node:fs` so they can be imported into client components.
 */
export function parseBlockParam(
  value: string | null | undefined,
  fallback: BlockId = "B1",
): BlockId {
  return blockIdFromSlug(value) ?? fallback;
}

export function blockQueryValue(blockId: BlockId): BlockSlug {
  return blockSlugOf(blockId);
}

/**
 * Resolves the block from a list of canonical ids (`B1-Q0001`, `B2-FC0003`).
 * Returns `null` when the ids are empty or mix blocks, which callers treat as
 * an invalid session.
 */
export function blockFromContentIds(ids: readonly string[]): BlockId | null {
  let resolved: BlockId | null = null;

  for (const id of ids) {
    const matches = id.trim().match(/^(B1|B2)[-_]/i);
    if (!matches) return null;
    const candidate = matches[1].toUpperCase() as BlockId;
    if (resolved && resolved !== candidate) return null;
    resolved = candidate;
  }

  return resolved;
}
