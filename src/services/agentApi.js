/**
 * agentApi.js
 * API Client connecting the Esan Foods Storefront to the NodeAgent LLM Server
 */

const DEFAULT_AGENT_BASE = 'http://localhost:4000/api/v1/agent';

export function getAgentApiUrl() {
  return (
    import.meta.env?.VITE_AGENT_API_URL ||
    (typeof process !== 'undefined' && process.env?.VITE_AGENT_API_URL) ||
    DEFAULT_AGENT_BASE
  );
}

/**
 * Send a chat message to the agent (unified planner responder)
 */
export async function sendChatMessage({
  prompt,
  sessionId,
  userId = null,
  customerName = null,
}) {
  const baseUrl = getAgentApiUrl();
  const response = await fetch(`${baseUrl}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      sessionId,
      userId,
      customerName,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Agent server returned ${response.status}`);
  }

  const result = await response.json();
  return result.data || result;
}

/**
 * Stream a chat message via Server-Sent Events (SSE) with real-time interim status events
 */
export async function streamChatMessage({
  prompt,
  sessionId,
  userId = null,
  customerName = null,
  onStatus = null,
  onThought = null,
}) {
  const baseUrl = getAgentApiUrl();

  try {
    const response = await fetch(`${baseUrl}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        prompt,
        sessionId,
        userId,
        customerName
      })
    });

    if (!response.ok) {
      // Fallback to standard chat endpoint if stream not available
      return await sendChatMessage({ prompt, sessionId, userId, customerName });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let finalResult = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        if (!block.trim()) continue;

        let eventType = 'message';
        let dataStr = '';

        const lines = block.split('\n');
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            dataStr = line.slice(6).trim();
          }
        }

        if (dataStr) {
          try {
            const data = JSON.parse(dataStr);

            if (eventType === 'agent:status' || eventType === 'status') {
              if (typeof onStatus === 'function') {
                onStatus(data.payload || data);
              }
            } else if (eventType === 'agent:thought' || eventType === 'thought') {
              if (typeof onThought === 'function') {
                onThought(data.payload || data);
              }
            } else if (eventType === 'agent:complete') {
              finalResult = data;
            } else if (eventType === 'agent:error') {
              throw new Error(data.error || 'Agent stream reported an error');
            }
          } catch (jsonErr) {
            // Safe parse ignore
          }
        }
      }
    }

    if (finalResult) {
      return finalResult;
    }

    // If stream ended without explicit complete event, fetch or return fallback
    return await sendChatMessage({ prompt, sessionId, userId, customerName });
  } catch (err) {
    console.warn('[agentApi] Stream error, falling back to standard chat:', err.message);
    return await sendChatMessage({ prompt, sessionId, userId, customerName });
  }
}

/**
 * Fetch past message history for a session from database
 */
export async function fetchAgentHistory(sessionId) {
  if (!sessionId) return [];
  const baseUrl = getAgentApiUrl();
  try {
    const response = await fetch(`${baseUrl}/messages/${encodeURIComponent(sessionId)}`);
    if (!response.ok) return [];
    const json = await response.json();
    return json.data?.messages || [];
  } catch (err) {
    console.warn('[agentApi] Could not load message history:', err.message);
    return [];
  }
}

/**
 * Fetch live products catalog & stock
 */
export async function fetchAgentCatalog() {
  const baseUrl = getAgentApiUrl();
  try {
    const response = await fetch(`${baseUrl}/products`);
    if (!response.ok) return [];
    const json = await response.json();
    return json.data?.products || [];
  } catch (err) {
    console.warn('[agentApi] Could not load agent catalog:', err.message);
    return [];
  }
}
