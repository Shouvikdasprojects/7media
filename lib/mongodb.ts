import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI || process.env.MONGODB_CHAT_URI || ''
const options = {}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

export function isMongoConfigured(): boolean {
  return Boolean(uri && uri.startsWith('mongodb'))
}

export async function getMongoClient(): Promise<MongoClient | null> {
  if (!isMongoConfigured()) {
    return null
  }

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options)
      global._mongoClientPromise = client.connect()
    }
    return global._mongoClientPromise
  } else {
    // In production mode, it's best to not use a global variable.
    if (!clientPromise) {
      client = new MongoClient(uri, options)
      clientPromise = client.connect()
    }
    return clientPromise
  }
}

export async function getChatDatabase(): Promise<Db | null> {
  const mongo = await getMongoClient()
  if (!mongo) return null

  // By default uses the database name specified in the connection string, or '7media_chat'
  return mongo.db(process.env.MONGODB_DB_NAME || '7media_chat')
}
