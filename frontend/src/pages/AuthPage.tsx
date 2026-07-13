import { useState, useEffect } from 'react'
import { getAuthStatus, getAuthKey, signIn, setTokenManually } from '../services/api'
import type { RequestError } from '../services/api'
import { isCadesPluginAvailable, listCertificates, signWithCadesPlugin } from '../services/cadesplugin'
import type { CertInfo } from '../services/cadesplugin'

interface Props {
  onAuth: () => void
}

export function AuthPage({ onAuth }: Props) {
  const [status, setStatus] = useState<{ authenticated: boolean; tokenExpiresAt: string | null } | null>(null)
  const [hasPlugin, setHasPlugin] = useState<boolean | null>(null)
  const [certs, setCerts] = useState<CertInfo[]>([])
  const [selectedThumbprint, setSelectedThumbprint] = useState('')
  const [inn, setInn] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorDebug, setErrorDebug] = useState<string | null>(null)
  const [debugExpanded, setDebugExpanded] = useState(false)
  const [manualToken, setManualToken] = useState('')
  const [manualLoading, setManualLoading] = useState(false)

  useEffect(() => {
    getAuthStatus().then(setStatus).catch(() => {})
    checkPlugin()
  }, [])

  async function checkPlugin() {
    const available = await isCadesPluginAvailable()
    setHasPlugin(available)
    if (available) {
      try {
        const certList = await listCertificates()
        setCerts(certList)
      } catch {}
    }
  }

  async function handleSetToken() {
    setManualLoading(true)
    setError('')
    setErrorDebug(null)
    setDebugExpanded(false)
    try {
      await setTokenManually(manualToken)
      const s = await getAuthStatus()
      setStatus(s)
      if (s.authenticated) onAuth()
    } catch (err) {
      const re = err as RequestError
      setError(re.message)
      if (re.debugInfo) {
        setErrorDebug(JSON.stringify(re.debugInfo, null, 2))
      }
    } finally {
      setManualLoading(false)
    }
  }

  async function handleSignIn() {
    setLoading(true)
    setError('')
    setErrorDebug(null)
    setDebugExpanded(false)
    try {
      const { uuid, data } = await getAuthKey()
      const signature = await signWithCadesPlugin(data, selectedThumbprint || undefined)
      await signIn(uuid, signature, inn || undefined)
      const s = await getAuthStatus()
      setStatus(s)
      if (s.authenticated) onAuth()
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

  return (
    <div>
      <h2>Авторизация в True API</h2>

      {hasPlugin === false && (
        <div style={{
          padding: 12,
          background: '#fff3e0',
          borderRadius: 6,
          marginBottom: 16,
          fontSize: 14,
        }}>
          ⚠️ КриптоПро Browser Plugin не обнаружен.
          <br />
          <a href="https://cryptopro.ru/products/cades/plugin" target="_blank" rel="noopener noreferrer">
            Установите расширение для браузера
          </a>
        </div>
      )}

      {status?.authenticated && (
        <div style={{
          padding: 12,
          background: '#e8f5e9',
          borderRadius: 6,
          marginBottom: 16,
        }}>
          <strong>✅ Авторизован</strong>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            Токен истекает: {new Date(status.tokenExpiresAt!).toLocaleString()}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
        <div>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 4 }}>
            ИНН организации:
          </label>
          <input
            type="text"
            value={inn}
            onChange={e => setInn(e.target.value)}
            placeholder="Введите ИНН для однозначной авторизации"
            style={inputStyle}
          />
        </div>

        {hasPlugin && certs.length > 0 && (
          <div>
            <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 4 }}>
              Сертификат:
            </label>
            <select
              value={selectedThumbprint}
              onChange={e => setSelectedThumbprint(e.target.value)}
              style={selectStyle}
            >
              <option value="">— первый доступный —</option>
              {certs.map(c => (
                <option key={c.thumbprint} value={c.thumbprint} disabled={!c.valid}>
                  {c.name} ({c.valid ? `до ${new Date(c.validTo).toLocaleDateString()}` : 'просрочен'})
                </option>
              ))}
            </select>
          </div>
        )}

        {certs.length === 0 && hasPlugin && (
          <div style={{ color: '#e65100', fontSize: 13 }}>
            Нет доступных сертификатов. Установите УКЭП в систему.
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={loading || !hasPlugin || (hasPlugin && certs.length === 0)}
          style={btnStyle}
        >
          {loading ? 'Подписание...' : 'Подписать и войти'}
        </button>

        <div style={{
          borderTop: '1px solid #e0e0e0',
          margin: '12px 0',
          paddingTop: 16,
        }}>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 4 }}>
            Или введите готовый токен:
          </label>
          <textarea
            value={manualToken}
            onChange={e => setManualToken(e.target.value)}
            placeholder="Вставьте токен доступа к True API"
            rows={3}
            style={{
              ...inputStyle,
              fontFamily: 'monospace',
              fontSize: 12,
              resize: 'vertical',
            }}
          />
          <button
            onClick={handleSetToken}
            disabled={manualLoading || !manualToken.trim()}
            style={{
              ...btnStyle,
              background: '#1565c0',
              marginTop: 8,
            }}
          >
            {manualLoading ? 'Сохранение...' : 'Сохранить токен'}
          </button>
        </div>

        {error && (
          <div style={{ color: '#c62828', fontSize: 14, marginTop: 8 }}>Ошибка: {error}</div>
        )}

        {errorDebug && (
          <div style={{ marginTop: 12 }}>
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
      </div>

      <div style={{ marginTop: 24, fontSize: 13, color: '#666' }}>
        <h4>Процесс авторизации:</h4>
        <ol>
          <li>Выберите сертификат УКЭП из списка (или будет использован первый доступный)</li>
          <li>Нажмите «Подписать и войти»</li>
          <li>КриптоПро подпишет данные и отправит их на сервер</li>
          <li>Сервер кеширует токен доступа к True API (действует 10 часов)</li>
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

const selectStyle: React.CSSProperties = {
  padding: 8,
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
}

const inputStyle: React.CSSProperties = {
  padding: 8,
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
}
