import type { CodeResult } from '../types'

interface Props {
  results: CodeResult[]
}

export function ResultsTable({ results }: Props) {
  if (results.length === 0) return null

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 13,
      }}>
        <thead>
          <tr style={{ background: '#1a237e', color: 'white' }}>
            <th style={thStyle}>Код маркировки</th>
            <th style={thStyle}>GTIN</th>
            <th style={thStyle}>Наименование</th>
            <th style={thStyle}>Статус</th>
            <th style={thStyle}>Производитель</th>
            <th style={thStyle}>Владелец</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} style={{
              background: i % 2 === 0 ? '#fff' : '#f5f5f5',
              borderBottom: '1px solid #e0e0e0',
            }}>
              <td style={tdStyle}>
                <span style={{ fontSize: 11, wordBreak: 'break-all' }}>{r.code}</span>
              </td>
              <td style={tdStyle}>{r.gtin || '—'}</td>
              <td style={tdStyle}>{r.productName || '—'}</td>
              <td style={tdStyle}>
                <StatusBadge status={r.status} valid={r.valid} error={r.error} />
              </td>
              <td style={tdStyle}>{r.producerName || '—'}</td>
              <td style={tdStyle}>{r.ownerName || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status, valid, error }: { status: string; valid: boolean; error?: string }) {
  if (error) {
    return <span style={{ ...badgeBase, background: '#ffebee', color: '#c62828' }}>⚠️ {error}</span>
  }

  const colorMap: Record<string, string> = {
    INTRODUCED: '#e8f5e9',
    EMITTED: '#fff8e1',
    APPLIED: '#fff8e1',
    RETIRED: '#ffebee',
    WRITTEN_OFF: '#ffebee',
    DISAGGREGATION: '#fff3e0',
    CANCELLED: '#ffebee',
  }

  const labelMap: Record<string, string> = {
    INTRODUCED: '✅ В обороте',
    EMITTED: '🟡 Эмитирован',
    APPLIED: '🟡 Нанесён',
    RETIRED: '❌ Выбыл',
    WRITTEN_OFF: '❌ Списан',
    DISAGGREGATION: '🟠 Расформирован',
    CANCELLED: '❌ Аннулирован',
  }

  return (
    <span style={{
      ...badgeBase,
      background: colorMap[status] || '#f5f5f5',
      color: valid ? '#2e7d32' : '#c62828',
    }}>
      {labelMap[status] || status}
    </span>
  )
}

const badgeBase: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 500,
  whiteSpace: 'nowrap',
}

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 12,
  textTransform: 'uppercase',
}

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  verticalAlign: 'top',
}
