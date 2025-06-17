# prooforia - Zero-Knowledge NFT Marketplace

## Overview

prooforia is a modern NFT marketplace platform that leverages zero-knowledge proof technology through Succinct Labs' SP1 zkVM. The application allows users to create, mint, trade, and verify digital art NFTs with cryptographic certainty. Built as a full-stack TypeScript application, it features a React frontend with Vite, an Express.js backend, and PostgreSQL database with Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with file upload support
- **Session Management**: Express sessions with PostgreSQL store
- **Authentication**: Custom wallet-based auth with password fallback

### Database Architecture
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Normalized relational design with users, NFTs, transactions, and proofs
- **Sessions**: PostgreSQL-backed session storage

## Key Components

### Authentication System
- **Wallet-based Authentication**: Primary login method using private keys
- **Email/Password Fallback**: Traditional authentication for accessibility
- **Session Management**: Secure session handling with PostgreSQL store
- **Password Recovery**: Email-based reset with SendGrid integration

### NFT Management
- **File Upload**: Multer-based file handling with local storage
- **Metadata Generation**: JSON metadata creation following NFT standards
- **IPFS Simulation**: Mock IPFS service for development (ready for real IPFS)
- **Edition Control**: Support for limited edition NFTs

### Zero-Knowledge Integration
- **SP1 Service**: Mock ZK proof generation (ready for Succinct Labs integration)
- **Proof Verification**: Cryptographic proof validation for transactions
- **Succinct API**: Integration with Succinct Labs' proof generation service

### Social Features
- **Discord Integration**: OAuth-based Discord account linking
- **Profile Management**: User profiles with social connections
- **Community Hub**: Real-time proof monitoring and community features

## Data Flow

### NFT Creation Flow
1. User uploads image file through authenticated endpoint
2. File stored locally with unique hash-based naming
3. Metadata JSON generated and stored
4. ZK proof generated for minting operation
5. NFT record created in database with proof hash
6. Transaction recorded for audit trail

### Authentication Flow
1. User provides wallet private key or email/password
2. Credentials validated against database
3. Session created and stored in PostgreSQL
4. User object cached in React Query state
5. Protected routes enforce authentication

### Marketplace Flow
1. NFTs fetched with creator information
2. Real-time updates via React Query polling
3. User interactions (favorites, purchases) update database
4. ZK proofs generated for all transactions

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **@tanstack/react-query**: Server state management
- **@sendgrid/mail**: Email service for password resets
- **multer**: File upload handling
- **drizzle-orm**: Type-safe database operations

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Modern icon library
- **react-hook-form**: Form state management
- **zod**: Runtime type validation

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type safety
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production

## Deployment Strategy

### Vercel Deployment
- **Build Process**: Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.js`
- **Routing**: Vercel configuration handles API routes and static file serving
- **Environment Variables**: Database URL, session secrets, and API keys
- **File Storage**: Local uploads directory mounted in serverless environment

### Development Environment
- **Replit Configuration**: Ready for Replit deployment with `.replit` configuration
- **Hot Reload**: Vite HMR for frontend, tsx for backend development
- **Database**: Neon PostgreSQL with connection pooling
- **Port Configuration**: Express server on port 5000

### Production Considerations
- **Session Storage**: PostgreSQL-backed sessions for horizontal scaling
- **File Storage**: Ready to migrate from local storage to cloud storage
- **Environment Security**: Sensitive data in environment variables
- **Database Migrations**: Drizzle kit for schema management

## Changelog

- June 17, 2025: Initial setup
- June 17, 2025: Complete rebranding from SP1Mint to prooforia across entire application
- June 17, 2025: Updated all frontend components, backend services, documentation, and assets with new prooforia branding
- June 17, 2025: Fixed private key display functionality in profile wallet tab with proper session authentication and error handling
- June 17, 2025: Optimized authentication flow with 2-second timeout to resolve slow loading issues
- June 17, 2025: Completely cleared database and file system - removed all users, NFTs, and uploaded files for fresh start
- June 17, 2025: Enhanced bid acceptance with proper credit transfers between bidder and owner
- June 17, 2025: Implemented ZK proof generation for NFT ownership transfers using SP1 service
- June 17, 2025: Fixed session persistence issues by removing email/password authentication completely

## User Preferences

Preferred communication style: Simple, everyday language.