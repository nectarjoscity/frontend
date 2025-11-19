export async function interpret(text, messages = []) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const res = await fetch(`${base}/api/nlp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, messages })
  });
  const data = await res.json().catch(() => ({ error: 'Invalid JSON from server' }));
  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed with ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export function toChatMessageFromResponse(resp) {
  if (!resp) return { role: 'assistant', content: 'Sorry, I did not understand.' };
  if (resp.mode === 'chat') return { role: 'assistant', content: resp.message || 'Okay.' };
  if (resp.mode === 'clarify') return { role: 'assistant', content: resp.clarificationQuestion || 'Could you clarify that?' };
  // For action responses, let the calling code format based on controller response
  return { role: 'assistant', content: 'Done.' };
}