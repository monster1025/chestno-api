import { useState } from 'react'
import { checkCodesPublic, checkCodesAuth } from '../services/api'
import { ResultsTable } from '../components/ResultsTable'
import type { CodeResult } from '../types'

export function CheckCodesPage() {
  const [codesInput, setCodesInput] = useState('')
  const [results, setResults] = useState<CodeResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCheck(mode: 'public' | 'auth') {
    const codes = codesInput
      .split(/[\n,;]+/)
      .map(c => c.trim())
      .filter(Boolean)

    if (codes.length === 0) {
      setError('Введите хотя бы один код маркировки')
      return
    }

    setLoading(true)
    setError('')
    try {
      const fn = mode === 'public' ? checkCodesPublic : checkCodesAuth
      const response = await fn(codes)
      setResults(response.results)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Проверка кодов маркировки (КМ)</h2>

      <textarea
        placeholder="Введите коды маркировки (каждый с новой строки, через запятую или точку с запятой)"
        value={codesInput}
        onChange={e => setCodesInput(e.target.value)}
        rows={6}
        style={{
          padding: 8,
          border: '1px solid #ccc',
          borderRadius: 4,
          fontSize: 13,
          fontFamily: 'monospace',
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: 12,
        }}
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button onClick={() => handleCheck('public')} disabled={loading}
          style={btnStyle}>
          {loading ? 'Проверка...' : '🔓 Проверить без авторизации'}
        </button>
        <button onClick={() => handleCheck('auth')} disabled={loading}
          style={{ ...btnStyle, background: '#2e7d32' }}>
          {loading ? 'Проверка...' : '🔐 Проверить с авторизацией'}
        </button>
      </div>

      {error && (
        <div style={{ color: '#c62828', marginBottom: 12 }}>Ошибка: {error}</div>
      )}

      {results && (
        <div>
          <div style={{ marginBottom: 12, fontSize: 14 }}>
            Всего: {results.length} |
            ✅ Актуальных: {results.filter(r => r.valid).length} |
            ❌ Неактуальных: {results.filter(r => !r.valid && !r.error).length} |
            ⚠️ Ошибок: {results.filter(r => !!r.error).length}
          </div>
          <ResultsTable results={results} />
        </div>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: '#1565c0',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  padding: '10px 20px',
  cursor: 'pointer',
  fontSize: 14,
}
