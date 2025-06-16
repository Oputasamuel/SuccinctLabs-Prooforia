import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { walletService } from "./services/wallet-service";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);
const PostgresSessionStore = connectPg(session);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  if (!stored || !stored.includes('.')) {
    console.error('Invalid password format in database:', stored);
    return false;
  }
  
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    console.error('Missing hash or salt:', { hashed: !!hashed, salt: !!salt });
    return false;
  }
  
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("User deserialization error:", error);
      done(null, false);
    }
  });

  // Authentication routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const existingDisplayName = await storage.getUserByDisplayName(username);
      if (existingDisplayName) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Generate wallet for new user
      const { walletService } = await import("./services/wallet-service");
      const wallet = walletService.generateWallet();
      const encryptedPrivateKey = walletService.encryptPrivateKey(wallet.privateKey);

      // Create user with hashed password
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        displayName: username,
        email,
        password: hashedPassword,
        walletAddress: wallet.address,
        walletPrivateKey: encryptedPrivateKey,
        walletPublicKey: wallet.publicKey,
      });

      // Auto-login after registration
      req.login(user, (err) => {
        if (err) return next(err);
        const publicUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          walletAddress: user.walletAddress,
          credits: user.credits,
          discordConnected: user.discordConnected,
          discordUsername: user.discordUsername,
          discordAvatar: user.discordAvatar,
          xConnected: user.xConnected,
          xUsername: user.xUsername,
        };
        res.status(201).json({ user: publicUser });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        const publicUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          walletAddress: user.walletAddress,
          credits: user.credits,
          discordConnected: user.discordConnected,
          discordUsername: user.discordUsername,
          discordAvatar: user.discordAvatar,
          xConnected: user.xConnected,
          xUsername: user.xUsername,
        };
        res.json({ user: publicUser });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.sendStatus(401);
    }
    
    const publicUser = {
      id: req.user.id,
      username: req.user.displayName,
      email: req.user.email,
      walletAddress: req.user.walletAddress,
      credits: req.user.credits,
      discordConnected: req.user.discordConnected,
      discordUsername: req.user.discordUsername,
      discordAvatar: req.user.discordAvatar,
      xConnected: req.user.xConnected,
      xUsername: req.user.xUsername,
    };
    res.json(publicUser);
  });

  // Social connection routes
  app.post("/api/connect/discord", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.sendStatus(401);
    }

    try {
      const { discordUsername, discordAvatar } = req.body;
      
      if (!discordUsername) {
        return res.status(400).json({ message: "Discord username is required" });
      }

      // Validate Discord username pattern (supports both legacy #discriminator and new @username formats)
      const discordPattern = /^[a-zA-Z0-9_.]{2,32}(#[0-9]{4})?$|^@[a-zA-Z0-9_.]{2,32}$/;
      if (!discordPattern.test(discordUsername)) {
        return res.status(400).json({ 
          message: "Invalid Discord username format. Use either 'username#1234' or '@username' format." 
        });
      }

      const updatedUser = await storage.connectDiscord(req.user.id, discordUsername, discordAvatar);
      
      const publicUser = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        walletAddress: updatedUser.walletAddress,
        credits: updatedUser.credits,
        discordConnected: updatedUser.discordConnected,
        discordUsername: updatedUser.discordUsername,
        discordAvatar: updatedUser.discordAvatar,
        xConnected: updatedUser.xConnected,
        xUsername: updatedUser.xUsername,
      };
      
      res.json({ user: publicUser });
    } catch (error) {
      console.error("Discord connection error:", error);
      res.status(500).json({ message: "Failed to connect Discord" });
    }
  });

  app.post("/api/connect/x", async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.sendStatus(401);
    }

    try {
      const { xUsername } = req.body;
      
      if (!xUsername) {
        return res.status(400).json({ message: "X username is required" });
      }

      // Validate X (Twitter) username pattern (with or without @ symbol)
      const cleanUsername = xUsername.startsWith('@') ? xUsername.slice(1) : xUsername;
      const xPattern = /^[a-zA-Z0-9_]{1,15}$/;
      if (!xPattern.test(cleanUsername)) {
        return res.status(400).json({ 
          message: "Invalid X username format. Must be 1-15 characters, letters, numbers, and underscores only." 
        });
      }

      const updatedUser = await storage.connectX(req.user.id, cleanUsername);
      
      const publicUser = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        walletAddress: updatedUser.walletAddress,
        credits: updatedUser.credits,
        discordConnected: updatedUser.discordConnected,
        discordUsername: updatedUser.discordUsername,
        discordAvatar: updatedUser.discordAvatar,
        xConnected: updatedUser.xConnected,
        xUsername: updatedUser.xUsername,
      };
      
      res.json({ user: publicUser });
    } catch (error) {
      console.error("X connection error:", error);
      res.status(500).json({ message: "Failed to connect X" });
    }
  });

  // Wallet details route
  app.get("/api/wallet", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.sendStatus(401);
    }

    try {
      const privateKey = walletService.decryptPrivateKey(req.user.walletPrivateKey);
      
      res.json({
        address: req.user.walletAddress,
        publicKey: req.user.walletPublicKey,
        privateKey: privateKey,
      });
    } catch (error) {
      console.error("Wallet details error:", error);
      res.status(500).json({ message: "Failed to retrieve wallet details" });
    }
  });
}