import "dotenv/config";

import { expect, test } from "bun:test";
import { extractMemories, type ConversationMessage } from "@/analyzer";

const apiKey = process.env.DEEPSEEK_API_KEY || "";
const DEFAULT_MODEL = "deepseek-chat";

const fixture: ConversationMessage[] = [
  {
    role: "user",
    message: "Hi, my name is Steve",
  },
  {
    role: "assistant",
    message: "Hi Steve, nice to meet you",
  },
  {
    role: "user",
    message: "I prefer TypeScript",
  },
];

test("extractMemories can extract valid memories from conversation", async () => {
  const memory = await extractMemories(fixture, {
    apiKey,
    model: DEFAULT_MODEL,
  });
  expect(memory).not.toBeNull();
  expect(memory?.length).toBe(2);
  expect(memory?.[0]?.content).toContain("name");
  expect(memory?.[0]?.content).toContain("Steve");
  expect(memory?.[0]?.confidence).toBeGreaterThan(0.9);
  expect(memory?.[0]?.rationale).toBeDefined();
  expect(memory?.[0]?.type).toBe("profile");

  expect(memory?.[1]?.content).toContain("TypeScript");
  expect(memory?.[1]?.confidence).toBeGreaterThan(0.9);
  expect(memory?.[1]?.rationale).toBeDefined();
  expect(memory?.[1]?.type).toBe("preference");
});
