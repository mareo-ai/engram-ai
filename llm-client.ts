/**
 * Supported provider identifiers for the built-in LLM client.
 */
export type LLMProvider = "deepseek" | "openai" | "openai-compatible";

/**
 * A chat message compatible with OpenAI-style chat completions.
 */
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Request payload for a chat completion call.
 */
export type ChatCompletionRequest = {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  baseUrl?: string;
};

/**
 * Normalized chat completion response.
 */
export type ChatCompletionResponse = {
  content: string;
};

const PROVIDER_BASE_URLS: Record<Exclude<LLMProvider, "openai-compatible">, string> =
  {
    deepseek: "https://api.deepseek.com/v1",
    openai: "https://api.openai.com/v1",
  };

function resolveBaseUrl(
  provider: LLMProvider,
  baseUrl?: string
): string | null {
  if (baseUrl) {
    return baseUrl;
  }
  if (provider === "openai-compatible") {
    console.error("Missing baseUrl for openai-compatible provider");
    return null;
  }
  return PROVIDER_BASE_URLS[provider];
}

function buildChatCompletionsUrl(baseUrl: string): string {
  const normalized = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL("chat/completions", normalized).toString();
}

/**
 * Execute a chat completion request against the selected provider.
 *
 * @param request - Provider, model, auth, and message payload.
 * @returns Normalized response content or null on failure.
 */
export async function createChatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse | null> {
  const baseUrl = resolveBaseUrl(request.provider, request.baseUrl);
  if (!baseUrl) {
    return null;
  }

  const response = await fetch(buildChatCompletionsUrl(baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${request.apiKey}`,
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.2,
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

  return { content };
}
