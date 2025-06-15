import { 
  users, nfts, transactions, zkProofs,
  type User, type InsertUser, 
  type Nft, type InsertNft,
  type Transaction, type InsertTransaction,
  type ZkProof
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, count, sum } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: {
    username: string;
    email: string;
    password: string;
    walletAddress: string;
    walletPrivateKey: string;
    walletPublicKey: string;
  }): Promise<User>;
  updateUserCredits(userId: number, credits: number): Promise<User>;
  connectDiscord(userId: number, discordUsername: string, discordAvatar?: string): Promise<User>;
  connectX(userId: number, xUsername: string): Promise<User>;
  
  // NFT operations
  getNft(id: number): Promise<Nft | undefined>;
  getNfts(filters?: { category?: string; creatorId?: number; isListed?: boolean }): Promise<Nft[]>;
  createNft(nft: InsertNft & { 
    creatorId: number; 
    imageUrl: string; 
    metadataUrl: string; 
    zkProofHash: string; 
    ipfsHash: string;
    currentEdition: number;
  }): Promise<Nft>;
  updateNft(id: number, updates: Partial<Nft>): Promise<Nft>;
  
  // Transaction operations
  getTransactions(userId?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction & { 
    zkProofHash: string; 
    transactionHash?: string 
  }): Promise<Transaction>;
  
  // ZK Proof operations
  getZkProofs(userId: number): Promise<ZkProof[]>;
  createZkProof(proof: { 
    userId: number; 
    proofType: string; 
    proofData: any; 
    proofHash: string 
  }): Promise<ZkProof>;
  
  // Favorites operations
  addFavorite(userId: number, nftId: number): Promise<void>;
  removeFavorite(userId: number, nftId: number): Promise<void>;
  getFavorites(userId: number): Promise<Nft[]>;
  
  // Stats
  getStats(): Promise<{
    totalNfts: number;
    activeArtists: number;
    totalVolume: number;
    communityMembers: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private nfts: Map<number, Nft>;
  private transactions: Map<number, Transaction>;
  private zkProofs: Map<number, ZkProof>;
  private favorites: Map<string, { userId: number; nftId: number }>;
  private currentUserId: number;
  private currentNftId: number;
  private currentTransactionId: number;
  private currentProofId: number;

  constructor() {
    this.users = new Map();
    this.nfts = new Map();
    this.transactions = new Map();
    this.zkProofs = new Map();
    this.favorites = new Map();
    this.currentUserId = 1;
    this.currentNftId = 1;
    this.currentTransactionId = 1;
    this.currentProofId = 1;

    // Initialize with some sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create sample users
    const artist1 = await this.createUser({
      username: "ArtistCRN",
      password: "password123",
    });

    const artist2 = await this.createUser({
      username: "Artist234",
      password: "password123",
    });

    const artist3 = await this.createUser({
      username: "ZKArtist",
      password: "password123",
    });

    // Create sample NFTs
    await this.createNft({
      title: "SP1 Circuit Dreams",
      description: "A vibrant digital abstract art piece showcasing the beauty of zero-knowledge circuits",
      creatorId: artist1.id,
      price: 0.5,
      editionSize: 10,
      currentEdition: 1,
      category: "Digital Art",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
      metadataUrl: "ipfs://QmExample1",
      zkProofHash: "0xzkproof1234",
      ipfsHash: "QmExample1",
    });

    await this.createNft({
      title: "Cryptographic Mandala",
      description: "Sacred geometry meets cryptography in this unique mandala design",
      creatorId: artist2.id,
      price: 0.8,
      editionSize: 1,
      currentEdition: 1,
      category: "Digital Art",
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
      metadataUrl: "ipfs://QmExample2",
      zkProofHash: "0xzkproof5678",
      ipfsHash: "QmExample2",
    });

    await this.createNft({
      title: "Succinct Genesis #1",
      description: "The first in a series celebrating the future of zero-knowledge proofs",
      creatorId: artist3.id,
      price: 1.2,
      editionSize: 5,
      currentEdition: 3,
      category: "Generative Art",
      imageUrl: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
      metadataUrl: "ipfs://QmExample3",
      zkProofHash: "0xzkproof9012",
      ipfsHash: "QmExample3",
    });

    await this.createNft({
      title: "ZK Abstracts",
      description: "Modern minimalist composition exploring the aesthetics of zero-knowledge",
      creatorId: artist1.id,
      price: 0.3,
      editionSize: 1,
      currentEdition: 1,
      category: "Abstract",
      imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
      metadataUrl: "ipfs://QmExample4",
      zkProofHash: "0xzkproof3456",
      ipfsHash: "QmExample4",
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.discordId === discordId);
  }

  async createDiscordUser(userData: {
    username: string;
    discordId: string;
    discordUsername: string;
    discordAvatar?: string | null;
    walletAddress: string;
    walletPrivateKey: string;
    walletPublicKey: string;
  }): Promise<User> {
    const user: User = {
      id: this.currentUserId++,
      username: userData.username,
      password: null,
      discordId: userData.discordId,
      discordUsername: userData.discordUsername,
      discordAvatar: userData.discordAvatar || null,
      walletAddress: userData.walletAddress,
      walletPrivateKey: userData.walletPrivateKey,
      walletPublicKey: userData.walletPublicKey,
      testTokenBalance: 100,
      delegatedCredits: 10,
      createdAt: new Date(),
    };
    
    this.users.set(user.id, user);
    return user;
  }

  async updateUserCredits(userId: number, credits: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    user.delegatedCredits = credits;
    this.users.set(userId, user);
    return user;
  }

  async updateUserTokenBalance(userId: number, balance: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    user.testTokenBalance = balance;
    this.users.set(userId, user);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      discordId: insertUser.discordId || null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getNft(id: number): Promise<Nft | undefined> {
    return this.nfts.get(id);
  }

  async getNfts(filters?: { category?: string; creatorId?: number; isListed?: boolean }): Promise<Nft[]> {
    let results = Array.from(this.nfts.values());
    
    if (filters?.category) {
      results = results.filter(nft => nft.category === filters.category);
    }
    if (filters?.creatorId) {
      results = results.filter(nft => nft.creatorId === filters.creatorId);
    }
    if (filters?.isListed !== undefined) {
      results = results.filter(nft => nft.isListed === filters.isListed);
    }
    
    return results.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async createNft(nftData: InsertNft & { 
    creatorId: number; 
    imageUrl: string; 
    metadataUrl: string; 
    zkProofHash: string; 
    ipfsHash: string;
    currentEdition: number;
  }): Promise<Nft> {
    const id = this.currentNftId++;
    const nft: Nft = {
      ...nftData,
      id,
      description: nftData.description || null,
      isVerified: true,
      isListed: true,
      createdAt: new Date(),
    };
    this.nfts.set(id, nft);
    return nft;
  }

  async updateNft(id: number, updates: Partial<Nft>): Promise<Nft> {
    const existing = this.nfts.get(id);
    if (!existing) throw new Error("NFT not found");
    
    const updated = { ...existing, ...updates };
    this.nfts.set(id, updated);
    return updated;
  }

  async getTransactions(userId?: number): Promise<Transaction[]> {
    let results = Array.from(this.transactions.values());
    
    if (userId) {
      results = results.filter(tx => tx.buyerId === userId || tx.sellerId === userId);
    }
    
    return results.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async createTransaction(transactionData: InsertTransaction & { 
    zkProofHash: string; 
    transactionHash?: string 
  }): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      ...transactionData,
      id,
      transactionType: "purchase",
      transactionHash: transactionData.transactionHash || null,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getZkProofs(userId: number): Promise<ZkProof[]> {
    return Array.from(this.zkProofs.values())
      .filter(proof => proof.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async createZkProof(proofData: { 
    userId: number; 
    proofType: string; 
    proofData: any; 
    proofHash: string 
  }): Promise<ZkProof> {
    const id = this.currentProofId++;
    const proof: ZkProof = {
      ...proofData,
      id,
      isValid: true,
      createdAt: new Date(),
    };
    this.zkProofs.set(id, proof);
    return proof;
  }

  async getStats(): Promise<{
    totalNfts: number;
    activeArtists: number;
    totalVolume: number;
    communityMembers: number;
  }> {
    const totalNfts = this.nfts.size;
    const activeArtists = new Set(Array.from(this.nfts.values()).map(nft => nft.creatorId)).size;
    const totalVolume = Array.from(this.transactions.values()).reduce((sum, tx) => sum + tx.price, 0);
    const communityMembers = 342; // Mock discord member count
    
    return {
      totalNfts,
      activeArtists,
      totalVolume,
      communityMembers,
    };
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    walletAddress: string;
    walletPrivateKey: string;
    walletPublicKey: string;
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        walletAddress: userData.walletAddress,
        walletPrivateKey: userData.walletPrivateKey,
        walletPublicKey: userData.walletPublicKey,
        credits: 10,
        discordConnected: false,
        xConnected: false,
      })
      .returning();
    return user;
  }

  async updateUserCredits(userId: number, credits: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ credits: credits })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async connectDiscord(userId: number, discordUsername: string, discordAvatar?: string): Promise<User> {
    // First get current user to calculate new credits
    const currentUser = await this.getUser(userId);
    if (!currentUser) throw new Error("User not found");
    
    const newCredits = (currentUser.credits || 10) + (currentUser.discordConnected ? 0 : 4);
    
    const [user] = await db
      .update(users)
      .set({ 
        discordConnected: true,
        discordUsername: discordUsername,
        discordAvatar: discordAvatar || null,
        credits: newCredits
      })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async connectX(userId: number, xUsername: string): Promise<User> {
    // First get current user to calculate new credits
    const currentUser = await this.getUser(userId);
    if (!currentUser) throw new Error("User not found");
    
    const newCredits = (currentUser.credits || 10) + (currentUser.xConnected ? 0 : 6);
    
    const [user] = await db
      .update(users)
      .set({ 
        xConnected: true,
        xUsername: xUsername,
        credits: newCredits
      })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async getNft(id: number): Promise<Nft | undefined> {
    const [nft] = await db.select().from(nfts).where(eq(nfts.id, id));
    return nft || undefined;
  }

  async getNfts(filters?: { category?: string; creatorId?: number; isListed?: boolean }): Promise<Nft[]> {
    const conditions = [];
    
    if (filters?.category) {
      conditions.push(eq(nfts.category, filters.category));
    }
    if (filters?.creatorId) {
      conditions.push(eq(nfts.creatorId, filters.creatorId));
    }
    if (filters?.isListed !== undefined) {
      conditions.push(eq(nfts.isListed, filters.isListed));
    }
    
    if (conditions.length > 0) {
      return db.select().from(nfts).where(and(...conditions)).orderBy(desc(nfts.createdAt));
    }
    
    return db.select().from(nfts).orderBy(desc(nfts.createdAt));
  }

  async createNft(nftData: InsertNft & { 
    creatorId: number; 
    imageUrl: string; 
    metadataUrl: string; 
    zkProofHash: string; 
    ipfsHash: string;
    currentEdition: number;
  }): Promise<Nft> {
    const [nft] = await db
      .insert(nfts)
      .values({
        ...nftData,
        description: nftData.description || null,
        isVerified: true,
        isListed: true,
      })
      .returning();
    return nft;
  }

  async updateNft(id: number, updates: Partial<Nft>): Promise<Nft> {
    const [nft] = await db
      .update(nfts)
      .set(updates)
      .where(eq(nfts.id, id))
      .returning();
    if (!nft) throw new Error("NFT not found");
    return nft;
  }

  async getTransactions(userId?: number): Promise<Transaction[]> {
    if (userId) {
      return db.select().from(transactions).where(
        or(
          eq(transactions.buyerId, userId),
          eq(transactions.sellerId, userId)
        )
      ).orderBy(desc(transactions.createdAt));
    }
    
    return db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transactionData: InsertTransaction & { 
    zkProofHash: string; 
    transactionHash?: string 
  }): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({
        ...transactionData,
        transactionHash: transactionData.transactionHash || null,
      })
      .returning();
    return transaction;
  }

  async getZkProofs(userId: number): Promise<ZkProof[]> {
    return db
      .select()
      .from(zkProofs)
      .where(eq(zkProofs.userId, userId))
      .orderBy(desc(zkProofs.createdAt));
  }

  async createZkProof(proofData: { 
    userId: number; 
    proofType: string; 
    proofData: any; 
    proofHash: string 
  }): Promise<ZkProof> {
    const [proof] = await db
      .insert(zkProofs)
      .values({
        ...proofData,
        isValid: true,
      })
      .returning();
    return proof;
  }

  async getStats(): Promise<{
    totalNfts: number;
    activeArtists: number;
    totalVolume: number;
    communityMembers: number;
  }> {
    const [nftCount] = await db
      .select({ count: count() })
      .from(nfts);
    
    const [artistCount] = await db
      .select({ count: count(users.id) })
      .from(users)
      .innerJoin(nfts, eq(users.id, nfts.creatorId));
    
    const [volumeResult] = await db
      .select({ total: sum(transactions.price) })
      .from(transactions);
    
    return {
      totalNfts: nftCount.count,
      activeArtists: artistCount.count,
      totalVolume: Number(volumeResult.total) || 0,
      communityMembers: 342, // Mock discord member count
    };
  }
}

export const storage = new DatabaseStorage();
