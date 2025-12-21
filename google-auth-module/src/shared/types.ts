export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  givenName?: string;
  familyName?: string;
  emailVerified?: boolean;
}

export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  successRedirect?: string;
  failureRedirect?: string;
  scopes?: string[];
  onUserAuthenticated?: (user: GoogleUserProfile) => Promise<void> | void;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: GoogleUserProfile | null;
  error: string | null;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token: string;
  refresh_token?: string;
}

export interface GoogleTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  iat: number;
  exp: number;
}
