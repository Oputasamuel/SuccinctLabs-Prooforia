# SP1Mint Vercel Deployment Guide with Neon Database

This guide walks you through deploying SP1Mint to Vercel with Neon PostgreSQL database.

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Neon account (free tier available)

## Step 1: Prepare Neon Database

### 1.1 Create Neon Account and Database
1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project called "sp1mint"
3. Choose your preferred region
4. Note down the connection string from the dashboard

### 1.2 Get Database Credentials
After creating your project, you'll see connection details:
```
Host: ep-xxx.us-east-1.aws.neon.tech
Database: neondb
Username: your-username
Password: your-password
```

Your full DATABASE_URL will look like:
```
postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Step 2: Prepare Your Repository

### 2.1 Push to GitHub
1. Create a new GitHub repository
2. Push your SP1Mint code:
```bash
git init
git add .
git commit -m "Initial SP1Mint deployment"
git branch -M main
git remote add origin https://github.com/yourusername/sp1mint.git
git push -u origin main
```

### 2.2 Add Vercel Configuration
Create `vercel.json` in your project root:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Step 3: Update Package.json for Vercel

### 3.1 Add Build Scripts
Update your `package.json`:
```json
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm run build",
    "start": "node server/dist/index.js",
    "vercel-build": "npm run build"
  }
}
```

### 3.2 Add Dependencies
Ensure these are in your main `package.json`:
```json
{
  "dependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0"
  }
}
```

## Step 4: Configure Environment Variables

### 4.1 Required Environment Variables
You'll need these environment variables in Vercel:

```bash
# Database
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# Session Secret
SESSION_SECRET=your-super-secret-session-key-here

# SendGrid (for password reset emails)
SENDGRID_API_KEY=your-sendgrid-api-key

# SendGrid Email Configuration
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=SP1Mint

# Node Environment
NODE_ENV=production
```

## Step 5: Deploy to Vercel

### 5.1 Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Select your SP1Mint repository

### 5.2 Configure Project Settings
1. **Framework Preset**: Other
2. **Root Directory**: `.` (leave as root)
3. **Build Command**: `npm run vercel-build`
4. **Output Directory**: `client/dist`
5. **Install Command**: `npm install`

### 5.3 Add Environment Variables
In Vercel dashboard:
1. Go to Project Settings > Environment Variables
2. Add each environment variable from Step 4.1
3. Make sure to select all environments (Production, Preview, Development)

### 5.4 Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Vercel will provide you with a deployment URL

## Step 6: Database Migration

### 6.1 Run Database Migration
After deployment, you need to set up your database schema:

1. Install Drizzle CLI locally:
```bash
npm install -g drizzle-kit
```

2. Update your `drizzle.config.ts` to use the Neon database:
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

3. Push schema to Neon:
```bash
export DATABASE_URL="your-neon-connection-string"
npx drizzle-kit push:pg
```

## Step 7: Custom Domain (Optional)

### 7.1 Add Custom Domain
1. In Vercel dashboard, go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Update environment variables if needed

## Step 8: Post-Deployment Configuration

### 8.1 Update CORS Settings
If you have CORS issues, update your Express server:
```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.vercel.app', 'https://yourdomain.com']
    : 'http://localhost:3000',
  credentials: true
}));
```

### 8.2 Test Deployment
1. Visit your Vercel URL
2. Test user registration
3. Test NFT creation and marketplace features
4. Verify database connections work

## Step 9: Monitoring and Maintenance

### 9.1 Monitor Performance
- Use Vercel Analytics
- Monitor Neon database performance
- Set up error tracking (optional: Sentry)

### 9.2 Regular Updates
- Keep dependencies updated
- Monitor database usage (Neon free tier limits)
- Backup important data

## Troubleshooting

### Common Issues

**Build Failures:**
- Check build logs in Vercel dashboard
- Ensure all dependencies are listed in package.json
- Verify TypeScript compilation

**Database Connection Issues:**
- Verify DATABASE_URL is correct
- Check Neon database status
- Ensure SSL mode is enabled

**CORS Errors:**
- Update CORS origins in server configuration
- Check environment variables are set correctly

**Session Issues:**
- Verify SESSION_SECRET is set
- Check cookie settings for production

## Production Checklist

- [ ] Neon database created and configured
- [ ] All environment variables set in Vercel
- [ ] Database schema migrated
- [ ] Custom domain configured (if applicable)
- [ ] CORS properly configured
- [ ] Session management working
- [ ] Email service configured (SendGrid)
- [ ] Error monitoring set up
- [ ] Performance monitoring enabled

## Support

For deployment issues:
- Check Vercel documentation
- Review Neon database logs
- Verify environment variable configuration
- Test locally with production environment variables

Your SP1Mint marketplace will be live at `https://your-project.vercel.app`!