import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

let dbUrl = process.env.DATABASE_URL || ''
if (dbUrl.includes('sslmode=require')) {
  dbUrl = dbUrl.replace('sslmode=require', 'sslmode=verify-full')
} else if (dbUrl && !dbUrl.includes('sslmode=')) {
  dbUrl += dbUrl.includes('?') ? '&sslmode=verify-full' : '?sslmode=verify-full'
}

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
})

export const db = drizzle(pool, { schema })
