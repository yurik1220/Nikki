import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Header from './components/Header.tsx'
import LiveTimeWeather from './components/LiveTimeWeather.tsx'
import LocationsPeek, { type LocationEntry } from './components/LocationsPeek.tsx'
import NikkiGrid from './components/NikkiGrid.tsx'
import StatsSidebar from './components/StatsSidebar.tsx'
import MediaFilter, { type MediaFilterKey } from './components/MediaFilter.tsx'
import UploadModal from './components/UploadModal.tsx'
import LoginView from './components/LoginView.tsx'
import type { ContentItem } from './types.ts'
import styles from './App.module.css'

const fallbackSeeds: ContentItem[] = [
  {
    id: 'vm-1',
    type: 'voice',
    label: 'VM #1',
    source:
      'https://cdn.pixabay.com/download/audio/2022/03/15/audio_e176cb74f2.mp3?filename=calm-notes-21673.mp3',
    detail: 'Morning riff she sent last month.',
  },
  {
    id: 'photo-2',
    type: 'photo',
    label: 'Snap 02',
    source:
      'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&w=600&q=80',
    detail: 'Neutral city walk shot she likes.',
  },
  {
    id: 'quote-4',
    type: 'quote',
    label: 'Quote 04',
    source: '"I keep plans loose so the day can surprise me."',
  },
  {
    id: 'fact-6',
    type: 'fact',
    label: 'Fact #6',
    source: 'Prefers playlists sorted by weather instead of genre.',
  },
]

type AuthState = {
  token: string
  role: 'admin' | 'user'
  username: string
}

const STORAGE_KEY = 'nikki_auth'

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

function App() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [filter, setFilter] = useState<MediaFilterKey>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [locations, setLocations] = useState<LocationEntry[]>([])
  const [isLocationsVisible, setIsLocationsVisible] = useState(false)
  const [isLocationsLoading, setIsLocationsLoading] = useState(false)
  const [locationsError, setLocationsError] = useState<string | null>(null)
  const holdTimerRef = useRef<number | null>(null)
  const [auth, setAuth] = useState<AuthState | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? (JSON.parse(stored) as AuthState) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (!auth) {
      setItems([])
      setIsLoading(false)
      return
    }

    let ignore = false
    const controller = new AbortController()

    const load = async () => {
      try {
        const response = await fetch(`${apiBase}/api/fragments`, { signal: controller.signal })
        if (!response.ok) {
          throw new Error('Request failed')
        }
        const data = (await response.json()) as ContentItem[]
        if (!ignore) {
          setItems(data)
        }
      } catch (error) {
        console.error('Falling back to local seed data', error)
        if (!ignore) {
          setItems(fallbackSeeds)
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    load()
    return () => {
      ignore = true
      controller.abort()
    }
  }, [auth])

  const stats = useMemo(() => {
    const tally = { voice: 0, photo: 0, quote: 0, fact: 0 }
    items.forEach((item) => {
      tally[item.type] += 1
    })
    return tally
  }, [items])

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((item) => item.type === filter)
  }, [items, filter])

  const handleModalSubmit = useCallback(
    async ({ file, label, detail }: { file: File; label: string; detail?: string }) => {
      if (!auth || auth.role !== 'admin') {
        setUploadError('You are not allowed to upload.')
        return
      }

      setUploadError(null)
      setIsSubmitting(true)

      try {
        const mediaType = file.type.startsWith('audio')
          ? 'voice'
          : file.type.startsWith('image')
            ? 'photo'
            : null

        if (!mediaType) {
          throw new Error('Only audio and image files are supported.')
        }

        const source = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(file)
        })

        const response = await fetch(`${apiBase}/api/fragments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({
            type: mediaType,
            label,
            source,
            detail,
          }),
        })

        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || 'Upload failed')
        }

        const saved = (await response.json()) as ContentItem
        setItems((prev) => [saved, ...prev])
        setIsUploadOpen(false)
      } catch (error) {
        console.error('Upload failed', error)
        setUploadError(
          error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [auth],
  )

  const handleAuthSuccess = (payload: AuthState) => {
    setAuth(payload)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  const handleLogout = () => {
    setAuth(null)
    localStorage.removeItem(STORAGE_KEY)
    setItems([])
    setIsLocationsVisible(false)
    setLocations([])
  }

  const handleSecretHoldStart = () => {
    if (!auth || auth.role !== 'admin') return
    if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current)
    holdTimerRef.current = window.setTimeout(() => {
      setIsLocationsVisible(true)
    }, 900)
  }

  const handleSecretHoldEnd = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  useEffect(() => {
    if (!auth || auth.role !== 'admin') {
      setIsLocationsVisible(false)
      return
    }

    if (!isLocationsVisible) {
      return
    }

    if (!apiBase) {
      setLocationsError('API base is not configured')
      return
    }

    let ignore = false
    const controller = new AbortController()

    const load = async () => {
      setIsLocationsLoading(true)
      setLocationsError(null)
      try {
        const response = await fetch(`${apiBase}/api/locations`, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
          signal: controller.signal,
        })
        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || 'Failed to fetch locations')
        }
        const data = (await response.json()) as LocationEntry[]
        if (!ignore) {
          setLocations(data)
        }
      } catch (error) {
        if (!ignore) {
          setLocationsError(error instanceof Error ? error.message : 'Failed to fetch locations')
        }
      } finally {
        if (!ignore) {
          setIsLocationsLoading(false)
        }
      }
    }

    load()

    return () => {
      ignore = true
      controller.abort()
    }
  }, [isLocationsVisible, auth, apiBase])

  if (!auth) {
    return <LoginView onSuccess={handleAuthSuccess} />
  }

  return (
    <div className={styles.appShell}>
      <div className={styles.contentLayout}>
        <main className={styles.mainSection}>
          <div className={styles.sectionHeader}>
            <p
              className={styles.sectionLabel}
              role={auth.role === 'admin' ? 'button' : undefined}
              tabIndex={auth.role === 'admin' ? 0 : -1}
              onPointerDown={handleSecretHoldStart}
              onPointerUp={handleSecretHoldEnd}
              onPointerLeave={handleSecretHoldEnd}
            >
              Archive
            </p>
            <div className={styles.titleRow}>
              <h2>Nikki&apos;s Kalat</h2>
              <LiveTimeWeather apiBase={apiBase} token={auth.token} />
            </div>
            {isLocationsVisible && auth.role === 'admin' && (
              <LocationsPeek
                locations={locations}
                isLoading={isLocationsLoading}
                error={locationsError}
                onClose={() => setIsLocationsVisible(false)}
              />
            )}
          </div>
          <MediaFilter active={filter} onChange={setFilter} />
          <NikkiGrid items={filteredItems} emptyMessage={isLoading ? 'Loading data...' : undefined} />
        </main>
        <aside className={styles.sidebar}>
          <Header
            onTriggerUpload={() => auth.role === 'admin' && setIsUploadOpen(true)}
            canUpload={auth.role === 'admin'}
            onLogout={handleLogout}
          />
          <StatsSidebar stats={stats} />
        </aside>
      </div>
      {auth.role === 'admin' && (
        <UploadModal
          open={isUploadOpen}
          onClose={() => {
            if (isSubmitting) return
            setUploadError(null)
            setIsUploadOpen(false)
          }}
          onSubmit={handleModalSubmit}
          isSubmitting={isSubmitting}
          error={uploadError}
        />
      )}
    </div>
  )
}

export default App

