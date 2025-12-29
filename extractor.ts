import {
  createChatCompletion,
  type ChatMessage,
  type LLMProvider,
} from "./llm-client";

type MessageRole = "user" | "assistant";

export type SUPPORT_MODEL = string;

export type ConversationMessage = {
  role: MessageRole;
  message: string;
};

type MemoryType = "profile" | "project" | "goal" | "preference" | "temp";

export type MemoryCandidate = {
  type: MemoryType;
  content: string;
  rationale: string;
  confidence: number;
};

const DEFAULT_MODEL =
  process.env.ENGRAM_MODEL ?? process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
const DEFAULT_PROVIDER = process.env.ENGRAM_PROVIDER;
const DEFAULT_BASE_URL = process.env.ENGRAM_BASE_URL;

const PROMPT_TEMPLATE = `
You are an assistant for extracting conversational memories.  
Please extract memories that can be used long-term from the conversation between the user and the assistant.

The allowed memory types are:
- profile (long-term stable information, such as identity or family)
- project (ongoing projects)
- goal (short- to mid-term goals)
- preference (language, style, or other preferences)
- temp (temporary states)

Rules:
- Only output memories when the information is clear and has long-term value; if there is no valid information, return an empty array.
- For each memory, return a JSON object:
  { "type": <type>, "content": <string>, "rationale": <string>, "confidence": <0-1> }
- If there are no extractable memories, return [].

Conversation content:
`;

function buildPrompt(messages: ConversationMessage[]): string {
  return (PROMPT_TEMPLATE + stringifyConversation(messages)).trim();
}

async function analyzeWithLlm(
  prompt: string,
  model: SUPPORT_MODEL,
  apiKey: string,
  provider: LLMProvider,
  baseUrl?: string
): Promise<MemoryCandidate[] | null> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a rigorous memory extractor that outputs strictly formatted JSON.",
    },
    { role: "user", content: prompt },
  ];
  const response = await createChatCompletion({
    provider,
    apiKey,
    model,
    messages,
    temperature: 0.2,
    baseUrl,
  });

  if (!response) {
    return null;
  }

  try {
    const parsed = JSON.parse(response.content) as MemoryCandidate[] | [];
    return parsed;
  } catch {
    console.error("Invalid format (Not JSON): ", response.content);
    return null;
  }
}

function stringifyConversation(items: ConversationMessage[]): string {
  return items.map((item) => `${item.role}: ${item.message}`).join("\n");
}

export type ExtractMemoriesOptions = {
  apiKey: string;
  model?: SUPPORT_MODEL;
  provider?: LLMProvider;
  baseUrl?: string;
};

export async function extractMemories(
  messages: ConversationMessage[],
  options: ExtractMemoriesOptions
): Promise<MemoryCandidate[] | null> {
  const model = options.model ?? DEFAULT_MODEL;
  const provider = options.provider ?? resolveProvider(DEFAULT_PROVIDER);
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  return await analyzeWithLlm(
    buildPrompt(messages),
    model,
    options.apiKey,
    provider,
    baseUrl
  );
}

function resolveProvider(value?: string): LLMProvider {
  if (value === "openai" || value === "openai-compatible") {
    return value;
  }
  return "deepseek";
}
