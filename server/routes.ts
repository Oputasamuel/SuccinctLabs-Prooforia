import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}
import { storage } from "./storage";
import { insertNftSchema } from "@shared/schema";
import { sp1Service } from "./services/sp1-service";
import { ipfsService } from "./services/ipfs-service";
import { discordService } from "./services/discord-service";
import { walletService } from "./services/wallet-service";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Discord Authentication Routes
  app.get("/api/auth/discord", (req, res) => {
    const authUrl = discordService.getAuthUrl();
    res.redirect(authUrl);
  });

  app.get("/api/auth/discord/callback", async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: "Missing authorization code" });
      }

      // Exchange code for access token
      const tokenData = await discordService.exchangeCodeForToken(code);
      
      // Get user info from Discord
      const discordUser = await discordService.getUserInfo(tokenData.access_token);
      
      // Check if user already exists
      let user = await storage.getUserByDiscordId(discordUser.id);
      
      if (!user) {
        // Generate new wallet for the user
        const wallet = walletService.generateWallet();
        const encryptedPrivateKey = walletService.encryptPrivateKey(wallet.privateKey);
        
        // Create new user with Discord info and wallet
        user = await storage.createDiscordUser({
          username: discordUser.username,
          discordId: discordUser.id,
          discordUsername: discordUser.username,
          discordAvatar: discordUser.avatar || null,
          walletAddress: wallet.address,
          walletPrivateKey: encryptedPrivateKey,
          walletPublicKey: wallet.publicKey,
        });
        
        // Delegate initial credits to the new wallet
        await walletService.delegateCredits(wallet.address, 10);
      }
      
      // In production, set up proper session management
      // For now, redirect to frontend with user info
      res.redirect(`/?auth=success&userId=${user.id}`);
      
    } catch (error) {
      console.error("Discord auth callback error:", error);
      res.redirect("/?auth=error");
    }
  });

  app.get("/api/auth/user/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't expose sensitive wallet info
      const publicUser = {
        id: user.id,
        username: user.username,
        discordUsername: user.discordUsername,
        discordAvatar: user.discordAvatar,
        walletAddress: user.walletAddress,
        testTokenBalance: user.testTokenBalance,
        delegatedCredits: user.delegatedCredits,
      };
      
      res.json(publicUser);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  // Get all NFTs with optional filtering
  app.get("/api/nfts", async (req, res) => {
    try {
      const { category, creator, listed } = req.query;
      const filters: any = {};
      
      if (category) filters.category = category as string;
      if (creator) filters.creatorId = parseInt(creator as string);
      if (listed !== undefined) filters.isListed = listed === 'true';
      
      const nfts = await storage.getNfts(filters);
      
      // Get creator info for each NFT
      const nftsWithCreators = await Promise.all(
        nfts.map(async (nft) => {
          const creator = await storage.getUser(nft.creatorId);
          return {
            ...nft,
            creator: creator ? { id: creator.id, username: creator.username } : null,
          };
        })
      );
      
      res.json(nftsWithCreators);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch NFTs" });
    }
  });

  // Get single NFT
  app.get("/api/nfts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const nft = await storage.getNft(id);
      
      if (!nft) {
        return res.status(404).json({ message: "NFT not found" });
      }
      
      const creator = await storage.getUser(nft.creatorId);
      res.json({
        ...nft,
        creator: creator ? { id: creator.id, username: creator.username } : null,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch NFT" });
    }
  });

  // Upload and mint NFT with SP1 proof and wallet integration
  app.post("/api/nfts/mint", upload.single("image"), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const nftData = insertNftSchema.parse(req.body);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User authentication required" });
      }
      
      // Get user and verify they have sufficient credits and tokens
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.delegatedCredits || user.delegatedCredits < 1) {
        return res.status(400).json({ message: "Insufficient SP1 credits for minting" });
      }
      
      if (!user.testTokenBalance || user.testTokenBalance < nftData.price) {
        return res.status(400).json({ message: "Insufficient test tokens for minting" });
      }
      
      const creatorId = user.id;
      
      // Upload image to IPFS
      const imageUpload = await ipfsService.uploadFile(req.file.buffer, req.file.originalname);
      
      // Create metadata
      const metadata = {
        name: nftData.title,
        description: nftData.description,
        image: imageUpload.url,
        attributes: [
          { trait_type: "Edition Size", value: nftData.editionSize },
          { trait_type: "Category", value: nftData.category },
          { trait_type: "Creator", value: user.discordUsername || user.username },
          { trait_type: "Wallet", value: user.walletAddress },
        ],
      };
      
      // Upload metadata to IPFS
      const metadataUpload = await ipfsService.uploadJSON(metadata);
      
      // Decrypt user's private key for blockchain interaction
      const privateKey = walletService.decryptPrivateKey(user.walletPrivateKey!);
      
      // Generate SP1 proof for minting with wallet integration
      const mintResult = await walletService.mintNFTWithProof(
        user.walletAddress!,
        privateKey,
        {
          title: nftData.title,
          description: nftData.description,
          price: nftData.price,
          editionSize: nftData.editionSize,
          category: nftData.category,
          metadataUrl: metadataUpload.url,
          imageUrl: imageUpload.url,
        }
      );
      
      // Create NFT record with blockchain transaction
      const nft = await storage.createNft({
        ...nftData,
        creatorId,
        imageUrl: imageUpload.url,
        metadataUrl: metadataUpload.url,
        zkProofHash: mintResult.proofHash,
        ipfsHash: imageUpload.hash,
        currentEdition: 1,
      });
      
      // Store ZK proof with transaction details
      await storage.createZkProof({
        userId: creatorId,
        proofType: "mint",
        proofData: {
          transactionHash: mintResult.transactionHash,
          walletAddress: user.walletAddress,
          nftData: metadata,
          verificationTime: new Date().toISOString(),
        },
        proofHash: mintResult.proofHash,
      });
      
      // Update user's credits and token balance
      await storage.updateUserCredits(creatorId, user.delegatedCredits! - 1);
      await storage.updateUserTokenBalance(creatorId, user.testTokenBalance! - 10);
      
      const creator = await storage.getUser(creatorId);
      res.json({
        ...nft,
        creator: creator ? { 
          id: creator.id, 
          username: creator.username,
          discordUsername: creator.discordUsername,
          walletAddress: creator.walletAddress 
        } : null,
        transactionHash: mintResult.transactionHash,
        proofHash: mintResult.proofHash,
        remainingCredits: user.delegatedCredits! - 1,
        remainingTokens: user.testTokenBalance! - 10,
      });
    } catch (error: any) {
      console.error("Mint error:", error);
      res.status(500).json({ message: error.message || "Failed to mint NFT" });
    }
  });

  // Buy NFT
  app.post("/api/nfts/:id/buy", async (req, res) => {
    try {
      const nftId = parseInt(req.params.id);
      const { buyerId } = req.body;
      
      const nft = await storage.getNft(nftId);
      if (!nft) {
        return res.status(404).json({ message: "NFT not found" });
      }
      
      if (!nft.isListed) {
        return res.status(400).json({ message: "NFT is not for sale" });
      }
      
      // Generate ZK proof for purchase
      const zkProof = await sp1Service.generateTransferProof({
        nftId,
        sellerId: nft.creatorId,
        buyerId,
        price: nft.price,
      });
      
      // Create transaction
      const transaction = await storage.createTransaction({
        nftId,
        buyerId,
        sellerId: nft.creatorId,
        price: nft.price,
        zkProofHash: zkProof.proofHash,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      });
      
      // Store ZK proof
      await storage.createZkProof({
        userId: buyerId,
        proofType: "transfer",
        proofData: zkProof.proofData,
        proofHash: zkProof.proofHash,
      });
      
      // Update NFT ownership and listing status
      await storage.updateNft(nftId, {
        isListed: false,
        creatorId: buyerId, // Transfer ownership
      });
      
      res.json(transaction);
    } catch (error: any) {
      console.error("Purchase error:", error);
      res.status(500).json({ message: error.message || "Failed to purchase NFT" });
    }
  });

  // Get marketplace stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get user's ZK proofs
  app.get("/api/users/:id/proofs", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const proofs = await storage.getZkProofs(userId);
      res.json(proofs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch proofs" });
    }
  });

  // Get transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const { userId } = req.query;
      const transactions = await storage.getTransactions(
        userId ? parseInt(userId as string) : undefined
      );
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
