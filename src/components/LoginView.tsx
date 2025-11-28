import { useState } from 'react'
import styles from './LoginView.module.css'

type LoginViewProps = {
  onSuccess: (auth: { token: string; role: 'admin' | 'user'; username: string }) => void
}

function LoginView({ onSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Invalid credentials')
      }

      const payload = (await response.json()) as { token: string; role: 'admin' | 'user'; username: string }
      onSuccess(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log in')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.shell}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1>Nikki Tracker</h1>
        <p>Sign in to continue.</p>
        <label>
          <span>Username</span>
          <input value={username} onChange={(event) => setUsername(event.target.value)} required />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default LoginView

