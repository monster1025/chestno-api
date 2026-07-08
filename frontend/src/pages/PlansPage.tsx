import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { getPlansList, getPlanContent } from '../services/api'

export function PlansPage() {
  const [plans, setPlans] = useState<{ name: string; path: string; size: number }[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [listLoading, setListLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [contentError, setContentError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setListLoading(true)
    getPlansList()
      .then(setPlans)
      .catch(e => setListError(e.message))
      .finally(() => setListLoading(false))
  }, [])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const handleSelect = useCallback(async (filename: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setSelected(filename)
    setContentLoading(true)
    setContentError('')
    try {
      const res = await getPlanContent(filename)
      if (!controller.signal.aborted) {
        setContent(res.content)
      }
    } catch (e: any) {
      if (!controller.signal.aborted) {
        setContentError(e.message)
      }
    } finally {
      if (!controller.signal.aborted) {
        setContentLoading(false)
      }
    }
  }, [])

  const rawHtml = useMemo(() => {
    if (!content) return ''
    return marked.parse(content, { async: false }) as string
  }, [content])

  const sanitizedHtml = useMemo(() => {
    return DOMPurify.sanitize(rawHtml)
  }, [rawHtml])

  return (
    <div style={{ display: 'flex', gap: 24, minHeight: '70vh' }}>
      <aside style={{ width: 280, flexShrink: 0 }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Планы</h2>
        {listLoading && <p style={{ color: '#888' }}>Загрузка...</p>}
        {!listLoading && plans.length === 0 && !listError && (
          <p style={{ color: '#888' }}>Нет файлов планов</p>
        )}
        {listError && <p style={{ color: '#c62828' }}>{listError}</p>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {plans.map(p => (
            <li key={p.name} style={{ marginBottom: 4 }}>
              <button
                onClick={() => handleSelect(p.name)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: selected === p.name ? '#e3f2fd' : 'transparent',
                  border: selected === p.name ? '1px solid #90caf9' : '1px solid transparent',
                  borderRadius: 4,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: '#1565c0',
                  fontFamily: 'monospace',
                }}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main style={{ flex: 1, minWidth: 0 }}>
        {contentLoading && <p style={{ color: '#888' }}>Загрузка содержимого...</p>}
        {!contentLoading && !selected && (
          <p style={{ color: '#888', marginTop: 40, textAlign: 'center' }}>
            Выберите план из списка слева
          </p>
        )}
        {!contentLoading && selected && contentError && (
          <p style={{ color: '#c62828' }}>Ошибка: {contentError}</p>
        )}
        {!contentLoading && selected && !contentError && (
          <div
            className="plan-content"
            style={{ lineHeight: 1.7, fontSize: 14 }}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        )}
      </main>
    </div>
  )
}
