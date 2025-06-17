# prooforia Deployment Guide

## Quick Deploy to Vercel

### 1. GitHub Setup
- Push your code to GitHub repository
- Ensure all files are committed

### 2. Vercel Configuration
- Connect GitHub repository to Vercel
- Set build settings:
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist/public`
  - **Install Command**: `npm install`

### 3. Environment Variables
Add these to Vercel dashboard:

```env
DATABASE_URL=your_neon_postgresql_connection_string
SESSION_SECRET=your_32_character_secret
NODE_ENV=production
```

### 4. Database Setup
Your Neon database is already configured and ready for production.

### 5. Deploy
Click "Deploy" in Vercel - your marketplace will be live in 2-3 minutes.

## Local Development

1. Clone repository
2. Copy `.env.example` to `.env`
3. Add your database credentials
4. Run `npm install`
5. Run `npm run db:push`
6. Run `npm run dev`

## Support
For deployment issues, verify environment variables and database connectivity.