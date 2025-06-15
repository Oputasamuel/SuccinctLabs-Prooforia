import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  discordId: text("discord_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nfts = pgTable("nfts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  imageUrl: text("image_url").notNull(),
  metadataUrl: text("metadata_url").notNull(),
  price: integer("price").notNull(), // in tokens
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  discordId: true,
});

export const insertNftSchema = createInsertSchema(nfts).pick({
  title: true,
  description: true,
  price: true,
  editionSize: true,
  category: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  nftId: true,
  buyerId: true,
  sellerId: true,
  price: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertNft = z.infer<typeof insertNftSchema>;
export type Nft = typeof nfts.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type ZkProof = typeof zkProofs.$inferSelect;
