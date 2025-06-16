import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address").notNull().unique(),
  walletPrivateKey: text("wallet_private_key").notNull(), // Encrypted
  walletPublicKey: text("wallet_public_key").notNull(),
  credits: integer("credits").default(10),
  discordConnected: boolean("discord_connected").default(false),
  discordUsername: text("discord_username"),
  discordAvatar: text("discord_avatar"),
  xConnected: boolean("x_connected").default(false),
  xUsername: text("x_username"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nfts = pgTable("nfts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  imageUrl: text("image_url").notNull(),
  metadataUrl: text("metadata_url").notNull(),
  price: integer("price").notNull(), // in credits
  editionSize: integer("edition_size").notNull(),
  currentEdition: integer("current_edition").notNull(),
  category: text("category").notNull(),
  zkProofHash: text("zk_proof_hash").notNull(),
  ipfsHash: text("ipfs_hash").notNull(),
  isVerified: boolean("is_verified").default(true),
  isListed: boolean("is_listed").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  nftId: integer("nft_id").references(() => nfts.id).notNull(),
  buyerId: integer("buyer_id").references(() => users.id).notNull(),
  sellerId: integer("seller_id").references(() => users.id).notNull(),
  price: integer("price").notNull(),
  transactionType: text("transaction_type").notNull().default("purchase"),
  zkProofHash: text("zk_proof_hash").notNull(),
  transactionHash: text("transaction_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const zkProofs = pgTable("zk_proofs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  proofType: text("proof_type").notNull(), // 'mint', 'transfer', 'verify'
  proofData: jsonb("proof_data").notNull(),
  proofHash: text("proof_hash").notNull(),
  isValid: boolean("is_valid").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  nftId: integer("nft_id").references(() => nfts.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  nftId: integer("nft_id").references(() => nfts.id).notNull(),
  sellerId: integer("seller_id").references(() => users.id).notNull(),
  price: integer("price").notNull(), // in credits
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  nftId: integer("nft_id").references(() => nfts.id).notNull(),
  bidderId: integer("bidder_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(), // in credits
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional bid expiration
});

export const nftOwnerships = pgTable("nft_ownerships", {
  id: serial("id").primaryKey(),
  nftId: integer("nft_id").references(() => nfts.id).notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  editionNumber: integer("edition_number").notNull(), // Which edition they own
  acquiredAt: timestamp("acquired_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const registerUserSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertNftSchema = createInsertSchema(nfts).pick({
  title: true,
  description: true,
  price: true,
  editionSize: true,
  category: true,
}).extend({
  // Additional fields that will be added during creation
  creatorId: z.number(),
  imageUrl: z.string(),
  metadataUrl: z.string(),
  zkProofHash: z.string(),
  ipfsHash: z.string(),
  currentEdition: z.number(),
  isListed: z.boolean().optional(),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  nftId: true,
  buyerId: true,
  sellerId: true,
  price: true,
});

export const insertListingSchema = createInsertSchema(listings).pick({
  nftId: true,
  sellerId: true,
  price: true,
});

export const insertBidSchema = createInsertSchema(bids).pick({
  nftId: true,
  amount: true,
});

export const insertOwnershipSchema = createInsertSchema(nftOwnerships).pick({
  nftId: true,
  ownerId: true,
  editionNumber: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).pick({
  email: true,
  token: true,
  expiresAt: true,
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  nfts: many(nfts),
  transactions: many(transactions),
  zkProofs: many(zkProofs),
  favorites: many(favorites),
  listings: many(listings),
  bids: many(bids),
  ownerships: many(nftOwnerships),
}));

export const nftsRelations = relations(nfts, ({ one, many }) => ({
  creator: one(users, {
    fields: [nfts.creatorId],
    references: [users.id],
  }),
  transactions: many(transactions),
  favorites: many(favorites),
  listings: many(listings),
  bids: many(bids),
  ownerships: many(nftOwnerships),
}));

export const listingsRelations = relations(listings, ({ one }) => ({
  nft: one(nfts, {
    fields: [listings.nftId],
    references: [nfts.id],
  }),
  seller: one(users, {
    fields: [listings.sellerId],
    references: [users.id],
  }),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  nft: one(nfts, {
    fields: [bids.nftId],
    references: [nfts.id],
  }),
  bidder: one(users, {
    fields: [bids.bidderId],
    references: [users.id],
  }),
}));

export const nftOwnershipsRelations = relations(nftOwnerships, ({ one }) => ({
  nft: one(nfts, {
    fields: [nftOwnerships.nftId],
    references: [nfts.id],
  }),
  owner: one(users, {
    fields: [nftOwnerships.ownerId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  nft: one(nfts, {
    fields: [transactions.nftId],
    references: [nfts.id],
  }),
  buyer: one(users, {
    fields: [transactions.buyerId],
    references: [users.id],
  }),
  seller: one(users, {
    fields: [transactions.sellerId],
    references: [users.id],
  }),
}));

export const zkProofsRelations = relations(zkProofs, ({ one }) => ({
  user: one(users, {
    fields: [zkProofs.userId],
    references: [users.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  nft: one(nfts, {
    fields: [favorites.nftId],
    references: [nfts.id],
  }),
}));

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertNft = z.infer<typeof insertNftSchema>;
export type Nft = typeof nfts.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type ZkProof = typeof zkProofs.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bids.$inferSelect;
export type InsertOwnership = z.infer<typeof insertOwnershipSchema>;
export type NftOwnership = typeof nftOwnerships.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
