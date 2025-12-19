# SpeakAI - AI Interview Practice Platform

## Overview

SpeakAI is an AI-powered interview practice platform designed to help university students prepare for job interviews. Users can practice with customizable AI interviewers, receive real-time feedback, and track their progress over time. The application features behavioral, technical, and general interview templates with configurable personas and rubric-based evaluation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite with path aliases (@/, @shared/, @assets/)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints under /api prefix with JSON responses
- **Authentication**: Replit Auth integration using OpenID Connect with Passport.js
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple
- **AI Integration**: OpenAI API (via Replit AI Integrations) for interview conversations and image generation

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: shared/schema.ts (shared between client and server)
- **Migrations**: Drizzle Kit with migrations output to /migrations folder

### Key Data Models
- **Users/Sessions**: Authentication tables managed by Replit Auth
- **PracticeTemplates**: Interview template definitions with rubrics and default questions
- **InterviewerPersonas**: AI persona configurations with system prompts
- **PracticeSessions**: User practice session records with status tracking
- **SessionMessages**: Conversation history for each practice session
- **SessionFeedback**: AI-generated feedback and scoring
- **UserPreferences**: User settings and onboarding state

### Application Flow
1. Landing page for unauthenticated users
2. Replit Auth login flow
3. Optional onboarding for intent selection (interview prep, presentations, etc.)
4. Dashboard showing stats and recent sessions
5. Practice setup with template/persona selection
6. Live practice session with AI interviewer
7. Session review with feedback and analytics

## External Dependencies

### AI Services
- **OpenAI API**: Powers the AI interviewer conversations, accessed through Replit AI Integrations environment variables (AI_INTEGRATIONS_OPENAI_API_KEY, AI_INTEGRATIONS_OPENAI_BASE_URL)
- **Image Generation**: gpt-image-1 model for avatar/image generation

### Database
- **PostgreSQL**: Primary data store, connection via DATABASE_URL environment variable

### Authentication
- **Replit Auth (OIDC)**: Identity provider using OpenID Connect protocol, requires ISSUER_URL, REPL_ID, and SESSION_SECRET environment variables

### Development Tools
- **Replit Vite Plugins**: cartographer, dev-banner, and runtime-error-modal for enhanced Replit development experience