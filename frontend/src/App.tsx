import { useState, useEffect } from 'react'
import { AuthPage } from './pages/AuthPage'
import { CheckCodesPage } from './pages/CheckCodesPage'
import { UploadUpdPage } from './pages/UploadUpdPage'
import { PlansPage } from './pages/PlansPage'
import { setOnUnauthorized, logout as apiLogout, getEnv, setEnv, getAuthStatus } from './services/api'
import type { ApiEnv } from './types'

type Page = 'auth' | 'check' | 'upload' | 'plans'

export default function App() {
  const [page, setPage] = useState<Page>('auth')
  const [authenticated, setAuthenticated] = useState(false)
  const [env, setEnvState] = useState<ApiEnv>('sandbox')

  useEffect(() => {
    setOnUnauthorized((failedEnv: ApiEnv) => {
      if (failedEnv === getEnv()) {
        setAuthenticated(false)
      }
      apiLogout(failedEnv).catch(() => {})
    })
  }, [])

  async function handleEnvChange(newEnv: ApiEnv) {
    if (newEnv === 'prod' && env === 'sandbox') {
      const ok = window.confirm(
        'Вы переключаетесь на промышленный контур.\n' +
        'Все запросы будут отправляться к реальной системе «Честный знак».\n\n' +
        'Продолжить?'
      )
      if (!ok) return
    }

    setEnv(newEnv)
    setEnvState(newEnv)
    setAuthenticated(false)
    setPage('auth')
    apiLogout(newEnv).catch(() => {})

    const status = await getAuthStatus(newEnv).catch(() => ({ authenticated: false }))
    if (status.authenticated) setAuthenticated(true)
  }

  function handleAuth() {
    setAuthenticated(true)
    setPage('check')
  }

  function handleLogout() {
    setAuthenticated(false)
    apiLogout(getEnv()).catch(() => {})
    setPage('auth')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <header style={{
        background: '#1a237e',
        color: 'white',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
      }}>
        <h1 style={{ fontSize: 18, margin: 0 }}>Честный знак — Проверка КМ</h1>
        <nav style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setPage('auth')}
            style={navBtnStyle(page === 'auth')}>
            Авторизация
          </button>
          <button onClick={() => setPage('check')}
            style={navBtnStyle(page === 'check')}>
            Проверка кода
          </button>
          <button onClick={() => setPage('upload')}
            style={navBtnStyle(page === 'upload')}
            disabled={!authenticated}>
            Загрузка УПД
          </button>
          <button onClick={() => setPage('plans')}
            style={navBtnStyle(page === 'plans')}>
            Планы
          </button>
        </nav>
        <div style={{ marginLeft: 'auto', fontSize: 13, display: 'flex', alignItems: 'center', gap: 12 }}>
          <label>
            <select
              value={env}
              onChange={e => handleEnvChange(e.target.value as ApiEnv)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 4,
                padding: '3px 8px',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <option value="sandbox" style={{ color: '#000' }}>🧪 Sandbox</option>
              <option value="prod" style={{ color: '#000' }}>🏭 Промышленный</option>
            </select>
          </label>
          {authenticated ? '✅ Авторизован' : '❌ Не авторизован'}
          {authenticated && (
            <button onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 4,
                padding: '3px 10px',
                cursor: 'pointer',
                fontSize: 12,
              }}>
              Выйти
            </button>
          )}
        </div>
      </header>

      <main style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
        {page === 'auth' && <AuthPage key={env} onAuth={handleAuth} />}
        {page === 'check' && <CheckCodesPage key={env} />}
        {page === 'upload' && <UploadUpdPage key={env} />}
        {page === 'plans' && <PlansPage key={env} />}
      </main>
    </div>
  )
}

function navBtnStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
    color: 'white',
    border: active ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent',
    borderRadius: 4,
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: 14,
  }
}
