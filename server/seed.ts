import { db } from "./db";
import { users, nfts, zkProofs } from "@shared/schema";

export async function seedDatabase() {
  try {
    // Check if data already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database with initial data...");

    // Import wallet service for generating wallets
    const { walletService } = await import("./services/wallet-service");
    
    // Generate wallets for sample users
    const wallet1 = walletService.generateWallet();
    const wallet2 = walletService.generateWallet();
    const wallet3 = walletService.generateWallet();

    // Create sample users with email/password authentication
    const [artist1] = await db.insert(users).values({
      username: "ArtistCRN",
      email: "artist@example.com",
      password: "password123",
      walletAddress: wallet1.address,
      walletPrivateKey: walletService.encryptPrivateKey(wallet1.privateKey),
      walletPublicKey: wallet1.publicKey,
      credits: 25,
      discordConnected: true,
      discordUsername: "ArtistCRN#1234",
      xConnected: false,
    }).returning();

    const [artist2] = await db.insert(users).values({
      username: "Artist234", 
      email: "digital@example.com",
      password: "password123",
      walletAddress: wallet2.address,
      walletPrivateKey: walletService.encryptPrivateKey(wallet2.privateKey),
      walletPublicKey: wallet2.publicKey,
      credits: 20,
      discordConnected: false,
      xConnected: true,
      xUsername: "@DigitalArtist",
    }).returning();

    const [artist3] = await db.insert(users).values({
      username: "ZKArtist",
      email: "creator@example.com",
      password: "password123",
      walletAddress: wallet3.address,
      walletPrivateKey: walletService.encryptPrivateKey(wallet3.privateKey),
      walletPublicKey: wallet3.publicKey,
      credits: 30,
      discordConnected: true,
      discordUsername: "ZKArtist#5678",
      xConnected: true,
      xUsername: "@ZKArtist",
    }).returning();

    // Create demo account from replit.md
    const demoWallet = walletService.generateWallet();
    const authModule = await import("./auth");
    const [demoUser] = await db.insert(users).values({
      username: "sam",
      email: "zedef0808@gmail.com",
      password: await authModule.hashPassword("1234"),
      walletAddress: demoWallet.address,
      walletPrivateKey: walletService.encryptPrivateKey(demoWallet.privateKey),
      walletPublicKey: demoWallet.publicKey,
      credits: 25,
      discordConnected: false,
      xConnected: false,
    }).returning();

    // Create sample NFTs
    const nftData = [
      {
        title: "SP1 Circuit Dreams",
        description: "A vibrant digital abstract art piece showcasing the beauty of zero-knowledge circuits",
        creatorId: artist1.id,
        price: 1,
        editionSize: 10,
        currentEdition: 1,
        category: "Digital Art",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
        metadataUrl: "ipfs://QmExample1",
        zkProofHash: "0xzkproof1234",
        ipfsHash: "QmExample1",
        isVerified: true,
        isListed: true,
      },
      {
        title: "Cryptographic Mandala",
        description: "Sacred geometry meets cryptography in this unique mandala design",
        creatorId: artist2.id,
        price: 1,
        editionSize: 1,
        currentEdition: 1,
        category: "Digital Art",
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
        metadataUrl: "ipfs://QmExample2",
        zkProofHash: "0xzkproof5678",
        ipfsHash: "QmExample2",
        isVerified: true,
        isListed: true,
      },
      {
        title: "Succinct Genesis #1",
        description: "The first in a series celebrating the future of zero-knowledge proofs",
        creatorId: artist3.id,
        price: 2,
        editionSize: 5,
        currentEdition: 3,
        category: "Generative Art",
        imageUrl: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
        metadataUrl: "ipfs://QmExample3",
        zkProofHash: "0xzkproof9012",
        ipfsHash: "QmExample3",
        isVerified: true,
        isListed: true,
      },
      {
        title: "ZK Abstracts",
        description: "Modern minimalist composition exploring the aesthetics of zero-knowledge",
        creatorId: artist1.id,
        price: 1,
        editionSize: 1,
        currentEdition: 1,
        category: "Abstract",
        imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800",
        metadataUrl: "ipfs://QmExample4",
        zkProofHash: "0xzkproof3456",
        ipfsHash: "QmExample4",
        isVerified: true,
        isListed: true,
      }
    ];

    await db.insert(nfts).values(nftData);

    // Create sample ZK proofs
    const proofData = [
      {
        userId: artist1.id,
        proofType: "mint",
        proofData: { operation: "mint", timestamp: Date.now() },
        proofHash: "0xzkproof1234",
        isValid: true,
      },
      {
        userId: artist2.id,
        proofType: "mint", 
        proofData: { operation: "mint", timestamp: Date.now() },
        proofHash: "0xzkproof5678",
        isValid: true,
      },
      {
        userId: artist3.id,
        proofType: "mint",
        proofData: { operation: "mint", timestamp: Date.now() },
        proofHash: "0xzkproof9012", 
        isValid: true,
      },
      {
        userId: artist1.id,
        proofType: "mint",
        proofData: { operation: "mint", timestamp: Date.now() },
        proofHash: "0xzkproof3456",
        isValid: true,
      }
    ];

    await db.insert(zkProofs).values(proofData);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}