import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user (supports both Replit Auth and Google Auth)
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      // Check for Replit Auth first
      if (req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        const user = await authStorage.getUser(userId);
        return res.json(user);
      }
      
      // Check for Google Auth session
      if (req.session?.googleUser) {
        const googleUser = req.session.googleUser;
        // Return Google user in compatible format
        return res.json({
          id: googleUser.id,
          email: googleUser.email,
          firstName: googleUser.givenName || googleUser.name?.split(' ')[0] || '',
          lastName: googleUser.familyName || googleUser.name?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: googleUser.picture,
          authProvider: 'google'
        });
      }
      
      // No auth found
      return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
