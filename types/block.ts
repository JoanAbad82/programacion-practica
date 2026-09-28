/**
 * Multi-block content identity.
 *
 * A block identifier (`B1`/`B2`) is the only globally unique way to name a
 * unit, because both blocks reuse the unit ids `U01`..`U12`. The URL slug
 * (`b1`/`b2`) is the lowercase, link-safe form used in routes and query
 * strings.
 */
export type BlockId = "B1" | "B2";
export type BlockSlug = "b1" | "b2";

export const BLOCK_IDS = ["B1", "B2"] as const satisfies readonly BlockId[];

export const BLOCK_SLUGS = {
  B1: "b1",
  B2: "b2",
} as const satisfies Record<BlockId, BlockSlug>;

export const BLOCK_FROM_SLUG = {
  b1: "B1",
  b2: "B2",
} as const satisfies Record<BlockSlug, BlockId>;

export const BLOCK_LABELS = {
  B1: "Bloque 1",
  B2: "Bloque 2",
} as const satisfies Record<BlockId, string>;

export function isBlockId(value: unknown): value is BlockId {
  return value === "B1" || value === "B2";
}

export function blockSlugOf(blockId: BlockId): BlockSlug {
  return BLOCK_SLUGS[blockId];
}

export function normalizeBlockSlug(
  value: string | null | undefined,
): BlockSlug | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized === "b1" || normalized === "b2"
    ? (normalized as BlockSlug)
    : null;
}

export function blockIdFromSlug(
  value: string | null | undefined,
): BlockId | null {
  const slug = normalizeBlockSlug(value);
  return slug ? BLOCK_FROM_SLUG[slug] : null;
}

/**
 * Infers the block from block-unique question/card/unit ids (for example
 * `B2-Q0001` or `B2-FC0001`). Returns `null` when the value carries no block.
 */
export function blockIdFromContentId(
  value: string | null | undefined,
): BlockId | null {
  if (!value) return null;
  const match = /^(B1|B2)[-_]/i.exec(value.trim());
  return match ? (match[1].toUpperCase() as BlockId) : null;
}

/** Block-namespaced study-unit key so `U01` never collides across blocks. */
export function studyUnitKey(blockId: BlockId, unitId: string): string {
  return `${blockId}:${unitId}`;
}
