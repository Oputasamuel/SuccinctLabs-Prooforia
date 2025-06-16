import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { walletService } from "./services/wallet-service";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupWalletAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'wallet-auth-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));

  // Create account with wallet generation
  app.post("/api/wallet/create-account", async (req, res) => {
    try {
      const { displayName, profilePicture } = req.body;

      if (!displayName) {
        return res.status(400).json({ message: "Display name is required" });
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
        profilePicture: profilePicture || null,
        walletAddress: walletData.address,
        walletPrivateKey: walletService.encryptPrivateKey(walletData.privateKey),
        walletPublicKey: walletData.publicKey,
      });

      // Set session
      (req.session as any).userId = user.id;

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
      (req.session as any).userId = user.id;

      res.json({ user, message: "Login successful" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get("/api/user", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
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