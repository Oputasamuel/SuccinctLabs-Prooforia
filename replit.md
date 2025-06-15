# NFT Marketplace with Zero-Knowledge Proofs

## Overview

This application is a modern NFT marketplace built with zero-knowledge proof technology using SP1 zkVM. The platform allows users to create, mint, trade, and verify digital art NFTs with cryptographic proof ensuring privacy and authenticity. The application features a React-based frontend with a Node.js/Express backend, utilizing PostgreSQL for data persistence and Drizzle ORM for database operations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **File Upload**: Multer for handling multipart form data
- **Session Management**: Session-based authentication (configured for PostgreSQL sessions)
- **Development Server**: Vite integration for seamless development experience

### Database Design
The application uses a PostgreSQL database with the following core entities:
- **Users**: User accounts with optional Discord integration
- **NFTs**: Digital art tokens with metadata, pricing, and edition information
- **Transactions**: Purchase and transfer records with ZK proof verification
- **ZK Proofs**: Zero-knowledge proof storage for different operation types

## Key Components

### Zero-Knowledge Proof Integration
- **SP1 Service**: Simulated ZK proof generation for minting and transfer operations
- **Proof Types**: Support for mint, transfer, and verification proofs
- **Hash-based Verification**: Cryptographic hashing for proof integrity

### File Storage and IPFS
- **IPFS Service**: Decentralized file storage simulation for NFT metadata and images
- **Mock Implementation**: Development-friendly IPFS simulation with hash generation
- **Metadata Storage**: JSON metadata uploaded to IPFS for each NFT

### NFT Marketplace Features
- **Minting**: Create new NFTs with ZK proof generation
- **Trading**: Buy/sell NFTs with cryptographic verification
- **Categories**: Organized NFT collections (Digital Art, Photography, 3D Models, etc.)
- **Edition Control**: Limited edition NFTs with current/total edition tracking
- **Verification**: ZK-proof verified authenticity for all transactions

### UI/UX Components
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Upload Interface**: Drag-and-drop file upload with validation
- **Gallery Views**: Grid and list view modes for NFT browsing
- **Community Hub**: ZK proof exploration and educational content
- **Real-time Updates**: Optimistic updates with React Query

## Data Flow

1. **NFT Creation**: User uploads art → File validation → IPFS storage → ZK proof generation → Database storage
2. **NFT Purchase**: Buyer initiates purchase → ZK proof verification → Transaction recording → Ownership transfer
3. **Marketplace Browsing**: Database query → NFT data with creator info → Frontend rendering with filtering
4. **Proof Verification**: ZK proof generation → Hash validation → Cryptographic verification

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL 16 (configured in Replit environment)
- **ORM**: Drizzle ORM with Neon Database serverless driver
- **Authentication**: Session-based with connect-pg-simple for PostgreSQL session storage
- **File Processing**: Multer for multipart form handling
- **UI Framework**: Extensive Radix UI component ecosystem

### Development Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Code Quality**: TypeScript strict mode, ESLint configuration
- **Development Experience**: Replit integration with runtime error overlay
- **Asset Management**: Custom path aliasing for organized imports

### Simulated Services
- **SP1 zkVM**: Mock implementation for ZK proof generation (ready for real SP1 integration)
- **IPFS**: Simulated decentralized storage (ready for real IPFS integration)

## Deployment Strategy

### Environment Configuration
- **Development**: Vite dev server with HMR and Express API proxy
- **Production**: Static build with Express server serving React app and API
- **Database**: Environment-based DATABASE_URL configuration
- **Sessions**: PostgreSQL-backed session storage for scalability

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: esbuild bundles Express server to `dist/index.js`
3. **Database Migration**: Drizzle Kit for schema management and migrations
4. **Asset Optimization**: Tailwind CSS purging and asset optimization

### Deployment Targets
- **Replit Autoscale**: Configured for automatic scaling deployment
- **Port Configuration**: Express server on port 5000 with external port 80
- **Static Assets**: Served from dist/public directory in production

## Changelog

Changelog:
- June 15, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.