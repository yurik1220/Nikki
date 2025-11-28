import styles from './StatsSidebar.module.css'

type StatsSidebarProps = {
  stats: {
    voice: number
    photo: number
    quote: number
    fact: number
  }
}

function StatsSidebar({ stats }: StatsSidebarProps) {
  const total = Math.max(stats.voice + stats.photo + stats.fact + stats.quote, 1)
  const metrics = [
    { label: 'Voice messages', value: stats.voice, accent: '#ffb075' },
    { label: 'Photos logged', value: stats.photo, accent: '#7fdac7' },
    { label: 'Quotes saved', value: stats.quote, accent: '#b5b0ff' },
    { label: 'Facts noted', value: stats.fact, accent: '#f4e285' },
  ]

  return (
    <div className={styles.panel}>
      <p className={styles.title}>Stats</p>
      <ul className={styles.list}>
        {metrics.map((metric) => (
          <li key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <div className={styles.bar}>
              <div
                className={styles.barFill}
                style={{
                  width: `${(metric.value / total) * 100}%`,
                  background: metric.accent,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className={styles.footer}>Explorer snapshot, recalibrates whenever new data drops.</p>
    </div>
  )
}

export default StatsSidebar

