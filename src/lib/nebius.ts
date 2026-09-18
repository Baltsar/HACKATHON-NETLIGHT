import { env } from "@/lib/env";

// Token Factory speaks the OpenAI Chat Completions protocol, so plain fetch is enough and keeps deps at zero.

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export type ReasoningEffort = "none" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  tools?: ToolDefinition[];
  tool_choice?: "none" | "auto" | "required";
  reasoning_effort?: ReasoningEffort;
  response_format?: { type: "json_schema"; json_schema: { name: string; schema: Record<string, unknown>; strict?: boolean } };
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionChoice {
  index: number;
  finish_reason: "stop" | "length" | "tool_calls" | string;
  message: {
    role: "assistant";
    content: string | null;
    tool_calls?: ToolCall[];
    reasoning_content?: string | null;
  };
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export async function chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  const res: Response = await fetch(`${env.nebiusBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.nebiusApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...request, model: request.model ?? env.nebiusModel }),
  });
  if (!res.ok) {
    throw new Error(`Nebius Token Factory failed (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as ChatCompletionResponse;
}
