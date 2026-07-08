import { useState, useRef } from 'react'
import { uploadUpd } from '../services/api'
import type { RequestError } from '../services/api'
import { ResultsTable } from '../components/ResultsTable'
import type { UpdUploadResponse } from '../types'

const MAX_FILE_SIZE = 10 * 1024 * 1024

export function UploadUpdPage() {
  const [file, setFile] = useState<File | null>(null)
  const [response, setResponse] = useState<UpdUploadResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorDebug, setErrorDebug] = useState<string | null>(null)
  const [debugExpanded, setDebugExpanded] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function setFileIfValid(f: File | null) {
    if (!f) { setFile(null); return }
    if (f.size > MAX_FILE_SIZE) {
      setError(`Файл слишком большой (максимум 10MB)`)
      return
    }
    setError('')
    setFile(f)
  }

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setError('')
    setErrorDebug(null)
    setDebugExpanded(false)
    try {
      const result = await uploadUpd(file)
      setResponse(result)
    } catch (err) {
      const re = err as RequestError
      setError(re.message)
      if (re.debugInfo) {
        setErrorDebug(JSON.stringify(re.debugInfo, null, 2))
      }
    } finally {
      setLoading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    setFileIfValid(e.dataTransfer.files[0] || null)
  }

  return (
    <div>
      <h2>Загрузка УПД (формат Приказа №970 ФНС)</h2>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#1a237e' : '#ccc'}`,
          borderRadius: 8,
          padding: 40,
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? '#e8eaf6' : '#fafafa',
          marginBottom: 16,
        }}
      >
        {file ? (
          <div>
            <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
            <br />
            <button onClick={e => { e.stopPropagation(); setFile(null) }}
              style={{ marginTop: 8, ...smallBtnStyle }}>
              Удалить
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <div>Перетащите XML-файл УПД сюда или нажмите для выбора</div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".xml,.XML"
          hidden
          onChange={e => setFileIfValid(e.target.files?.[0] || null)}
        />
      </div>

      <button onClick={handleUpload} disabled={loading || !file}
        style={btnStyle}>
        {loading ? 'Загрузка и проверка...' : 'Отправить и проверить коды'}
      </button>

      {error && (
        <div style={{ color: '#c62828', marginTop: 12 }}>Ошибка: {error}</div>
      )}

      {errorDebug && (
        <div style={{ marginTop: 12, marginBottom: 16 }}>
          <button
            onClick={() => setDebugExpanded(!debugExpanded)}
            style={{
              background: 'transparent',
              border: '1px solid #b0bec5',
              borderRadius: 4,
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: 13,
              color: '#37474f',
            }}
          >
            {debugExpanded ? '▼ Скрыть лог запроса к API маркировки' : '▶ Показать лог запроса к API маркировки'}
          </button>
          {debugExpanded && (
            <pre style={{
              marginTop: 8,
              padding: 12,
              background: '#263238',
              color: '#e0e0e0',
              borderRadius: 6,
              fontSize: 12,
              lineHeight: 1.5,
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {errorDebug}
            </pre>
          )}
        </div>
      )}

      {response && (
        <div style={{ marginTop: 16 }}>
          <div style={{
            padding: 12,
            background: '#e3f2fd',
            borderRadius: 6,
            marginBottom: 12,
            fontSize: 14,
          }}>
            <strong>Документ:</strong>{' '}
            {response.document.number || '—'} от {response.document.date || '—'}
            <br />
            <strong>Продавец:</strong> {response.document.seller || '—'}
            <br />
            <strong>Покупатель:</strong> {response.document.buyer || '—'}
            <br />
            <strong>Найдено кодов:</strong> {response.codesFound}
            <br />
            <strong>Результаты:</strong> всего {response.results.total},
            ✅ {response.results.validCount},
            ❌ {response.results.invalidCount},
            ⚠️ {response.results.errorCount}
          </div>

          <ResultsTable results={response.results.results} />
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

const smallBtnStyle: React.CSSProperties = {
  background: '#e53935',
  color: 'white',
  border: 'none',
  borderRadius: 4,
  padding: '4px 12px',
  cursor: 'pointer',
  fontSize: 12,
}
