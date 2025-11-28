import styles from './LocationsPeek.module.css'

export type LocationEntry = {
  id: string
  username: string
  latitude: number
  longitude: number
  created_at: string
}

type LocationsPeekProps = {
  locations: LocationEntry[]
  isLoading: boolean
  error: string | null
  onClose: () => void
}

function LocationsPeek({ locations, isLoading, error, onClose }: LocationsPeekProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>Location log</p>
          <span className={styles.caption}>Last {locations.length} entries</span>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>

      {isLoading && <p className={styles.status}>Loading locations…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!isLoading && !error && locations.length === 0 && (
        <p className={styles.status}>No saved locations yet.</p>
      )}

      {!isLoading && !error && locations.length > 0 && (
        <ul className={styles.list}>
          {locations.map((entry) => (
            <li key={entry.id} className={styles.listItem}>
              <div>
                <p className={styles.username}>{entry.username}</p>
                <p className={styles.coords}>
                  {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
                </p>
                <p className={styles.timestamp}>
                  {new Date(entry.created_at).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <a
                className={styles.mapButton}
                href={`https://www.google.com/maps?q=${entry.latitude},${entry.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                View map
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default LocationsPeek

