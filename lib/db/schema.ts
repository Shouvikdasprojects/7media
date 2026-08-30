import { pgTable, text, timestamp, boolean, serial, integer, unique } from 'drizzle-orm/pg-core'

// Better Auth tables
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  role: text('role').default('user'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  issuer: text('issuer'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

export const userTwoFactor = pgTable('user_two_factor', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').notNull().default(false),
  deliveryEmail: text('deliveryEmail'),
  backupCodes: text('backupCodes').notNull(), // JSON string array e.g. ["12345678", ...]
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// App tables
export const watchlist = pgTable(
  'watchlist',
  {
    id: serial('id').primaryKey(),
    userId: text('userId').notNull(),
    tmdbId: integer('tmdbId').notNull(),
    mediaType: text('mediaType').notNull(),
    title: text('title').notNull(),
    posterPath: text('posterPath'),
    backdropPath: text('backdropPath'),
    rating: text('rating'),
    year: text('year'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserMedia: unique().on(table.userId, table.tmdbId, table.mediaType),
  })
)

export const progress = pgTable(
  'progress',
  {
    id: serial('id').primaryKey(),
    userId: text('userId').notNull(),
    tmdbId: integer('tmdbId').notNull(),
    mediaType: text('mediaType').notNull(),
    season: integer('season'),
    episode: integer('episode'),
    timestamp: integer('timestamp').notNull().default(0),
    duration: integer('duration'),
    title: text('title').notNull(),
    posterPath: text('posterPath'),
    backdropPath: text('backdropPath'),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserMediaEpisode: unique().on(
      table.userId,
      table.tmdbId,
      table.mediaType,
      table.season,
      table.episode
    ),
  })
)

export const catalogs = pgTable(
  'catalogs',
  {
    id: serial('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    catalogId: text('catalogId').notNull(),
    name: text('name').notNull(),
    color: text('color').notNull().default('emerald'),
    thumbnail: text('thumbnail').notNull().default('Folder'),
    itemIds: text('itemIds').notNull().default('[]'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserCatalog: unique().on(table.userId, table.catalogId),
  })
)

export const reactions = pgTable(
  'reactions',
  {
    id: serial('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    tmdbId: integer('tmdbId').notNull(),
    mediaType: text('mediaType').notNull(),
    isWatched: boolean('isWatched').notNull().default(false),
    isLiked: boolean('isLiked').notNull().default(false),
    isDisliked: boolean('isDisliked').notNull().default(false),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserReaction: unique().on(table.userId, table.tmdbId, table.mediaType),
  })
)

export const contactMessages = pgTable('contact_messages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  topic: text('topic').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('unread'), // unread, read, replied
  replyText: text('replyText'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  titleId: text('titleId').notNull(),
  mediaType: text('mediaType').notNull(), // movie, tv, anime
  parentId: text('parentId'),
  content: text('content').notNull(),
  isSpoiler: boolean('isSpoiler').notNull().default(false),
  likesCount: integer('likesCount').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const commentLikes = pgTable(
  'comment_likes',
  {
    id: text('id').primaryKey(),
    commentId: text('commentId')
      .notNull()
      .references(() => comments.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => ({
    uniqueCommentUserLike: unique().on(table.commentId, table.userId),
  })
)

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('userId').references(() => user.id, { onDelete: 'cascade' }), // null = broadcast to all
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('info'), // info, release, system, social
  link: text('link'),
  isRead: boolean('isRead').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const globalChatMessages = pgTable('global_chat_messages', {
  id: text('id').primaryKey(),
  userId: text('userId').references(() => user.id, { onDelete: 'set null' }),
  userName: text('userName').notNull(),
  userEmail: text('userEmail'),
  userImage: text('userImage'),
  userRole: text('userRole').notNull().default('user'), // 'admin' | 'mod' | 'vip' | 'user'
  content: text('content').notNull(),
  mediaTag: text('mediaTag'), // Optional JSON or title name for recommendations
  likesCount: integer('likesCount').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const directMessages = pgTable('direct_messages', {
  id: text('id').primaryKey(),
  senderId: text('senderId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  receiverId: text('receiverId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isRead: boolean('isRead').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})



