import { useEffect, useState } from 'react'
import styles from './UploadModal.module.css'

type UploadModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (payload: { file: File; label: string; detail?: string }) => Promise<void>
  isSubmitting: boolean
  error?: string | null
}

function UploadModal({ open, onClose, onSubmit, isSubmitting, error }: UploadModalProps) {
  const [label, setLabel] = useState('')
  const [detail, setDetail] = useState('')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (open) {
      setLabel('')
      setDetail('')
      setFile(null)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file || !label.trim()) return
    await onSubmit({ file, label: label.trim(), detail: detail.trim() || undefined })
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Upload fragment</h3>
          <button type="button" onClick={onClose} className={styles.closeButton} aria-label="Close">
            ×
          </button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Title</span>
            <input
              type="text"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="e.g. VM #5 or Snap 07"
              required
            />
          </label>
          <label className={styles.field}>
            <span>Description</span>
            <textarea
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder="Optional context or note"
              rows={3}
            />
          </label>
          <label className={styles.field}>
            <span>File</span>
            <input
              type="file"
              accept="audio/*,image/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.secondary}>
              Cancel
            </button>
            <button type="submit" className={styles.primary} disabled={!file || isSubmitting}>
              {isSubmitting ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UploadModal

