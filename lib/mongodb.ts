import mongoose from "mongoose"

if (!process.env.MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable")
}

const MONGODB_URI: string = process.env.MONGODB_URI

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var _mongooseCache: MongooseCache | undefined
}

const cache: MongooseCache = global._mongooseCache ?? { conn: null, promise: null }
global._mongooseCache = cache

export async function connectToDatabase() {
  if (cache.conn) return cache.conn

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false })
  }

  cache.conn = await cache.promise
  return cache.conn
}
