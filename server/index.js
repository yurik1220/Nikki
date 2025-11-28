import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

dotenv.config()

const app = express()
const PORT = process.env.API_PORT ?? 4000
const JWT_SECRET = process.env.JWT_SECRET ?? 'nikki-dev-secret'

if (!process.env.DATABASE_URL) {
  console.warn('[server] DATABASE_URL is not set. API will not be able to reach the database.')
}

const sslConfig =
  process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
})

const seedContent = [
  {
    id: randomUUID(),
    type: 'voice',
    label: 'VM #1',
    source:
      'https://cdn.pixabay.com/download/audio/2022/03/15/audio_e176cb74f2.mp3?filename=calm-notes-21673.mp3',
    detail: 'Morning riff she sent last month.',
  },
  {
    id: randomUUID(),
    type: 'photo',
    label: 'Snap 02',
    source:
      'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&w=600&q=80',
    detail: 'Neutral city walk shot she likes.',
  },
  {
    id: randomUUID(),
    type: 'quote',
    label: 'Quote 04',
    source: '"I keep plans loose so the day can surprise me."',
    detail: null,
  },
  {
    id: randomUUID(),
    type: 'fact',
    label: 'Fact #6',
    source: 'Prefers playlists sorted by weather instead of genre.',
    detail: null,
  },
]

app.use(cors())
app.use(express.json({ limit: '40mb' }))

const ensureSetup = async () => {
  await pool.query(`
    create table if not exists fragments (
      id uuid primary key,
      type text not null check (type in ('voice', 'photo', 'quote', 'fact')),
      label text not null,
      source text not null,
      detail text,
      created_at timestamptz default now()
    )
  `)

  await pool.query(`
    create table if not exists accounts (
      id uuid primary key,
      username text unique not null,
      password text not null,
      role text not null check (role in ('admin', 'user'))
    )
  `)

  const ensureAccount = async (username, password, role) => {
    const existing = await pool.query('select id from accounts where username = $1', [username])
    if (existing.rowCount === 0) {
      const hash = await bcrypt.hash(password, 10)
      await pool.query('insert into accounts (id, username, password, role) values ($1, $2, $3, $4)', [
        randomUUID(),
        username,
        hash,
        role,
      ])
    }
  }

  await Promise.all([
    ensureAccount('admin', 'admin', 'admin'),
    ensureAccount('Nikki', 'Nikki', 'user'),
  ])

  const { rows } = await pool.query('select count(*)::int as count from fragments')
  if (rows[0]?.count === 0) {
    const insertValues = seedContent
      .map(
        (item, index) =>
          `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${
            index * 5 + 5
          })`,
      )
      .join(',')

    const params = seedContent.flatMap((item) => [
      item.id,
      item.type,
      item.label,
      item.source,
      item.detail,
    ])

    await pool.query(
      `insert into fragments (id, type, label, source, detail) values ${insertValues}`,
      params,
    )
  }
}

app.get('/api/fragments', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'select id, type, label, source, detail, created_at from fragments order by created_at desc',
    )
    res.json(rows)
  } catch (error) {
    console.error('[server] Failed to fetch fragments', error)
    res.status(500).json({ message: 'Failed to fetch fragments' })
  }
})

const authenticate = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET)
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin privileges required' })
  }
  return next()
}

app.post('/api/fragments', authenticate, requireAdmin, async (req, res) => {
  const { type, label, source, detail } = req.body ?? {}

  if (!type || !label || !source) {
    return res.status(400).json({ message: 'type, label and source are required' })
  }

  if (!['voice', 'photo', 'quote', 'fact'].includes(type)) {
    return res.status(400).json({ message: 'Unsupported fragment type' })
  }

  const id = randomUUID()

  try {
    const { rows } = await pool.query(
      'insert into fragments (id, type, label, source, detail) values ($1, $2, $3, $4, $5) returning id, type, label, source, detail, created_at',
      [id, type, label, source, detail ?? null],
    )
    res.status(201).json(rows[0])
  } catch (error) {
    console.error('[server] Failed to create fragment', error)
    res.status(500).json({ message: 'Failed to create fragment' })
  }
})

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body ?? {}

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' })
  }

  try {
    const { rows } = await pool.query('select id, username, password, role from accounts where username = $1', [
      username,
    ])
    const account = rows[0]
    if (!account) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    const isMatch = await bcrypt.compare(password, account.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    const token = jwt.sign(
      { sub: account.id, username: account.username, role: account.role },
      JWT_SECRET,
      { expiresIn: '12h' },
    )

    res.json({ token, role: account.role, username: account.username })
  } catch (error) {
    console.error('[server] Login failed', error)
    res.status(500).json({ message: 'Login failed' })
  }
})

ensureSetup()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`)
    })
  })
  .catch((error) => {
    console.error('[server] Failed to start API', error)
    process.exit(1)
  })

