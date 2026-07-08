import { useState } from 'react'
import { AuthPage } from './pages/AuthPage'
import { CheckCodesPage } from './pages/CheckCodesPage'
import { UploadUpdPage } from './pages/UploadUpdPage'

type Page = 'auth' | 'check' | 'upload'

export default function App() {
  const [page, setPage] = useState<Page>('auth')
  const [authenticated, setAuthenticated] = useState(false)

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
            style={navBtnStyle(page === 'upload')}>
            Загрузка УПД
          </button>
        </nav>
        <div style={{ marginLeft: 'auto', fontSize: 13 }}>
          {authenticated ? '✅ Авторизован' : '❌ Не авторизован'}
        </div>
      </header>

      <main style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
        {page === 'auth' && <AuthPage onAuth={() => setAuthenticated(true)} />}
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
