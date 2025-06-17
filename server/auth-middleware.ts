import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

export interface AuthenticatedRequest extends Request {
  currentUser?: any;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Check multiple session sources for user ID
    const userId = req.session.userId || (req.session as any).userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Get user from storage
    const user = await storage.getUser(userId);
    if (!user) {
      // Clear invalid session
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Session expired" });
    }

    // Refresh session to extend expiry
    req.session.save(() => {});
    
    // Attach user to request
    req.currentUser = user;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
}