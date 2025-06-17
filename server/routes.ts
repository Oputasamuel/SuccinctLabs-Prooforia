import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import express from "express";
import path from "path";
import { storage } from "./storage";
import { insertNftSchema, insertBidSchema, insertListingSchema } from "@shared/schema";
import { sp1Service } from "./services/sp1-service";
import { ipfsService } from "./services/ipfs-service";
import { succinctService } from "./services/succinct-service";
import { setupWalletAuth } from "./wallet-auth";
import { setupAuth, hashPassword } from "./auth";
import { discordService } from "./services/discord-service";
import { walletService } from "./services/wallet-service";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication - main auth handles session config
  setupAuth(app);
  setupWalletAuth(app);

  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Discord connection route - simplified for demo
  app.post("/api/auth/discord/connect", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { username } = req.body;
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: "Discord username is required" });
      }

      // Simple username validation for Discord
      const cleanUsername = username.trim();
      if (!/^[a-zA-Z0-9._]{2,32}$/.test(cleanUsername)) {
        return res.status(400).json({ message: "Invalid Discord username format" });
      }

      await storage.connectDiscord(user.id, cleanUsername);
      
      const updatedUser = await storage.getUser(user.id);
      res.json({ user: updatedUser });
    } catch (error) {
      console.error("Discord connection error:", error);
      res.status(500).json({ message: "Failed to connect Discord account" });
    }
  });

  // X (Twitter) connection route
  app.post("/api/auth/x/connect", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { username } = req.body;
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: "X username is required" });
      }

      // Simple username validation for X
      const cleanUsername = username.replace('@', '').trim();
      if (!/^[a-zA-Z0-9_]{1,15}$/.test(cleanUsername)) {
        return res.status(400).json({ message: "Invalid X username format" });
      }

      await storage.connectX(user.id, cleanUsername);
      
      const updatedUser = await storage.getUser(user.id);
      res.json({ user: updatedUser });
    } catch (error) {
      console.error("X connection error:", error);
      res.status(500).json({ message: "Failed to connect X account" });
    }
  });

  // Password Reset Routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "If the email exists, a reset code has been sent" });
      }

      // Generate 6-digit code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set expiration to 15 minutes from now
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      
      // Store the reset token
      await storage.createPasswordResetToken(email, resetCode, expiresAt);
      
      // Send email with reset code
      const { emailService } = await import("./services/email-service");
      const emailSent = await emailService.sendPasswordResetCode(email, resetCode);
      
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send reset email" });
      }

      res.json({ message: "If the email exists, a reset code has been sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/verify-reset-code", async (req, res) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ message: "Email and code are required" });
      }

      // Get the reset token
      const resetToken = await storage.getPasswordResetToken(code);
      
      if (!resetToken || resetToken.email !== email) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }

      // Check if token is expired
      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Reset code has expired" });
      }

      res.json({ message: "Reset code verified successfully", valid: true });
    } catch (error) {
      console.error("Verify reset code error:", error);
      res.status(500).json({ message: "Failed to verify reset code" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      
      if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Email, code, and new password are required" });
      }

      if (newPassword.length < 4) {
        return res.status(400).json({ message: "Password must be at least 4 characters long" });
      }

      // Get and validate the reset token
      const resetToken = await storage.getPasswordResetToken(code);
      
      if (!resetToken || resetToken.email !== email) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }

      // Check if token is expired
      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Reset code has expired" });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password
      await storage.updateUserPassword(email, hashedPassword);
      
      // Mark the token as used
      await storage.markTokenAsUsed(resetToken.id);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Wallet Recovery Route
  app.post("/api/auth/wallet-recovery", async (req, res) => {
    try {
      const { email, privateKey, newPassword } = req.body;
      
      if (!email || !privateKey || !newPassword) {
        return res.status(400).json({ message: "Email, private key, and new password are required" });
      }

      if (newPassword.length < 4) {
        return res.status(400).json({ message: "Password must be at least 4 characters long" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "No account found with this email address" });
      }

      // Clean the private key input (remove 0x prefix if present)
      const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
      
      // Decrypt the stored private key and compare
      try {
        console.log('Attempting to decrypt private key for user:', user.email);
        const decryptedPrivateKey = walletService.decryptPrivateKey(user.walletPrivateKey);
        console.log('Successfully decrypted private key');
        
        const storedCleanKey = decryptedPrivateKey.startsWith('0x') ? 
          decryptedPrivateKey.slice(2) : decryptedPrivateKey;

        console.log('Comparing keys - Input:', cleanPrivateKey.substring(0, 10) + '...', 
                   'Stored:', storedCleanKey.substring(0, 10) + '...');

        if (cleanPrivateKey.toLowerCase() !== storedCleanKey.toLowerCase()) {
          return res.status(400).json({ message: "Private key does not match this account" });
        }
        
        console.log('Private key verification successful');
      } catch (error) {
        console.error("Private key decryption error:", error);
        return res.status(500).json({ message: "Failed to verify private key" });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password
      await storage.updateUserPassword(email, hashedPassword);

      res.json({ message: "Account recovered successfully" });
    } catch (error) {
      console.error("Wallet recovery error:", error);
      res.status(500).json({ message: "Failed to recover account" });
    }
  });

  // Temporary debug endpoint to get decrypted private key for testing
  app.get("/api/debug/private-key/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const decryptedKey = walletService.decryptPrivateKey(user.walletPrivateKey);
      
      res.json({ 
        email: user.email,
        walletAddress: user.walletAddress,
        privateKey: decryptedKey 
      });
    } catch (error) {
      console.error("Debug endpoint error:", error);
      res.status(500).json({ message: "Failed to decrypt private key" });
    }
  });

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
            creator: creator ? { id: creator.id, username: creator.displayName } : null
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
        creator: creator ? { id: creator.id, username: creator.displayName } : null
      };

      res.json(nftWithCreator);
    } catch (error) {
      console.error("Get NFT error:", error);
      res.status(500).json({ message: "Failed to fetch NFT" });
    }
  });

  // Get detailed NFT data with listings, bids, and ownership
  app.get("/api/nfts/:id/details", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const nftWithDetails = await storage.getNftWithDetails(id);
      
      // Get creator info
      const creator = await storage.getUser(nftWithDetails.creatorId);
      const response = {
        ...nftWithDetails,
        creator: creator ? { id: creator.id, username: creator.displayName } : null
      };

      res.json(response);
    } catch (error) {
      console.error("Get NFT details error:", error);
      if (error.message === "NFT not found") {
        return res.status(404).json({ message: "NFT not found" });
      }
      res.status(500).json({ message: "Failed to fetch NFT details" });
    }
  });

  // NFT Minting Route
  app.post("/api/nfts/mint", upload.single("image"), async (req: MulterRequest, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
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
      const user = currentUser;
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
          { trait_type: "Creator", value: currentUser.displayName }
        ]
      };

      // Upload metadata to IPFS
      const metadataUpload = await ipfsService.uploadJSON(metadata);

      // Generate ZK proof for minting
      const zkProof = await sp1Service.generateMintProof({
        creatorId: currentUser.id,
        title: nftData.title,
        price: nftData.price,
        editionSize: nftData.editionSize,
        walletAddress: currentUser.walletAddress,
        creditsBalance: currentUser.credits || 0,
        timestamp: Date.now(),
      });

      // Create NFT with ZK proof
      const newNft = await storage.createNft({
        ...nftData,
        creatorId: currentUser.id,
        imageUrl: imageUpload.url,
        metadataUrl: metadataUpload.url,
        zkProofHash: zkProof.proofHash,
        ipfsHash: imageUpload.hash,
        currentEdition: 1,
        isListed: true,
      });

      // Store ZK proof
      await storage.createZkProof({
        userId: currentUser.id,
        proofType: "mint",
        proofData: zkProof.proofData,
        proofHash: zkProof.proofHash,
      });

      // Deduct credits from user
      await storage.updateUserCredits(currentUser.id, (currentUser.credits || 0) - requiredCredits);

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
      if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const nftId = parseInt(req.params.id);
      const buyerId = user.id;

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
      const buyer = user;
      const requiredCredits = nft.price;
      
      if (!buyer || !buyer.credits || buyer.credits < requiredCredits) {
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

      // Ensure session remains valid after purchase
      req.session.save((err) => {
        if (err) {
          console.error('Session save error after purchase:', err);
        }
      });

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

  // Enhanced NFT Details Route
  app.get("/api/nfts/:id/details", async (req, res) => {
    try {
      const nftId = parseInt(req.params.id);
      const nftDetails = await storage.getNftWithDetails(nftId);
      res.json(nftDetails);
    } catch (error) {
      console.error("Get NFT details error:", error);
      res.status(500).json({ message: "Failed to fetch NFT details" });
    }
  });

  // Listings Routes
  app.get("/api/listings", async (req, res) => {
    try {
      const listings = await storage.getAllListings();
      res.json(listings);
    } catch (error) {
      console.error("Get listings error:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.post("/api/listings", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { nftId, price } = req.body;
      
      if (!nftId || !price || price <= 0) {
        return res.status(400).json({ message: "Valid NFT ID and price required" });
      }

      // Check if user owns the NFT
      const nft = await storage.getNft(nftId);
      if (!nft) {
        return res.status(404).json({ message: "NFT not found" });
      }

      // Check ownership via NFT creator or ownership records
      const ownerships = await storage.getOwnershipsForNft(nftId);
      const userOwnsNft = nft.creatorId === req.user.id || 
                         ownerships.some(o => o.ownerId === req.user.id);

      if (!userOwnsNft) {
        return res.status(403).json({ message: "You don't own this NFT" });
      }

      const listing = await storage.createListing({
        nftId,
        sellerId: req.user.id,
        price
      });

      res.json(listing);
    } catch (error) {
      console.error("Create listing error:", error);
      res.status(500).json({ message: "Failed to create listing" });
    }
  });

  app.post("/api/listings/:id/buy", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const listingId = parseInt(req.params.id);
      const buyerId = req.user.id;

      const transaction = await storage.buyFromListing(listingId, buyerId);
      res.json(transaction);
    } catch (error) {
      console.error("Buy from listing error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to complete purchase" 
      });
    }
  });

  app.delete("/api/listings/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const listingId = parseInt(req.params.id);
      await storage.deactivateListing(listingId);
      res.json({ message: "Listing removed" });
    } catch (error) {
      console.error("Remove listing error:", error);
      res.status(500).json({ message: "Failed to remove listing" });
    }
  });

  // Bidding Routes
  app.post("/api/bids", async (req, res) => {
    // Support both session-based and passport authentication
    const userId = req.session.userId || (req.isAuthenticated() && req.user?.id);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    try {
      const validatedData = insertBidSchema.parse(req.body);
      
      // Check if user has enough credits
      if ((user.credits || 0) < validatedData.amount) {
        return res.status(400).json({ message: "Insufficient credits" });
      }
      
      const bid = await storage.createBid({
        nftId: validatedData.nftId,
        amount: validatedData.amount,
        bidderId: user.id,
      });
      res.status(201).json(bid);
    } catch (error) {
      console.error("Create bid error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid bid data", details: error.errors });
      }
      res.status(500).json({ message: "Failed to place bid" });
    }
  });

  app.get("/api/nfts/:id/bids", async (req, res) => {
    try {
      const nftId = parseInt(req.params.id);
      const bids = await storage.getBidsForNft(nftId);
      res.json(bids);
    } catch (error) {
      console.error("Get bids error:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  // Get user's bids
  app.get("/api/user/bids", async (req, res) => {
    const userId = req.session.userId || (req.isAuthenticated() && req.user?.id);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const userBids = await storage.getUserBids(userId);
      res.json(userBids);
    } catch (error) {
      console.error("Get user bids error:", error);
      res.status(500).json({ message: "Failed to fetch user bids" });
    }
  });

  // Get received bids (bids on user's NFTs)
  app.get("/api/user/received-bids", async (req, res) => {
    const userId = req.session.userId || (req.isAuthenticated() && req.user?.id);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      // Get all NFTs created by the current user
      const userNfts = await storage.getNfts({ creatorId: userId });
      
      // Get all active bids for these NFTs
      const receivedBidsPromises = userNfts.map(async (nft) => {
        const bids = await storage.getBidsForNft(nft.id);
        const activeBids = bids.filter(bid => bid.isActive);
        
        if (activeBids.length > 0) {
          return {
            id: nft.id,
            title: nft.title,
            imageUrl: nft.imageUrl,
            creatorId: nft.creatorId,
            bids: activeBids
          };
        }
        return null;
      });

      const receivedBidsResults = await Promise.all(receivedBidsPromises);
      const nftsWithBids = receivedBidsResults.filter(result => result !== null);
      
      res.json(nftsWithBids);
    } catch (error) {
      console.error("Get received bids error:", error);
      res.status(500).json({ message: "Failed to fetch received bids" });
    }
  });

  // Accept bid
  app.post("/api/bids/:id/accept", async (req, res) => {
    const userId = req.session.userId || (req.isAuthenticated() && req.user?.id);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const bidId = parseInt(req.params.id);
      const sellerId = userId;
      
      const transaction = await storage.acceptBid(bidId, sellerId);
      res.status(201).json({ transaction });
    } catch (error) {
      console.error("Accept bid error:", error);
      res.status(500).json({ message: "Failed to accept bid" });
    }
  });

  // Reject bid
  app.post("/api/bids/:id/reject", async (req, res) => {
    const userId = req.session.userId || (req.isAuthenticated() && req.user?.id);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const bidId = parseInt(req.params.id);
      
      // Get the bid first to verify ownership
      const bid = await storage.getBid(bidId);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      
      // Get the NFT to verify the current user is the creator
      const nft = await storage.getNft(bid.nftId);
      if (!nft || nft.creatorId !== userId) {
        return res.status(403).json({ message: "Not authorized to reject this bid" });
      }
      
      // Mark bid as inactive (rejected)
      await storage.rejectBid(bidId);
      res.json({ message: "Bid rejected successfully" });
    } catch (error) {
      console.error("Reject bid error:", error);
      res.status(500).json({ message: "Failed to reject bid" });
    }
  });

  // Cancel bid (for bidders)
  app.post("/api/bids/:id/cancel", async (req, res) => {
    const userId = req.session.userId || (req.isAuthenticated() && req.user?.id);
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const bidId = parseInt(req.params.id);
      await storage.cancelBid(bidId, userId);
      res.json({ message: "Bid cancelled successfully" });
    } catch (error) {
      console.error("Cancel bid error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to cancel bid" 
      });
    }
  });

  // Listing Routes
  app.post("/api/listings", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const validatedData = insertListingSchema.parse(req.body);
      const listing = await storage.createListing({
        ...validatedData,
        sellerId: req.user.id,
      });
      res.status(201).json(listing);
    } catch (error) {
      console.error("Create listing error:", error);
      res.status(500).json({ message: "Failed to create listing" });
    }
  });

  app.get("/api/nfts/:id/listings", async (req, res) => {
    try {
      const nftId = parseInt(req.params.id);
      const listings = await storage.getListingsForNft(nftId);
      res.json(listings);
    } catch (error) {
      console.error("Get listings error:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.post("/api/listings/:id/buy", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const listingId = parseInt(req.params.id);
      const buyerId = req.user.id;
      
      const transaction = await storage.buyFromListing(listingId, buyerId);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Buy from listing error:", error);
      res.status(500).json({ message: "Failed to purchase from listing" });
    }
  });

  // Favorites Routes
  app.post("/api/nfts/:id/favorite", async (req, res) => {
    // Check both session-based auth (wallet) and passport auth
    const isWalletAuth = req.session && req.session.userId;
    const isPassportAuth = req.isAuthenticated && req.isAuthenticated() && req.user;
    
    if (!isWalletAuth && !isPassportAuth) {
      console.log("Auth check failed - Session userId:", req.session?.userId, "Passport auth:", isPassportAuth);
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const nftId = parseInt(req.params.id);
      const userId = req.session?.userId || req.user?.id;
      const { action } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      if (action === 'add') {
        await storage.addFavorite(userId!, nftId);
        res.json({ message: "Added to favorites" });
      } else if (action === 'remove') {
        await storage.removeFavorite(userId!, nftId);
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
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const userId = req.session.userId;

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

  // Social Connection Routes
  app.post("/api/connect-discord", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Discord username is required" });
      }

      const updatedUser = await storage.connectDiscord(req.user.id, username);
      res.json({ message: "Discord connected successfully", user: updatedUser });
    } catch (error) {
      console.error("Discord connection error:", error);
      res.status(500).json({ message: "Failed to connect Discord" });
    }
  });

  app.post("/api/connect-x", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "X username is required" });
      }

      const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
      const updatedUser = await storage.connectX(req.user.id, cleanUsername);
      res.json({ message: "X connected successfully", user: updatedUser });
    } catch (error) {
      console.error("X connection error:", error);
      res.status(500).json({ message: "Failed to connect X" });
    }
  });

  // Social Disconnect Routes
  app.post("/api/disconnect-discord", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const updatedUser = await storage.connectDiscord(req.user.id, null);
      res.json({ message: "Discord disconnected successfully", user: updatedUser });
    } catch (error) {
      console.error("Discord disconnection error:", error);
      res.status(500).json({ message: "Failed to disconnect Discord" });
    }
  });

  app.post("/api/disconnect-x", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const updatedUser = await storage.connectX(req.user.id, null);
      res.json({ message: "X disconnected successfully", user: updatedUser });
    } catch (error) {
      console.error("X disconnection error:", error);
      res.status(500).json({ message: "Failed to disconnect X" });
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
      // Check both authentication methods
      const userId = req.session.userId || (req.session as any).userId || (req.user?.id);
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

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
            creator: creator ? { id: creator.id, username: creator.displayName } : null
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
          creator: { id: user.id, username: user.displayName }
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

  // Get decrypted private key
  app.get("/api/wallet/private-key", async (req: Request, res) => {
    try {
      // Check all possible authentication sources
      const userId = req.session.userId || (req.session as any).userId || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Import wallet service and decrypt the private key
      const { walletService } = await import("./services/wallet-service");
      const decryptedPrivateKey = walletService.decryptPrivateKey(user.walletPrivateKey);
      
      res.json({ privateKey: decryptedPrivateKey });
    } catch (error) {
      console.error("Private key decryption error:", error);
      res.status(500).json({ message: "Failed to decrypt private key" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}