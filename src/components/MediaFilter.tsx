import styles from './MediaFilter.module.css'

export type MediaFilterKey = 'all' | 'voice' | 'photo'

type MediaFilterProps = {
  active: MediaFilterKey
  onChange: (filter: MediaFilterKey) => void
}

const options: Array<{ key: MediaFilterKey; label: string; helper: string }> = [
  { key: 'all', label: 'All fragments', helper: 'Entire running log' },
  { key: 'voice', label: 'Voice logs', helper: 'Snippets + uploads' },
  { key: 'photo', label: 'Still frames', helper: 'Random snaps & sightings' },
]

function MediaFilter({ active, onChange }: MediaFilterProps) {
  return (
    <div className={styles.wrapper}>
      {options.map((option) => {
        const isActive = active === option.key

        return (
          <button
            key={option.key}
            type='button'
            className={`${styles.card} ${isActive ? styles.active : ''}`}
            onClick={() => onChange(option.key)}
          >
            <span className={styles.label}>{option.label}</span>
            <p>{option.helper}</p>
          </button>
        )
      })}
    </div>
  )
}

export default MediaFilter

