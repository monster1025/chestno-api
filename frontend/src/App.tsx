import { useState, useEffect } from 'react'
import { AuthPage } from './pages/AuthPage'
import { CheckCodesPage } from './pages/CheckCodesPage'
import { UploadUpdPage } from './pages/UploadUpdPage'
import { setOnUnauthorized, logout as apiLogout } from './services/api'

type Page = 'auth' | 'check' | 'upload'

export default function App() {
  const [page, setPage] = useState<Page>('auth')
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    setOnUnauthorized(() => {
      setAuthenticated(false)
      apiLogout().catch(() => {})
    })
  }, [])

  function handleAuth() {
    setAuthenticated(true)
    setPage('check')
  }

  function handleLogout() {
    setAuthenticated(false)
    apiLogout().catch(() => {})
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
            style={navBtnStyle(page === 'check')}
            disabled={!authenticated}>
            Проверка кода
          </button>
          <button onClick={() => setPage('upload')}
            style={navBtnStyle(page === 'upload')}
            disabled={!authenticated}>
            Загрузка УПД
          </button>
        </nav>
        <div style={{ marginLeft: 'auto', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
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
        {page === 'auth' && <AuthPage onAuth={handleAuth} />}
        {page === 'check' && <CheckCodesPage />}
        {page === 'upload' && <UploadUpdPage />}
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
