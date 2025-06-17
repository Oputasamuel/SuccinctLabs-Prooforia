import { Express, Request } from "express";
import session from "express-session";
import multer from "multer";
import { storage } from "./storage";
import { walletService } from "./services/wallet-service";
import { User as SelectUser } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    walletAddress?: string;
  }
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupWalletAuth(app: Express) {
  // Don't set up session here - let the main auth handle it

  // Configure multer for profile image uploads
  const upload = multer({
    storage: multer.diskStorage({
      destination: './uploads/',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
      }
    }),
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Create account with wallet generation
  app.post("/api/wallet/create-account", upload.single('profileImage'), async (req: Request & {file?: Express.Multer.File}, res) => {
    try {
      const { displayName } = req.body;

      if (!displayName) {
        return res.status(400).json({ message: "Display name is required" });
      }

      // Handle profile image file if uploaded
      let profilePictureUrl = null;
      if (req.file) {
        profilePictureUrl = `/uploads/${req.file.filename}`;
      }

      // Generate new wallet
      const walletData = walletService.generateWallet();

      // Check if wallet address already exists (very unlikely but safe)
      const existingUser = await storage.getUserByWalletAddress(walletData.address);
      if (existingUser) {
        return res.status(400).json({ message: "Wallet address already exists" });
      }

      // Create user with wallet
      const user = await storage.createUser({
        displayName,
        profilePicture: profilePictureUrl,
        walletAddress: walletData.address,
        walletPrivateKey: walletService.encryptPrivateKey(walletData.privateKey),
        walletPublicKey: walletData.publicKey,
      });

      // Set session
      req.session.userId = user.id;

      res.status(201).json({
        user,
        privateKey: walletData.privateKey, // Return unencrypted private key for user to save
        message: "Account created successfully. Please save your private key securely!"
      });
    } catch (error) {
      console.error("Account creation error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Login with private key
  app.post("/api/wallet/login", async (req, res) => {
    try {
      const { privateKey } = req.body;

      if (!privateKey) {
        return res.status(400).json({ message: "Private key is required" });
      }

      // Get wallet address from private key
      const walletAddress = walletService.getAddressFromPrivateKey(privateKey);
      
      // Find user by wallet address
      const user = await storage.getUserByWalletAddress(walletAddress);
      if (!user) {
        return res.status(404).json({ message: "Account not found" });
      }

      // Verify private key matches stored encrypted key
      const decryptedKey = walletService.decryptPrivateKey(user.walletPrivateKey);
      const cleanInputKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
      const cleanStoredKey = decryptedKey.startsWith('0x') ? decryptedKey.slice(2) : decryptedKey;

      if (cleanInputKey.toLowerCase() !== cleanStoredKey.toLowerCase()) {
        return res.status(401).json({ message: "Invalid private key" });
      }

      // Set session
      req.session.userId = user.id;

      res.json({ user, message: "Login successful" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get("/api/user", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });
}