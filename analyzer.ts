type MessageRole = "user" | "assistant";

export type SUPPORT_MODEL = "deepseek-chat";

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

const DEFAULT_MODEL = "deepseek-chat";

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
  apiKey: string
): Promise<MemoryCandidate[] | null> {
  const messages = [
    {
      role: "system",
      content:
        "You are a rigorous memory extractor that outputs strictly formatted JSON.",
    },
    { role: "user", content: prompt },
  ];
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    console.error(
      `LLM Response Fail: ${response.status} ${response.statusText}`
    );
    const text = await response.text();
    console.error(text);
    return null;
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content?: string } }>;
  };
  const content = data.choices[0]?.message?.content?.trim();
  if (!content) {
    console.error("No content return from LLM");
    return null;
  }

  try {
    const parsed = JSON.parse(content) as MemoryCandidate[] | [];
    return parsed;
  } catch {
    console.error("Invalid format (Not JSON): ", content);
    return null;
  }
}

function stringifyConversation(items: ConversationMessage[]): string {
  return items.map((item) => `${item.role}: ${item.message}`).join("\n");
}

export type ExtractMemoriesOptions = {
  apiKey: string;
  model?: SUPPORT_MODEL;
};

export async function extractMemories(
  messages: ConversationMessage[],
  options: ExtractMemoriesOptions
): Promise<MemoryCandidate[] | null> {
  const model = options.model ?? DEFAULT_MODEL;
  return await analyzeWithLlm(buildPrompt(messages), model, options.apiKey);
}
