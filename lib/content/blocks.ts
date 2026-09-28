import path from "node:path";
import {
  BLOCK_IDS,
  type BlockId,
} from "@/types/block";

/**
 * Build-time content roots. These are the single source of truth for the
 * `node:fs` loaders; the browser uses `lib/content/client-bank.ts`, which
 * imports the same canonical JSON so both surfaces share the ACTIVE filter.
 */
export function blockContentRoot(blockId: BlockId): string {
  const directory = blockId === "B1" ? "block-1" : "block-2";
  return path.join(process.cwd(), "content", directory);
}

export function blockManifestPath(blockId: BlockId): string {
  return path.join(blockContentRoot(blockId), "manifest.json");
}

export const ACTIVE_BLOCK_IDS: readonly BlockId[] = BLOCK_IDS;
