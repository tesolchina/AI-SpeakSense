import { Router, Request, Response } from 'express';
import type { GoogleAuthConfig, GoogleUserProfile, TokenResponse, GoogleTokenPayload } from '../shared/types';

declare module 'express-session' {
  interface SessionData {
    googleUser?: GoogleUserProfile;
    oauthState?: string;
  }
}

function generateRandomState(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function decodeJwtPayload(idToken: string): GoogleTokenPayload {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
  return JSON.parse(payload);
}

export function createGoogleAuthRouter(config: GoogleAuthConfig): Router {
  const router = Router();

  const {
    clientId,
    clientSecret,
    redirectUri,
    successRedirect = '/',
    failureRedirect = '/login',
    scopes = ['openid', 'email', 'profile'],
    onUserAuthenticated
  } = config;

  router.get('/google', (req: Request, res: Response) => {
    const state = generateRandomState();
    req.session.oauthState = state;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.redirect(authUrl);
  });

  router.get('/google/callback', async (req: Request, res: Response) => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        console.error('Google OAuth error:', error);
        return res.redirect(failureRedirect);
      }

      if (!code || typeof code !== 'string') {
        console.error('No authorization code received');
        return res.redirect(failureRedirect);
      }

      if (state !== req.session.oauthState) {
        console.error('OAuth state mismatch');
        return res.redirect(failureRedirect);
      }

      delete req.session.oauthState;

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('Token exchange failed:', errorData);
        return res.redirect(failureRedirect);
      }

      const tokens: TokenResponse = await tokenResponse.json();

      const payload = decodeJwtPayload(tokens.id_token);

      const user: GoogleUserProfile = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        givenName: payload.given_name,
        familyName: payload.family_name,
        emailVerified: payload.email_verified,
      };

      req.session.googleUser = user;

      if (onUserAuthenticated) {
        await onUserAuthenticated(user);
      }

      res.redirect(successRedirect);
    } catch (err) {
      console.error('OAuth callback error:', err);
      res.redirect(failureRedirect);
    }
  });

  router.get('/session', (req: Request, res: Response) => {
    if (req.session.googleUser) {
      res.json({
        isAuthenticated: true,
        user: req.session.googleUser
      });
    } else {
      res.json({
        isAuthenticated: false,
        user: null
      });
    }
  });

  router.post('/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  router.get('/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.redirect(failureRedirect);
      }
      res.redirect('/');
    });
  });

  return router;
}

export function requireAuth(failureRedirect: string = '/login') {
  return (req: Request, res: Response, next: Function) => {
    if (req.session.googleUser) {
      next();
    } else {
      res.redirect(failureRedirect);
    }
  };
}

export function requireAuthApi() {
  return (req: Request, res: Response, next: Function) => {
    if (req.session.googleUser) {
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };
}
