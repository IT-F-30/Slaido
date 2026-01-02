import type { Word } from "@/types/Word";

/**
 * MongoDB - 後方互換性のためのエイリアス
 * @deprecated Use Word instead
 */
export type MongoDB = Word;

// Re-export Word for convenience
export type { Word };
