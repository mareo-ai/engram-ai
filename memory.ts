/**
 * Supported memory categories.
 */
export type MemoryType = "profile" | "project" | "goal" | "preference" | "temp";

/**
 * Ordered list of memory types used for iteration.
 */
export const MEMORY_TYPES: MemoryType[] = [
  "profile",
  "project",
  "goal",
  "preference",
  "temp",
];

/**
 * A stored memory record with timestamps and metadata.
 */
export type MemoryRecord = {
  id: string;
  type: MemoryType;
  content: string;
  rationale?: string;
  confidence?: number;
  weight?: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * Minimal storage interface for memory records.
 */
export type MemoryStore = {
  /**
   * @param userId - Owner of the memories.
   * @returns Stored memories for the user.
   */
  get: (userId: string) => Promise<MemoryRecord[]>;
  /**
   * @param userId - Owner of the memories.
   * @param memories - Full memory list to persist.
   */
  put: (userId: string, memories: MemoryRecord[]) => Promise<void>;
  /**
   * @param userId - Owner of the memories.
   * @param memory - Single memory to insert or replace.
   */
  upsert: (userId: string, memory: MemoryRecord) => Promise<void>;
};
