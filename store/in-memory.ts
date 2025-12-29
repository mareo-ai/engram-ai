import type { MemoryRecord, MemoryStore } from "../memory";

/**
 * In-memory implementation of the MemoryStore interface.
 */
export class InMemoryStore implements MemoryStore {
  private records: Map<string, MemoryRecord[]> = new Map();

  /**
   * @param userId - Owner of the memories.
   * @returns Stored memories for the user.
   */
  async get(userId: string): Promise<MemoryRecord[]> {
    return this.records.get(userId) ?? [];
  }

  /**
   * @param userId - Owner of the memories.
   * @param memories - Full memory list to persist.
   */
  async put(userId: string, memories: MemoryRecord[]): Promise<void> {
    this.records.set(userId, memories);
  }

  /**
   * @param userId - Owner of the memories.
   * @param memory - Single memory to insert or replace.
   */
  async upsert(userId: string, memory: MemoryRecord): Promise<void> {
    const existing = await this.get(userId);
    const updated = existing.filter((item) => item.id !== memory.id);
    updated.push(memory);
    this.records.set(userId, updated);
  }
}
