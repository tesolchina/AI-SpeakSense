# Google Auth Module

A standalone, reusable Google Sign-In module for Express + React applications. Drop this into any project to add Google authentication in minutes.

## Features

- Complete Google OAuth 2.0 flow (redirect, callback, logout)
- Express.js router factory with session handling
- React context provider and hook for auth state
- Pre-styled Google Sign-In button component
- TypeScript support with full type definitions
- Middleware for protecting routes (API and page routes)
- State parameter validation for CSRF protection

## Quick Start

### 1. Install Dependencies

In your project, ensure you have these peer dependencies:

```bash
npm install express express-session
# For React projects:
npm install react
```

### 2. Copy the Module

Copy the entire `google-auth-module` folder into your project.

### 3. Set Up Environment Variables

Create these environment variables (use `.env` file or Replit Secrets):

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
APP_URL=http://localhost:5000  # or your production URL
SESSION_SECRET=your-session-secret
```

### 4. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application"
6. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
7. Copy the Client ID and Client Secret

## Backend Setup

### Express Server Integration

```typescript
import express from 'express';
import session from 'express-session';
import { createGoogleAuthRouter, requireAuth, requireAuthApi } from './google-auth-module/src/server';

const app = express();

// Session middleware (required)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Mount the Google auth router
const googleAuthRouter = createGoogleAuthRouter({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: `${process.env.APP_URL}/api/auth/google/callback`,
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  scopes: ['openid', 'email', 'profile'],
  
  // Optional: Called after successful authentication
  onUserAuthenticated: async (user) => {
    console.log('User authenticated:', user.email);
    // Save user to database, create account, etc.
  },
});

app.use('/api/auth', googleAuthRouter);

// Protect page routes
app.get('/dashboard', requireAuth('/login'), (req, res) => {
  res.send('Protected dashboard');
});

// Protect API routes
app.get('/api/user/profile', requireAuthApi(), (req, res) => {
  res.json({ user: req.session.googleUser });
});

app.listen(5000);
```

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/google` | GET | Redirects to Google sign-in |
| `/api/auth/google/callback` | GET | Handles OAuth callback |
| `/api/auth/session` | GET | Returns current auth state |
| `/api/auth/logout` | POST/GET | Logs out user |

### Middleware

```typescript
import { requireAuth, requireAuthApi } from './google-auth-module/src/server';

// For page routes - redirects to login page if not authenticated
app.get('/protected-page', requireAuth('/login'), handler);

// For API routes - returns 401 if not authenticated
app.get('/api/protected', requireAuthApi(), handler);
```

## Frontend Setup

### React Integration

```tsx
import { GoogleAuthProvider, useGoogleAuth, GoogleSignInButton } from './google-auth-module/src/client';

// Wrap your app with the provider
function App() {
  return (
    <GoogleAuthProvider authEndpoint="/api/auth">
      <MyApp />
    </GoogleAuthProvider>
  );
}

// Use the hook anywhere in your app
function MyComponent() {
  const { isAuthenticated, isLoading, user, login, logout } = useGoogleAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return (
      <div>
        <img src={user?.picture} alt={user?.name} />
        <p>Welcome, {user?.name}!</p>
        <button onClick={logout}>Sign Out</button>
      </div>
    );
  }

  return <GoogleSignInButton />;
}
```

### GoogleSignInButton Props

```tsx
<GoogleSignInButton
  variant="default"    // 'default' | 'outline' | 'minimal'
  size="md"            // 'sm' | 'md' | 'lg'
  showIcon={true}      // Show Google logo
  disabled={false}
  className=""         // Additional CSS classes
  style={{}}           // Inline styles
>
  Custom button text
</GoogleSignInButton>
```

### useGoogleAuth Hook

```typescript
const {
  isAuthenticated,  // boolean - is user logged in
  isLoading,        // boolean - checking auth state
  user,             // GoogleUserProfile | null
  error,            // string | null
  login,            // () => void - redirect to Google
  logout,           // () => Promise<void> - sign out
  refetch,          // () => Promise<void> - refresh auth state
} = useGoogleAuth();
```

### User Profile Type

```typescript
interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  givenName?: string;
  familyName?: string;
  emailVerified?: boolean;
}
```

## Full Example

### Backend (server.ts)

```typescript
import express from 'express';
import session from 'express-session';
import { createGoogleAuthRouter } from './google-auth-module/src/server';

const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
}));

app.use('/api/auth', createGoogleAuthRouter({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: `${process.env.APP_URL}/api/auth/google/callback`,
  successRedirect: '/',
}));

app.listen(5000);
```

### Frontend (App.tsx)

```tsx
import { GoogleAuthProvider, useGoogleAuth, GoogleSignInButton } from './google-auth-module/src/client';

function AuthButton() {
  const { isAuthenticated, user, logout, isLoading } = useGoogleAuth();

  if (isLoading) return <span>Loading...</span>;

  if (isAuthenticated) {
    return (
      <div>
        <span>Hi, {user?.givenName}</span>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return <GoogleSignInButton variant="outline" />;
}

export default function App() {
  return (
    <GoogleAuthProvider>
      <header>
        <h1>My App</h1>
        <AuthButton />
      </header>
      <main>
        {/* Your app content */}
      </main>
    </GoogleAuthProvider>
  );
}
```

## Security Best Practices

1. **Use HTTPS in production** - Set `cookie.secure: true` in production
2. **State parameter** - CSRF protection is built-in via state parameter validation
3. **HttpOnly cookies** - Sessions use HttpOnly cookies by default
4. **Environment variables** - Never commit credentials to source control
5. **Scopes** - Only request the scopes you need

## Customization

### Custom User Storage

```typescript
createGoogleAuthRouter({
  // ... other options
  onUserAuthenticated: async (user) => {
    // Upsert user in your database
    await db.users.upsert({
      googleId: user.id,
      email: user.email,
      name: user.name,
      avatar: user.picture,
    });
  },
});
```

### Custom Session Store

```typescript
import session from 'express-session';
import connectPg from 'connect-pg-simple';

const PgSession = connectPg(session);

app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
  }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
}));
```

## Troubleshooting

### "redirect_uri_mismatch" error
- Ensure your redirect URI in Google Console exactly matches your app URL
- Check for trailing slashes and http vs https

### Session not persisting
- Make sure `express-session` is configured before mounting the auth router
- Check that cookies are being sent (credentials: 'include' in fetch)

### CORS issues
- If frontend and backend are on different origins, configure CORS properly
- Ensure cookies are allowed cross-origin

## License

MIT
