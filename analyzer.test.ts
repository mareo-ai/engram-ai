import "dotenv/config";

import { expect, test } from "bun:test";
import { analyzer, type ConversationMessage } from "@/analyzer";

const apiKey = process.env.DEEPSEEK_API_KEY || "";
const DEFAULT_MODEL = "deepseek-chat";

const fixture: ConversationMessage[] = [
  {
    role: "user",
    message: "Hi, my name is Zhe Feng",
  },
  {
    role: "assistant",
    message: "Hi Zhe Feng, nice to meet you",
  },
];

test("analyzer can get valid value from conversation", async () => {
  const memory = await analyzer(fixture, DEFAULT_MODEL, apiKey);
  expect(memory).not.toBeNull();
  if (memory) {
    expect(memory.length).toBe(1);
    if (memory.length > 0) {
      expect(memory[0]?.content).toContain("name");
      expect(memory[0]?.content).toContain("Zhe Feng");
    }
  }
});
