import type { MemoryCandidate } from "./extractor";
import { MEMORY_TYPES, type MemoryRecord, type MemoryType } from "./memory";

/**
 * Options to control memory merging and capacity management.
 */
export type MergeOptions = {
  maxMemories?: number;
  maxPerType?: Partial<Record<MemoryType, number>>;
  typeWeights?: Partial<Record<MemoryType, number>>;
  now?: Date;
};

const DEFAULT_MAX_MEMORIES = 200;
const DEFAULT_TYPE_WEIGHTS: Record<MemoryType, number> = {
  profile: 0.9,
  project: 0.7,
  goal: 0.6,
  preference: 0.5,
  temp: 0.3,
};

/**
 * Merge new memory candidates into existing records, applying
 * deduplication and capacity policies.
 *
 * @param existing - Previously stored memories.
 * @param candidates - Newly extracted memory candidates.
 * @param options - Capacity limits and weighting options.
 * @returns Updated memory list after merge and trimming.
 */
export function mergeMemories(
  existing: MemoryRecord[],
  candidates: MemoryCandidate[],
  options: MergeOptions = {}
): MemoryRecord[] {
  const now = options.now ?? new Date();
  const maxMemories = options.maxMemories ?? DEFAULT_MAX_MEMORIES;
  const typeWeights = {
    ...DEFAULT_TYPE_WEIGHTS,
    ...options.typeWeights,
  };
  const maxPerType = buildMaxPerType(
    maxMemories,
    options.maxPerType ?? {}
  );
  const normalizedExisting = [...existing];

  for (const candidate of candidates) {
    const matchIndex = normalizedExisting.findIndex((memory) =>
      isSameMemory(memory, candidate)
    );

    const current = normalizedExisting[matchIndex];
    if (current) {
      const shouldReplace =
        (candidate.confidence ?? 0) >= (current.confidence ?? 0);

      if (shouldReplace) {
        normalizedExisting[matchIndex] = {
          ...current,
          content: candidate.content,
          rationale: candidate.rationale,
          confidence: candidate.confidence,
          weight: current.weight ?? typeWeights[candidate.type],
          updatedAt: now.toISOString(),
        };
      } else {
        normalizedExisting[matchIndex] = {
          ...current,
          updatedAt: now.toISOString(),
        };
      }
    } else {
      normalizedExisting.push(createRecord(candidate, now, typeWeights));
    }
  }

  return enforceCapacity(normalizedExisting, {
    maxMemories,
    maxPerType,
    typeWeights,
    now,
  });
}

function isSameMemory(
  record: MemoryRecord,
  candidate: MemoryCandidate
): boolean {
  return record.type === candidate.type && record.content === candidate.content;
}

function createRecord(
  candidate: MemoryCandidate,
  now: Date,
  typeWeights: Record<MemoryType, number>
): MemoryRecord {
  return {
    id: buildId(candidate.type, candidate.content),
    type: candidate.type,
    content: candidate.content,
    rationale: candidate.rationale,
    confidence: candidate.confidence,
    weight: typeWeights[candidate.type],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function buildId(type: MemoryType, content: string): string {
  return `${type}:${hashString(content)}`;
}

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16);
}

type CapacityOptions = {
  maxMemories: number;
  maxPerType: Record<MemoryType, number>;
  typeWeights: Record<MemoryType, number>;
  now: Date;
};

function enforceCapacity(
  memories: MemoryRecord[],
  options: CapacityOptions
): MemoryRecord[] {
  const grouped = groupByType(memories);
  const trimmed: MemoryRecord[] = [];

  for (const type of MEMORY_TYPES) {
    const items = grouped.get(type) ?? [];
    const cap = options.maxPerType[type];
    const sorted = [...items].sort((a, b) =>
      scoreMemory(b, options) - scoreMemory(a, options)
    );
    trimmed.push(...sorted.slice(0, cap));
  }

  if (trimmed.length <= options.maxMemories) {
    return trimmed;
  }

  return [...trimmed]
    .sort((a, b) => scoreMemory(b, options) - scoreMemory(a, options))
    .slice(0, options.maxMemories);
}

function groupByType(memories: MemoryRecord[]): Map<MemoryType, MemoryRecord[]> {
  const grouped = new Map<MemoryType, MemoryRecord[]>();
  for (const memory of memories) {
    const list = grouped.get(memory.type) ?? [];
    list.push(memory);
    grouped.set(memory.type, list);
  }
  return grouped;
}

function scoreMemory(memory: MemoryRecord, options: CapacityOptions): number {
  const typeWeight = memory.weight ?? options.typeWeights[memory.type];
  const confidence = memory.confidence ?? 0.5;
  const recency = computeRecency(memory.updatedAt, options.now);

  return typeWeight * 0.6 + recency * 0.3 + confidence * 0.1;
}

function computeRecency(updatedAt: string, now: Date): number {
  const updated = new Date(updatedAt).getTime();
  const ageHours = Math.max(0, now.getTime() - updated) / 36e5;
  return 1 / (1 + ageHours / 24);
}

function buildMaxPerType(
  maxMemories: number,
  overrides: Partial<Record<MemoryType, number>>
): Record<MemoryType, number> {
  // Ensure every type has a cap: use overrides, then distribute remaining
  // capacity evenly across types without an explicit override.
  const result: Record<MemoryType, number> = {
    profile: 0,
    project: 0,
    goal: 0,
    preference: 0,
    temp: 0,
  };

  let remaining = maxMemories;
  const unset: MemoryType[] = [];

  for (const type of MEMORY_TYPES) {
    const value = overrides[type];
    if (typeof value === "number") {
      // Reserve explicit caps first.
      result[type] = Math.max(0, Math.floor(value));
      remaining -= result[type];
    } else {
      unset.push(type);
    }
  }

  // Spread leftover capacity over types without overrides.
  const safeRemaining = Math.max(0, remaining);
  const base = unset.length > 0 ? Math.floor(safeRemaining / unset.length) : 0;
  let extra = unset.length > 0 ? safeRemaining % unset.length : 0;

  for (const type of unset) {
    // Distribute remainder one by one for a balanced split.
    result[type] = base + (extra > 0 ? 1 : 0);
    if (extra > 0) {
      extra -= 1;
    }
  }

  return result;
}
