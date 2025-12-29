import "dotenv/config";

import { extractMemories, mergeMemories, InMemoryStore } from "../index";

const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
  throw new Error("Missing DEEPSEEK_API_KEY in environment");
}

const store = new InMemoryStore();
const userId = "user-123";

const conversation = [
  { role: "user", message: "Hi, my name is Steve" },
  { role: "assistant", message: "Nice to meet you" },
  { role: "user", message: "I prefer TypeScript" },
];

console.log("Conversation:", conversation);

const candidates = await extractMemories(conversation, { apiKey });
if (!candidates) {
  throw new Error("No memories extracted");
}

console.log("Extracted candidates:", candidates);

const existing = await store.get(userId);
console.log("Existing memories:", existing);

const merged = mergeMemories(existing, candidates, { maxMemories: 200 });
console.log("Merged memories:", merged);

await store.put(userId, merged);

const stored = await store.get(userId);
console.log("Stored memories:", stored);
