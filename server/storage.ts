import { 
  users, nfts, transactions, zkProofs,
  type User, type InsertUser, 
  type Nft, type InsertNft,
  type Transaction, type InsertTransaction,
  type ZkProof
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  private currentUserId: number;
  private currentNftId: number;
  private currentTransactionId: number;
  private currentProofId: number;

  constructor() {
    this.users = new Map();
    this.nfts = new Map();
    this.transactions = new Map();
    this.zkProofs = new Map();
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
      price: 80,
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
      price: 45,
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
      price: 25,
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
      price: 120,
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
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

export const storage = new MemStorage();
