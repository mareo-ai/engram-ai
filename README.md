# Engram AI

Engram AI is a small, open-source memory layer for AI agents. It turns conversations into explicit, structured memories that persist across sessions — without becoming a framework.

## Why Engram
- **Long-term memory, not RAG.** Use Engram to store user preferences, goals, and ongoing projects.
- **Explicit and controllable.** Memories are data, not embeddings or hidden prompts.
- **Small by design.** Keep 50–200 high-signal memories per user.

## What It Is / Isn’t
**Engram is:** a memory abstraction, a long-term context layer, a lightweight library.

**Engram is not:** a vector database, a prompt template engine, or an agent framework.

## Install
**npm**
```bash
npm i --save engram
```

**bun**
```bash
bun add engram-ai
```

## Quick Start
```ts
import { extractMemories } from "@/index";

const messages = [
  { role: "user", message: "Hi, my name is Steve" },
  { role: "assistant", message: "Nice to meet you" },
  { role: "user", message: "I prefer TypeScript" },
];

const memories = await extractMemories(messages, {
  apiKey: process.env.DEEPSEEK_API_KEY!,
});
console.log(memories);
```

## Core Concepts
### Memory Candidates
Engram extracts memories as typed, scored candidates:
```ts
type MemoryCandidate = {
  type: "profile" | "project" | "goal" | "preference" | "temp";
  content: string;
  rationale: string;
  confidence: number; // 0–1
};
```

### Deterministic Output
Memories are meant to be short, stable, and easy to audit. Update or merge memories instead of appending endlessly.

## Development
```bash
bun install
DEEPSEEK_API_KEY=xxx bun test
```

## Project Structure
- `extractor.ts`: LLM-based memory extraction.
- `extractor.test.ts`: Bun tests.
- `index.ts`: package entry.

## Roadmap
- Memory merging + deduplication.
- Storage adapters (file/db/hosted API).
- Retrieval and relevance scoring.

## Contributing
Open an issue before large changes. Keep PRs small, focused, and consistent with the “small by design” principle.

## License
MIT
