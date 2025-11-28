import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './LiveTimeWeather.module.css'

type PermissionState = 'initial' | 'requesting' | 'granted' | 'denied' | 'unsupported' | 'error'

type WeatherData = {
  summary: string
  temperature: string
}

const WEATHER_REFRESH_MINUTES = 20
const WEATHER_CITY = import.meta.env.VITE_WEATHER_CITY ?? 'London'

type LiveTimeWeatherProps = {
  apiBase: string
  token: string
}

function LiveTimeWeather({ apiBase, token }: LiveTimeWeatherProps) {
  const [now, setNow] = useState(() => new Date())
  const [permission, setPermission] = useState<PermissionState>('initial')
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const postedLocationRef = useRef(false)

  useEffect(() => {
    const ticker = window.setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => {
      window.clearInterval(ticker)
    }
  }, [])

  useEffect(() => {
    if (permission !== 'initial') return

    if (!navigator.geolocation) {
      setPermission('unsupported')
      return
    }

    setPermission('requesting')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setPermission('granted')
      },
      (error) => {
        setPermission(error.code === error.PERMISSION_DENIED ? 'denied' : 'error')
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
      },
    )
  }, [permission])

  useEffect(() => {
    if (permission !== 'granted') return

    const apiKey = import.meta.env.VITE_WEATHER_API_KEY
    if (!apiKey) {
      setWeatherError('API key missing')
      return
    }

    let ignore = false

    const load = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
            WEATHER_CITY,
          )}&units=metric&appid=${apiKey}`,
        )
        if (!response.ok) {
          throw new Error('Weather request failed')
        }

        const data = (await response.json()) as {
          main?: { temp?: number }
          weather?: { description?: string }[]
          name?: string
        }

        const temperature = data.main?.temp
        if (typeof temperature !== 'number') {
          throw new Error('Invalid weather payload')
        }

        const summaryPieces = [data.name, data.weather?.[0]?.description]
          .filter(Boolean)
          .join(' • ')

        if (!ignore) {
          setWeather({
            summary: summaryPieces || 'Current weather',
            temperature: `${Math.round(temperature)}°C`,
          })
          setWeatherError(null)
        }
      } catch (error) {
        console.error(error)
        if (!ignore) {
          setWeather(null)
          setWeatherError('Unable to load')
        }
      }
    }

    load()
    const refresh = window.setInterval(load, WEATHER_REFRESH_MINUTES * 60_000)

    return () => {
      ignore = true
      window.clearInterval(refresh)
    }
  }, [permission])

  useEffect(() => {
    if (postedLocationRef.current) return
    if (permission !== 'granted' || !coords) return
    if (!token || !apiBase) return

    const controller = new AbortController()

    const sendLocation = async () => {
      try {
        const response = await fetch(`${apiBase}/api/locations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            latitude: coords.latitude,
            longitude: coords.longitude,
          }),
          signal: controller.signal,
        })

        if (response.ok) {
          postedLocationRef.current = true
        }
      } catch (error) {
        console.error('Failed to save location', error)
      }
    }

    sendLocation()

    return () => {
      controller.abort()
    }
  }, [permission, coords, token, apiBase])

  const timeLabel = useMemo(
    () =>
      now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [now],
  )

  let weatherLabel = 'Weather'
  let weatherValue: string

  if (permission === 'requesting') {
    weatherValue = 'Awaiting permission'
  } else if (permission === 'denied') {
    weatherValue = 'Permission denied'
  } else if (permission === 'unsupported') {
    weatherValue = 'Location unavailable'
  } else if (permission === 'error') {
    weatherValue = 'Location error'
  } else if (permission === 'granted') {
    if (weather) {
      weatherLabel = weather.summary
      weatherValue = weather.temperature
    } else if (weatherError) {
      weatherValue = weatherError
    } else {
      weatherValue = 'Loading...'
    }
  } else {
    weatherValue = 'Allow location to view'
  }

  return (
    <div className={styles.liveShell} aria-live="polite">
      <div className={styles.block}>
        <span className={styles.label}>Now</span>
        <span className={styles.value}>{timeLabel}</span>
      </div>
      <div className={styles.divider} aria-hidden />
      <div className={styles.block}>
        <span className={styles.label}>{weatherLabel}</span>
        <span className={styles.value}>{weatherValue}</span>
      </div>
    </div>
  )
}

export default LiveTimeWeather

