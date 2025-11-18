"use client";
import { useState } from 'react';
import { interpret } from '../../services/nlp';

export default function NlpTestPage() {
  const [text, setText] = useState('list all categories');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await interpret(text);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '1rem' }}>
      <h1>AI NLP Test</h1>
      <p>Type a request like "create a category named Desserts" or "show all menu items".</p>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe what you want..."
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Interpreting…' : 'Send'}
        </button>
      </form>

      {error && (
        <pre style={{ color: 'crimson', whiteSpace: 'pre-wrap' }}>{error}</pre>
      )}

      {result && (
        <div>
          <h3>Response</h3>
          <pre style={{ background: '#f6f8fa', padding: '1rem', overflowX: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}