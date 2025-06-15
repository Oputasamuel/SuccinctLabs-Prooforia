import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertNftSchema } from "@shared/schema";
import { sp1Service } from "./services/sp1-service";
import { ipfsService } from "./services/ipfs-service";
import { succinctService } from "./services/succinct-service";
import { setupAuth } from "./auth";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // NFT Routes
  app.get("/api/nfts", async (req, res) => {
    try {
      const { category, creatorId, isListed } = req.query;
      
      const filters: any = {};
      if (category) filters.category = category as string;
      if (creatorId) filters.creatorId = parseInt(creatorId as string);
      if (isListed !== undefined) filters.isListed = isListed === 'true';

      const nfts = await storage.getNfts(filters);
      
      // Get creators for each NFT
      const nftsWithCreators = await Promise.all(
        nfts.map(async (nft) => {
          const creator = await storage.getUser(nft.creatorId);
          return {
            ...nft,
            creator: creator ? { id: creator.id, username: creator.username } : null
          };
        })
      );

      res.json(nftsWithCreators);
    } catch (error) {
      console.error("Get NFTs error:", error);
      res.status(500).json({ message: "Failed to fetch NFTs" });
    }
  });

  app.get("/api/nfts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const nft = await storage.getNft(id);
      
      if (!nft) {
        return res.status(404).json({ message: "NFT not found" });
      }

      // Get creator info
      const creator = await storage.getUser(nft.creatorId);
      const nftWithCreator = {
        ...nft,
        creator: creator ? { id: creator.id, username: creator.username } : null
      };

      res.json(nftWithCreator);
    } catch (error) {
      console.error("Get NFT error:", error);
      res.status(500).json({ message: "Failed to fetch NFT" });
    }
  });

  // NFT Minting Route
  app.post("/api/nfts/mint", upload.single("image"), async (req: MulterRequest, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const { title, description, price, editionSize, category } = req.body;

      // Debug logging to see what we're receiving
      console.log('Received form data:', { title, description, price, editionSize, category });

      // Validate required fields first
      if (!title || !price) {
        return res.status(400).json({ 
          message: "Title and price are required fields" 
        });
      }

      // Validate request body with proper type conversion
      const parsedPrice = parseFloat(price);
      const parsedEditionSize = parseInt(editionSize);

      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ 
          message: "Price must be a valid positive number" 
        });
      }

      if (isNaN(parsedEditionSize) || parsedEditionSize <= 0) {
        return res.status(400).json({ 
          message: "Edition size must be a valid positive number" 
        });
      }

      const nftData = {
        title: title.trim(),
        description: description || '',
        price: parsedPrice,
        editionSize: parsedEditionSize,
        category: category || 'Digital Art',
      };

      // Check if user has enough credits
      const user = req.user;
      const requiredCredits = 5; // Cost to mint an NFT
      
      if (!user.credits || user.credits < requiredCredits) {
        return res.status(400).json({ 
          message: `Insufficient credits. You need ${requiredCredits} credits to mint an NFT.` 
        });
      }

      // Upload image to IPFS
      const imageUpload = await ipfsService.uploadFile(req.file.buffer, req.file.originalname);
      
      // Create metadata
      const metadata = {
        name: nftData.title,
        description: nftData.description,
        image: imageUpload.url,
        attributes: [
          { trait_type: "Category", value: nftData.category },
          { trait_type: "Edition Size", value: nftData.editionSize },
          { trait_type: "Creator", value: user.username }
        ]
      };

      // Upload metadata to IPFS
      const metadataUpload = await ipfsService.uploadJSON(metadata);

      // Generate ZK proof for minting
      const zkProof = await sp1Service.generateMintProof({
        creatorId: user.id,
        title: nftData.title,
        price: nftData.price,
        editionSize: nftData.editionSize,
        walletAddress: user.walletAddress,
        creditsBalance: user.credits || 0,
        timestamp: Date.now(),
      });

      // Create NFT with ZK proof
      const newNft = await storage.createNft({
        ...nftData,
        creatorId: user.id,
        imageUrl: imageUpload.url,
        metadataUrl: metadataUpload.url,
        zkProofHash: zkProof.proofHash,
        ipfsHash: imageUpload.hash,
        currentEdition: 1,
        isListed: true,
      });

      // Store ZK proof
      await storage.createZkProof({
        userId: user.id,
        proofType: "mint",
        proofData: zkProof.proofData,
        proofHash: zkProof.proofHash,
      });

      // Deduct credits from user
      await storage.updateUserCredits(user.id, user.credits - requiredCredits);

      res.status(201).json({
        nft: newNft,
        message: `NFT minted successfully! ${requiredCredits} credits deducted.`
      });
    } catch (error) {
      console.error("NFT minting error:", error);
      res.status(500).json({ message: "Failed to mint NFT" });
    }
  });

  // NFT Purchase/Buy Route
  app.post("/api/nfts/:id/buy", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const nftId = parseInt(req.params.id);
      const buyerId = req.user.id;

      const nft = await storage.getNft(nftId);
      if (!nft) {
        return res.status(404).json({ message: "NFT not found" });
      }

      if (!nft.isListed) {
        return res.status(400).json({ message: "NFT is not for sale" });
      }

      if (nft.creatorId === buyerId) {
        return res.status(400).json({ message: "Cannot buy your own NFT" });
      }

      // Check if buyer has enough credits
      const buyer = req.user;
      const requiredCredits = nft.price;
      
      if (!buyer.credits || buyer.credits < requiredCredits) {
        return res.status(400).json({ 
          message: `Insufficient credits. You need ${requiredCredits} credits to purchase this NFT.` 
        });
      }

      // Get seller wallet info
      const sellerUser = await storage.getUser(nft.creatorId);
      if (!sellerUser) {
        return res.status(404).json({ message: "Seller not found" });
      }

      // Generate ZK proof for transfer
      const zkProof = await sp1Service.generateTransferProof({
        nftId: nft.id,
        sellerId: nft.creatorId,
        buyerId: buyerId,
        price: nft.price,
        sellerWallet: sellerUser.walletAddress,
        buyerWallet: buyer.walletAddress,
        timestamp: Date.now(),
      });

      // Create transaction record
      const transaction = await storage.createTransaction({
        nftId: nft.id,
        sellerId: nft.creatorId,
        buyerId: buyerId,
        price: nft.price,
        zkProofHash: zkProof.proofHash,
        transactionHash: `0x${Date.now().toString(16)}`,
      });

      // Update NFT ownership (mark as sold)
      await storage.updateNft(nft.id, {
        isListed: false,
        currentEdition: nft.currentEdition + 1,
      });

      // Update buyer credits
      await storage.updateUserCredits(buyerId, buyer.credits - requiredCredits);

      // Update seller credits (they receive the payment)
      const sellerForUpdate = await storage.getUser(nft.creatorId);
      if (sellerForUpdate && sellerForUpdate.credits !== null) {
        await storage.updateUserCredits(nft.creatorId, sellerForUpdate.credits + requiredCredits);
      }

      // Store ZK proof
      await storage.createZkProof({
        userId: buyerId,
        proofType: "transfer",
        proofData: zkProof.proofData,
        proofHash: zkProof.proofHash,
      });

      res.json({
        transaction,
        message: `NFT purchased successfully! ${requiredCredits} credits transferred.`
      });
    } catch (error) {
      console.error("NFT purchase error:", error);
      res.status(500).json({ message: "Failed to purchase NFT" });
    }
  });

  // Transaction Routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const { userId } = req.query;
      const transactions = await storage.getTransactions(
        userId ? parseInt(userId as string) : undefined
      );
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // ZK Proof Routes
  app.get("/api/zkproofs/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const proofs = await storage.getZkProofs(userId);
      res.json(proofs);
    } catch (error) {
      console.error("Get ZK proofs error:", error);
      res.status(500).json({ message: "Failed to fetch ZK proofs" });
    }
  });

  // Favorites Routes
  app.post("/api/nfts/:id/favorite", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const nftId = parseInt(req.params.id);
      const userId = req.user.id;
      const { action } = req.body;

      if (action === 'add') {
        await storage.addFavorite(userId, nftId);
        res.json({ message: "Added to favorites" });
      } else if (action === 'remove') {
        await storage.removeFavorite(userId, nftId);
        res.json({ message: "Removed from favorites" });
      } else {
        res.status(400).json({ message: "Invalid action" });
      }
    } catch (error) {
      console.error("Favorite action error:", error);
      res.status(500).json({ message: "Failed to update favorite" });
    }
  });

  // Profile Route - Enhanced with favorited NFTs
  app.get("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const userId = req.user.id;

      // Get created NFTs
      const createdNfts = await storage.getNfts({ creatorId: userId });
      
      // Get purchased NFTs (from transactions)
      const transactions = await storage.getTransactions(userId);
      const purchasedNftIds = transactions
        .filter(tx => tx.buyerId === userId)
        .map(tx => tx.nftId);
      
      const purchasedNfts = [];
      for (const nftId of purchasedNftIds) {
        const nft = await storage.getNft(nftId);
        if (nft) purchasedNfts.push(nft);
      }

      // Get favorited NFTs
      const favoritedNfts = await storage.getFavorites(userId);

      // Calculate stats
      const totalEarned = transactions
        .filter(tx => tx.sellerId === userId)
        .reduce((sum, tx) => sum + tx.price, 0);
      
      const totalSpent = transactions
        .filter(tx => tx.buyerId === userId)
        .reduce((sum, tx) => sum + tx.price, 0);

      res.json({
        createdNfts,
        purchasedNfts,
        favoritedNfts,
        transactions,
        zkProofs: await storage.getZkProofs(userId),
        stats: {
          totalCreated: createdNfts.length,
          totalPurchased: purchasedNfts.length,
          totalSpent,
          totalEarned,
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Stats Route
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Succinct Proofs Routes
  app.get("/api/proofs", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const proofsData = await succinctService.getProofs(page, limit);
      res.json(proofsData);
    } catch (error) {
      console.error("Get proofs error:", error);
      res.status(500).json({ message: "Failed to fetch proofs" });
    }
  });

  app.get("/api/proofs/:id", async (req, res) => {
    try {
      const proof = await succinctService.getProofById(req.params.id);
      if (!proof) {
        return res.status(404).json({ message: "Proof not found" });
      }
      res.json(proof);
    } catch (error) {
      console.error("Get proof by ID error:", error);
      res.status(500).json({ message: "Failed to fetch proof" });
    }
  });

  // User Profile Route
  app.get("/api/profile", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = req.user.id;

      // Get user's created NFTs
      const createdNfts = await storage.getNfts({ creatorId: userId });

      // Get user's purchased NFTs (from transactions)
      const userTransactions = await storage.getTransactions(userId);
      const purchasedNftIds = userTransactions
        .filter(t => t.buyerId === userId)
        .map(t => t.nftId);
      
      const purchasedNfts = [];
      for (const nftId of purchasedNftIds) {
        const nft = await storage.getNft(nftId);
        if (nft) {
          const creator = await storage.getUser(nft.creatorId);
          purchasedNfts.push({
            ...nft,
            creator: creator ? { id: creator.id, username: creator.username } : null
          });
        }
      }

      // Calculate stats
      const totalSpent = userTransactions
        .filter(t => t.buyerId === userId)
        .reduce((sum, t) => sum + t.price, 0);
      
      const totalEarned = userTransactions
        .filter(t => t.sellerId === userId)
        .reduce((sum, t) => sum + t.price, 0);

      const profile = {
        createdNfts: createdNfts.map(nft => ({
          ...nft,
          creator: { id: req.user.id, username: req.user.username }
        })),
        purchasedNfts,
        transactions: userTransactions,
        zkProofs: await storage.getZkProofs(userId),
        stats: {
          totalCreated: createdNfts.length,
          totalPurchased: purchasedNfts.length,
          totalSpent,
          totalEarned
        }
      };

      res.json(profile);
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}