import { getAppSettings } from './storageService';

export interface OllamaTestResult {
  success: boolean;
  models: string[];
  error?: string;
}

export const testOllamaConnection = async (endpoint?: string): Promise<OllamaTestResult> => {
  const targetEndpoint = (endpoint || getAppSettings().ollamaEndpoint).replace(/\/+$/, '');
  const url = `${targetEndpoint}/api/tags`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s connection timeout

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        success: false,
        models: [],
        error: `Ollama returned HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    const models = Array.isArray(data.models) ? data.models.map((m: any) => m.name) : [];

    return {
      success: true,
      models,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    let errMsg = 'Failed to connect to local Ollama server.';
    if (err.name === 'AbortError') {
      errMsg = 'Connection timed out (5000ms). Is Ollama running on this port?';
    } else if (err.message) {
      errMsg = `${err.message}. Ensure OLLAMA_ORIGINS="*" is allowed if experiencing CORS issues.`;
    }
    return {
      success: false,
      models: [],
      error: errMsg,
    };
  }
};

export interface StreamOllamaChatParams {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  onChunk: (chunkText: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
  signal?: AbortSignal;
}

export const streamOllamaChat = async ({
  messages,
  onChunk,
  onDone,
  onError,
  signal,
}: StreamOllamaChatParams): Promise<void> => {
  const settings = getAppSettings();
  const targetEndpoint = settings.ollamaEndpoint.replace(/\/+$/, '');
  const url = `${targetEndpoint}/api/chat`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        model: settings.ollamaModel || 'llama3',
        messages,
        stream: true,
        options: {
          temperature: settings.temperature ?? 0.7,
          num_ctx: settings.contextWindow ?? 4096,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama Chat HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported or empty body received.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // keep last incomplete line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.message?.content) {
            onChunk(parsed.message.content);
          }
          if (parsed.done) {
            onDone();
            return;
          }
        } catch {
          // Ignore JSON parse chunk errors
        }
      }
    }

    // Process leftover buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim());
        if (parsed.message?.content) {
          onChunk(parsed.message.content);
        }
      } catch {
        // ignore
      }
    }

    onDone();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      onDone(); // User clicked stop
    } else {
      onError(err);
    }
  }
};