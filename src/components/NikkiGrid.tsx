import KalatCard from './KalatCard.tsx'
import type { ContentItem } from '../types.ts'
import styles from './NikkiGrid.module.css'

type NikkiGridProps = {
  items: ContentItem[]
  emptyMessage?: string
}

function NikkiGrid({ items, emptyMessage }: NikkiGridProps) {
  if (!items.length) {
    return (
      <div className={styles.emptyState}>
        <p>{emptyMessage ?? 'No entries logged yet. Add a voice memo to get started.'}</p>
      </div>
    )
  }

  return (
    <section className={styles.grid}>
      {items.map((item) => (
        <KalatCard key={item.id} item={item} />
      ))}
    </section>
  )
}

export default NikkiGrid

