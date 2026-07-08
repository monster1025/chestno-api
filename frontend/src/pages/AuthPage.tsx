import { useState, useEffect } from 'react'
import { getAuthStatus, getAuthKey, signIn } from '../services/api'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  async function handleSignIn() {
    setLoading(true)
    setError('')
    try {
      const { uuid, data } = await getAuthKey()
      const signature = await signWithCadesPlugin(data, selectedThumbprint || undefined)
      await signIn(uuid, signature)
      const s = await getAuthStatus()
      setStatus(s)
      if (s.authenticated) onAuth()
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err))
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

        {error && (
          <div style={{ color: '#c62828', fontSize: 14, marginTop: 8 }}>Ошибка: {error}</div>
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
