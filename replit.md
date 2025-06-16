# SP1Mint - Zero-Knowledge NFT Minting Platform

## Overview

SP1Mint is a modern NFT minting platform built with zero-knowledge proof technology using SP1 zkVM. The platform allows users to create, mint, and trade digital art NFTs with cryptographic proof ensuring privacy and authenticity. The application features email/password authentication, automatic wallet generation, and a credits-based economy. Built with React frontend and Node.js/Express backend, utilizing PostgreSQL for data persistence and Drizzle ORM for database operations.

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

## Recent Changes

- **June 15, 2025**: Initial NFT marketplace setup with SP1 integration
- **June 15, 2025**: Implemented custom theme with #FE11C5 hot pink primary color
- **June 15, 2025**: Fixed Select component validation errors and CSS compilation issues
- **June 15, 2025**: Application successfully deployed with full functionality
- **June 15, 2025**: Replaced Discord OAuth with email/password authentication system
- **June 15, 2025**: Added SP1 zero-knowledge proof integration for minting and verification
- **June 15, 2025**: Integrated Ethereum wallet creation with encrypted private key storage
- **June 15, 2025**: Enhanced NFT minting with blockchain transactions and proof generation
- **June 15, 2025**: Complete rebranding from "NFT Lab" to "SP1Mint" across all components
- **June 15, 2025**: Implemented credits-only interface with 10 initial + social connection bonuses
- **June 15, 2025**: Integrated Succinct API for live ZK proof display with 30-second auto-refresh
- **June 15, 2025**: Removed Discord dependency for proof viewing - now displays directly from Succinct Network
- **June 15, 2025**: Fixed ZK proof auto-refresh system with dynamic time-based proof generation
- **June 15, 2025**: Implemented proper real-time updates for Community ZK Proofs section
- **June 15, 2025**: Updated ZK proof refresh rate from 30 seconds to 5 seconds for more responsive live updates
- **June 15, 2025**: Implemented NFT Metadata Whisper Effect with elegant hover animations revealing hidden details
- **June 15, 2025**: Reduced NFT prices to 1-2 credits for easy testing and minting functionality
- **June 15, 2025**: Enhanced mobile responsiveness with hamburger menu navigation and adaptive layouts
- **June 15, 2025**: Updated footer branding from "Succinct Labs" to "SP1Mint" and removed copyright text
- **June 16, 2025**: Fixed profile data real-time updates - overview stats and recent activities now auto-refresh every 5 seconds
- **June 16, 2025**: Fixed Activity section to display real transaction data with proper purchase/sale categorization and credit tracking
- **June 16, 2025**: Added "My Proofs" section to profile showing all ZK proofs generated by user's wallet for minting and purchasing
- **June 16, 2025**: Moved "My Proofs" from profile to Community section as requested for better organization
- **June 16, 2025**: Fixed mobile/tablet NFT card experience - buy buttons and metadata now always visible on touch devices
- **June 16, 2025**: Implemented comprehensive NFT marketplace with bidding and resale functionality
- **June 16, 2025**: Added detailed NFT popup with tabs for overview, bids, listings, and activity
- **June 16, 2025**: Created bidding system allowing users to place bids on NFTs with ZK proof verification
- **June 16, 2025**: Added resale listings feature enabling owners to list NFTs at custom prices for profit
- **June 16, 2025**: Implemented edition progress tracking with minted-out status indicators
- **June 16, 2025**: Enhanced NFT cards with "View Details" buttons opening comprehensive marketplace popups
- **June 16, 2025**: Fixed authentication response handling - resolved "response.json is not a function" error
- **June 16, 2025**: Login and signup functionality fully operational with PostgreSQL database integration
- **June 16, 2025**: Fixed logout JSON parsing error - resolved "Unexpected token 'O', 'OK' is not valid JSON"
- **June 16, 2025**: Fixed Create Account button - added missing confirm password field and proper form validation
- **June 16, 2025**: Fixed NFT purchase errors - updated database to mark all NFTs as available for sale

## Changelog
- June 15, 2025: Complete SP1Mint rebranding and authentication system migration

## User Preferences

Preferred communication style: Simple, everyday language.

## Demo Account
- Email: zedef0808@gmail.com
- Password: 1234
- Username: sam
- Created: June 15, 2025