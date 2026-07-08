import { useState, useEffect } from 'react'
import { getAuthStatus, getAuthKey, signIn } from '../services/api'

interface Props {
  onAuth: () => void
}

export function AuthPage({ onAuth }: Props) {
  const [status, setStatus] = useState<{ authenticated: boolean; tokenExpiresAt: string | null } | null>(null)
  const [uuid, setUuid] = useState('')
  const [dataToSign, setDataToSign] = useState('')
  const [signature, setSignature] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getAuthStatus().then(setStatus).catch(() => {})
  }, [])

  async function handleGetKey() {
    setLoading(true)
    setError('')
    try {
      const { uuid, data } = await getAuthKey()
      setUuid(uuid)
      setDataToSign(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleSignIn() {
    setLoading(true)
    setError('')
    try {
      await signIn(uuid, signature)
      const s = await getAuthStatus()
      setStatus(s)
      if (s.authenticated) onAuth()
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Авторизация в True API</h2>

      {status && (
        <div style={{
          padding: 12,
          background: status.authenticated ? '#e8f5e9' : '#fff3e0',
          borderRadius: 6,
          marginBottom: 16,
        }}>
          <strong>Статус:</strong>{' '}
          {status.authenticated ? '✅ Авторизован' : '❌ Не авторизован'}
          {status.tokenExpiresAt && (
            <div style={{ fontSize: 13, marginTop: 4 }}>
              Токен истекает: {new Date(status.tokenExpiresAt).toLocaleString()}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
        <button onClick={handleGetKey} disabled={loading}
          style={btnStyle}>
          {loading ? 'Загрузка...' : '1. Получить ключ авторизации'}
        </button>

        {dataToSign && (
          <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, fontSize: 12, wordBreak: 'break-all' }}>
            <strong>Данные для подписи:</strong><br />
            {dataToSign}
          </div>
        )}

        {uuid && (
          <>
            <textarea
              placeholder="Вставьте подпись (base64) из КриптоПро..."
              value={signature}
              onChange={e => setSignature(e.target.value)}
              rows={4}
              style={inputStyle}
            />

            <button onClick={handleSignIn} disabled={loading || !signature}
              style={btnStyle}>
              {loading ? 'Подписание...' : '2. Отправить подпись'}
            </button>
          </>
        )}

        {error && (
          <div style={{ color: '#c62828', fontSize: 14 }}>Ошибка: {error}</div>
        )}
      </div>

      <div style={{ marginTop: 24, fontSize: 13, color: '#666' }}>
        <h4>Инструкция:</h4>
        <ol>
          <li>Нажмите «Получить ключ авторизации» — система получит UUID и случайные данные для подписи</li>
          <li>Подпишите полученные данные в КриптоПро (CAdES-BES, присоединённая подпись, base64)</li>
          <li>Вставьте подпись в поле выше и нажмите «Отправить подпись»</li>
        </ol>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: '#1a237e',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  padding: '10px 20px',
  cursor: 'pointer',
  fontSize: 14,
}

const inputStyle: React.CSSProperties = {
  padding: 8,
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
  fontFamily: 'monospace',
  width: '100%',
  boxSizing: 'border-box',
}
