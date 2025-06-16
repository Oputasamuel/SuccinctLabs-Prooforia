import { 
  users, nfts, transactions, zkProofs, favorites, listings, bids, nftOwnerships, passwordResetTokens,
  type User, type InsertUser, 
  type Nft, type InsertNft,
  type Transaction, type InsertTransaction,
  type ZkProof, type Listing, type InsertListing,
  type Bid, type InsertBid,
  type NftOwnership, type InsertOwnership,
  type PasswordResetToken, type InsertPasswordResetToken
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, count, sum } from "drizzle-orm";

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
  
  // Bidding operations
  createBid(bid: InsertBid & { bidderId: number }): Promise<Bid>;
  getBidsForNft(nftId: number): Promise<Bid[]>;
  getUserBids(userId: number): Promise<Bid[]>;
  acceptBid(bidId: number, sellerId: number): Promise<Transaction>;
  
  // Listing operations
  createListing(listing: InsertListing): Promise<Listing>;
  getListingsForNft(nftId: number): Promise<Listing[]>;
  getUserListings(userId: number): Promise<Listing[]>;
  buyFromListing(listingId: number, buyerId: number): Promise<Transaction>;
  deactivateListing(listingId: number): Promise<void>;
  
  // Ownership operations
  createOwnership(ownership: InsertOwnership): Promise<NftOwnership>;
  getOwnershipsForUser(userId: number): Promise<NftOwnership[]>;
  getOwnershipsForNft(nftId: number): Promise<NftOwnership[]>;
  transferOwnership(nftId: number, fromUserId: number, toUserId: number, editionNumber: number): Promise<void>;
  
  // Enhanced NFT operations
  getNftWithDetails(nftId: number): Promise<Nft & {
    listings?: Listing[];
    bids?: Bid[];
    ownerships?: NftOwnership[];
    highestBid?: number;
    lowestListing?: number;
    isMintedOut?: boolean;
  }>;
  
  // Stats
  getStats(): Promise<{
    totalNfts: number;
    activeArtists: number;
    totalVolume: number;
    communityMembers: number;
  }>;
  
  // Password Reset operations
  createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(tokenId: number): Promise<void>;
  updateUserPassword(email: string, newPassword: string): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private nfts: Map<number, Nft>;
  private transactions: Map<number, Transaction>;
  private zkProofs: Map<number, ZkProof>;
  private favorites: Map<string, { userId: number; nftId: number }>;
  private listings: Map<number, Listing>;
  private bids: Map<number, Bid>;
  private ownerships: Map<number, NftOwnership>;
  private currentUserId: number;
  private currentNftId: number;
  private currentTransactionId: number;
  private currentProofId: number;
  private currentListingId: number;
  private currentBidId: number;
  private currentOwnershipId: number;

  constructor() {
    this.users = new Map();
    this.nfts = new Map();
    this.transactions = new Map();
    this.zkProofs = new Map();
    this.favorites = new Map();
    this.listings = new Map();
    this.bids = new Map();
    this.ownerships = new Map();
    this.currentUserId = 1;
    this.currentNftId = 1;
    this.currentTransactionId = 1;
    this.currentProofId = 1;
    this.currentListingId = 1;
    this.currentBidId = 1;
    this.currentOwnershipId = 1;

    // Initialize with some sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create sample users with complete data
    const artist1 = await this.createUser({
      username: "ArtistCRN",
      email: "artist1@example.com",
      password: "password123",
      walletAddress: "0x742d35Cc6665C6673532B4e8B2b421C2a87c4d21",
      walletPrivateKey: "encrypted_private_key_1",
      walletPublicKey: "public_key_1"
    });

    const artist2 = await this.createUser({
      username: "Artist234",
      email: "artist2@example.com",
      password: "password123",
      walletAddress: "0x8ba1f109551bD432803012645Hac136c841B2345",
      walletPrivateKey: "encrypted_private_key_2",
      walletPublicKey: "public_key_2"
    });

    const artist3 = await this.createUser({
      username: "ZKArtist",
      email: "artist3@example.com",
      password: "password123",
      walletAddress: "0x9ca2g209661cE543914123756Ibd247d952C3456",
      walletPrivateKey: "encrypted_private_key_3",
      walletPublicKey: "public_key_3"
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
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

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    walletAddress: string;
    walletPrivateKey: string;
    walletPublicKey: string;
  }): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      username: userData.username,
      email: userData.email,
      password: userData.password,
      walletAddress: userData.walletAddress,
      walletPrivateKey: userData.walletPrivateKey,
      walletPublicKey: userData.walletPublicKey,
      credits: 10,
      discordConnected: false,
      discordUsername: null,
      discordAvatar: null,
      xConnected: false,
      xUsername: null,
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

  async addFavorite(userId: number, nftId: number): Promise<void> {
    const key = `${userId}-${nftId}`;
    this.favorites.set(key, { userId, nftId });
  }

  async removeFavorite(userId: number, nftId: number): Promise<void> {
    const key = `${userId}-${nftId}`;
    this.favorites.delete(key);
  }

  async getFavorites(userId: number): Promise<Nft[]> {
    const userFavorites = Array.from(this.favorites.values())
      .filter(fav => fav.userId === userId)
      .map(fav => fav.nftId);
    
    return userFavorites
      .map(nftId => this.nfts.get(nftId))
      .filter((nft): nft is Nft => nft !== undefined);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async connectDiscord(userId: number, discordUsername: string, discordAvatar?: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = {
      ...user,
      discordConnected: true,
      discordUsername,
      discordAvatar: discordAvatar || null,
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async connectX(userId: number, xUsername: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    
    const updatedUser = {
      ...user,
      xConnected: true,
      xUsername,
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Bidding operations
  async createBid(bid: InsertBid & { bidderId: number }): Promise<Bid> {
    const newBid: Bid = {
      id: this.currentBidId++,
      nftId: bid.nftId,
      bidderId: bid.bidderId,
      amount: bid.amount,
      isActive: true,
      createdAt: new Date(),
      expiresAt: null,
    };
    this.bids.set(newBid.id, newBid);
    return newBid;
  }

  async getBidsForNft(nftId: number): Promise<Bid[]> {
    return Array.from(this.bids.values()).filter(bid => 
      bid.nftId === nftId && bid.isActive
    ).sort((a, b) => b.amount - a.amount);
  }

  async getUserBids(userId: number): Promise<Bid[]> {
    return Array.from(this.bids.values()).filter(bid => 
      bid.bidderId === userId && bid.isActive
    );
  }

  async acceptBid(bidId: number, sellerId: number): Promise<Transaction> {
    const bid = this.bids.get(bidId);
    if (!bid) throw new Error("Bid not found");
    
    // Create transaction
    const transaction = await this.createTransaction({
      nftId: bid.nftId,
      buyerId: bid.bidderId,
      sellerId,
      price: bid.amount,
      zkProofHash: `proof_${Date.now()}`,
    });

    // Deactivate bid
    bid.isActive = false;
    this.bids.set(bidId, bid);

    return transaction;
  }

  // Listing operations
  async createListing(listing: InsertListing): Promise<Listing> {
    const newListing: Listing = {
      id: this.currentListingId++,
      ...listing,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.listings.set(newListing.id, newListing);
    return newListing;
  }

  async getListingsForNft(nftId: number): Promise<Listing[]> {
    return Array.from(this.listings.values()).filter(listing => 
      listing.nftId === nftId && listing.isActive
    ).sort((a, b) => a.price - b.price);
  }

  async getUserListings(userId: number): Promise<Listing[]> {
    return Array.from(this.listings.values()).filter(listing => 
      listing.sellerId === userId && listing.isActive
    );
  }

  async buyFromListing(listingId: number, buyerId: number): Promise<Transaction> {
    const listing = this.listings.get(listingId);
    if (!listing) throw new Error("Listing not found");
    
    // Create transaction
    const transaction = await this.createTransaction({
      nftId: listing.nftId,
      buyerId,
      sellerId: listing.sellerId,
      price: listing.price,
      zkProofHash: `proof_${Date.now()}`,
    });

    // Deactivate listing
    listing.isActive = false;
    this.listings.set(listingId, listing);

    return transaction;
  }

  async deactivateListing(listingId: number): Promise<void> {
    const listing = this.listings.get(listingId);
    if (listing) {
      listing.isActive = false;
      this.listings.set(listingId, listing);
    }
  }

  // Ownership operations
  async createOwnership(ownership: InsertOwnership): Promise<NftOwnership> {
    const newOwnership: NftOwnership = {
      id: this.currentOwnershipId++,
      ...ownership,
      acquiredAt: new Date(),
    };
    this.ownerships.set(newOwnership.id, newOwnership);
    return newOwnership;
  }

  async getOwnershipsForUser(userId: number): Promise<NftOwnership[]> {
    return Array.from(this.ownerships.values()).filter(ownership => 
      ownership.ownerId === userId
    );
  }

  async getOwnershipsForNft(nftId: number): Promise<NftOwnership[]> {
    return Array.from(this.ownerships.values()).filter(ownership => 
      ownership.nftId === nftId
    );
  }

  async transferOwnership(nftId: number, fromUserId: number, toUserId: number, editionNumber: number): Promise<void> {
    const ownership = Array.from(this.ownerships.values()).find(o => 
      o.nftId === nftId && o.ownerId === fromUserId && o.editionNumber === editionNumber
    );
    
    if (ownership) {
      ownership.ownerId = toUserId;
      ownership.acquiredAt = new Date();
      this.ownerships.set(ownership.id, ownership);
    }
  }

  // Enhanced NFT operations
  async getNftWithDetails(nftId: number): Promise<Nft & {
    listings?: Listing[];
    bids?: Bid[];
    ownerships?: NftOwnership[];
    highestBid?: number;
    lowestListing?: number;
    isMintedOut?: boolean;
  }> {
    const nft = await this.getNft(nftId);
    if (!nft) throw new Error("NFT not found");

    const listings = await this.getListingsForNft(nftId);
    const bids = await this.getBidsForNft(nftId);
    const ownerships = await this.getOwnershipsForNft(nftId);
    
    const highestBid = bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : undefined;
    const lowestListing = listings.length > 0 ? Math.min(...listings.map(l => l.price)) : undefined;
    const isMintedOut = nft.currentEdition >= nft.editionSize;

    return {
      ...nft,
      listings,
      bids,
      ownerships,
      highestBid,
      lowestListing,
      isMintedOut,
    };
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
    const communityMembers = 342;
    
    return {
      totalNfts,
      activeArtists,
      totalVolume,
      communityMembers,
    };
  }

  // Password Reset operations (MemStorage implementation)
  async createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    // For MemStorage, we'll throw an error since this should use DatabaseStorage for persistence
    throw new Error("Password reset not supported in memory storage");
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    throw new Error("Password reset not supported in memory storage");
  }

  async markTokenAsUsed(tokenId: number): Promise<void> {
    throw new Error("Password reset not supported in memory storage");
  }

  async updateUserPassword(email: string, newPassword: string): Promise<User> {
    throw new Error("Password reset not supported in memory storage");
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

  async addFavorite(userId: number, nftId: number): Promise<void> {
    await db.insert(favorites).values({ userId, nftId });
  }

  async removeFavorite(userId: number, nftId: number): Promise<void> {
    await db.delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.nftId, nftId)));
  }

  async getFavorites(userId: number): Promise<Nft[]> {
    return db
      .select({
        id: nfts.id,
        title: nfts.title,
        description: nfts.description,
        creatorId: nfts.creatorId,
        imageUrl: nfts.imageUrl,
        metadataUrl: nfts.metadataUrl,
        price: nfts.price,
        editionSize: nfts.editionSize,
        currentEdition: nfts.currentEdition,
        category: nfts.category,
        zkProofHash: nfts.zkProofHash,
        ipfsHash: nfts.ipfsHash,
        isVerified: nfts.isVerified,
        isListed: nfts.isListed,
        createdAt: nfts.createdAt,
      })
      .from(favorites)
      .innerJoin(nfts, eq(favorites.nftId, nfts.id))
      .where(eq(favorites.userId, userId));
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
      communityMembers: 342,
    };
  }

  // Bidding operations
  async createBid(bid: InsertBid & { bidderId: number }): Promise<Bid> {
    const [newBid] = await db.insert(bids).values({
      nftId: bid.nftId,
      bidderId: bid.bidderId,
      amount: bid.amount,
      isActive: true,
      createdAt: new Date(),
      expiresAt: null,
    }).returning();
    return newBid;
  }

  async getBidsForNft(nftId: number): Promise<Bid[]> {
    return await db.select().from(bids).where(eq(bids.nftId, nftId)).orderBy(desc(bids.amount));
  }

  async getUserBids(userId: number): Promise<Bid[]> {
    return await db.select().from(bids).where(eq(bids.bidderId, userId)).orderBy(desc(bids.createdAt));
  }

  async acceptBid(bidId: number, sellerId: number): Promise<Transaction> {
    const bid = await db.select().from(bids).where(eq(bids.id, bidId)).limit(1);
    if (!bid[0]) throw new Error("Bid not found");

    const transaction = await this.createTransaction({
      buyerId: bid[0].bidderId,
      sellerId,
      nftId: bid[0].nftId,
      price: bid[0].amount,
      type: "purchase",
      zkProofHash: `proof_${Date.now()}`
    });

    // Deactivate the accepted bid
    await db.update(bids).set({ isActive: false }).where(eq(bids.id, bidId));

    return transaction;
  }

  // Listing operations
  async createListing(listing: InsertListing): Promise<Listing> {
    const [newListing] = await db.insert(listings).values(listing).returning();
    return newListing;
  }

  async getListingsForNft(nftId: number): Promise<Listing[]> {
    return await db.select().from(listings).where(and(eq(listings.nftId, nftId), eq(listings.isActive, true))).orderBy(asc(listings.price));
  }

  async getUserListings(userId: number): Promise<Listing[]> {
    return await db.select().from(listings).where(eq(listings.sellerId, userId)).orderBy(desc(listings.createdAt));
  }

  async buyFromListing(listingId: number, buyerId: number): Promise<Transaction> {
    const listing = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!listing[0] || !listing[0].isActive) throw new Error("Listing not found or inactive");

    const transaction = await this.createTransaction({
      buyerId,
      sellerId: listing[0].sellerId,
      nftId: listing[0].nftId,
      price: listing[0].price,
      type: "purchase",
      zkProofHash: `proof_${Date.now()}`
    });

    // Deactivate the listing
    await this.deactivateListing(listingId);

    return transaction;
  }

  async deactivateListing(listingId: number): Promise<void> {
    await db.update(listings).set({ isActive: false }).where(eq(listings.id, listingId));
  }

  // Ownership operations
  async createOwnership(ownership: InsertOwnership): Promise<NftOwnership> {
    const [newOwnership] = await db.insert(nftOwnerships).values(ownership).returning();
    return newOwnership;
  }

  async getOwnershipsForUser(userId: number): Promise<NftOwnership[]> {
    return await db.select().from(nftOwnerships).where(eq(nftOwnerships.ownerId, userId));
  }

  async getOwnershipsForNft(nftId: number): Promise<NftOwnership[]> {
    return await db.select().from(nftOwnerships).where(eq(nftOwnerships.nftId, nftId));
  }

  async transferOwnership(nftId: number, fromUserId: number, toUserId: number, editionNumber: number): Promise<void> {
    // Update ownership record
    await db.update(nftOwnerships)
      .set({ ownerId: toUserId })
      .where(and(
        eq(nftOwnerships.nftId, nftId),
        eq(nftOwnerships.ownerId, fromUserId),
        eq(nftOwnerships.editionNumber, editionNumber)
      ));
  }

  // Enhanced NFT operations
  async getNftWithDetails(nftId: number): Promise<Nft & {
    listings?: Listing[];
    bids?: Bid[];
    ownerships?: NftOwnership[];
    highestBid?: number;
    lowestListing?: number;
    isMintedOut?: boolean;
  }> {
    const nft = await this.getNft(nftId);
    if (!nft) throw new Error("NFT not found");

    const [nftListings, nftBids, nftOwnerships] = await Promise.all([
      this.getListingsForNft(nftId),
      this.getBidsForNft(nftId),
      this.getOwnershipsForNft(nftId)
    ]);

    const highestBid = nftBids.length > 0 ? Math.max(...nftBids.map(b => b.amount)) : 0;
    const lowestListing = nftListings.length > 0 ? Math.min(...nftListings.map(l => l.price)) : 0;
    const isMintedOut = nft.currentEdition >= nft.editionSize;

    return {
      ...nft,
      listings: nftListings,
      bids: nftBids,
      ownerships: nftOwnerships,
      highestBid,
      lowestListing,
      isMintedOut
    };
  }

  // Password Reset operations
  async createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [newToken] = await db.insert(passwordResetTokens).values({
      email,
      token,
      expiresAt,
    }).returning();
    return newToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db.select().from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false)
      ));
    return resetToken || undefined;
  }

  async markTokenAsUsed(tokenId: number): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenId));
  }

  async updateUserPassword(email: string, newPassword: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ password: newPassword })
      .where(eq(users.email, email))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
