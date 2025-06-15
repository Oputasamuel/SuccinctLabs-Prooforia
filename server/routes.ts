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

  // Upload and mint NFT
  app.post("/api/nfts/mint", upload.single("image"), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const nftData = insertNftSchema.parse(req.body);
      
      // Mock creator ID (in real app, get from authenticated user)
      const creatorId = 1;
      
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
          { trait_type: "Creator", value: "Artist" },
        ],
      };
      
      // Upload metadata to IPFS
      const metadataUpload = await ipfsService.uploadJSON(metadata);
      
      // Generate ZK proof using SP1
      const zkProof = await sp1Service.generateMintProof({
        creatorId,
        title: nftData.title,
        price: nftData.price,
        editionSize: nftData.editionSize,
      });
      
      // Create NFT record
      const nft = await storage.createNft({
        ...nftData,
        creatorId,
        imageUrl: imageUpload.url,
        metadataUrl: metadataUpload.url,
        zkProofHash: zkProof.proofHash,
        ipfsHash: imageUpload.hash,
        currentEdition: 1,
      });
      
      // Store ZK proof
      await storage.createZkProof({
        userId: creatorId,
        proofType: "mint",
        proofData: zkProof.proofData,
        proofHash: zkProof.proofHash,
      });
      
      const creator = await storage.getUser(creatorId);
      res.json({
        ...nft,
        creator: creator ? { id: creator.id, username: creator.username } : null,
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
