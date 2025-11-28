import type { ContentItem } from '../types.ts'
import styles from './KalatCard.module.css'

type KalatCardProps = {
  item: ContentItem
}

function KalatCard({ item }: KalatCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{item.label}</span>
      </div>

      <div className={styles.body}>
        {item.type === 'voice' && (
          <audio className={styles.audio} controls preload="metadata" src={item.source}>
            Your browser does not support the audio element.
          </audio>
        )}

        {item.type === 'photo' && (
          <div className={styles.photoBox}>
            <img src={item.source} alt={item.detail ?? item.label} loading="lazy" />
          </div>
        )}

        {(item.type === 'quote' || item.type === 'fact') && (
          <p className={styles.textBlock}>{item.source}</p>
        )}
      </div>

      {item.detail && <p className={styles.meta}>{item.detail}</p>}
    </article>
  )
}

export default KalatCard

