# Quick Start: Deploy SP1Mint to Vercel + Neon

## 30-Second Setup Summary

1. **Neon Database** → Create project, copy DATABASE_URL
2. **GitHub** → Push your code 
3. **Vercel** → Import repository, add environment variables
4. **Deploy** → Your marketplace goes live

## Step 1: Neon Database (2 minutes)

1. Sign up at [neon.tech](https://neon.tech)
2. Create new project: "sp1mint"
3. Copy the connection string:
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

## Step 2: GitHub Push (1 minute)

```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

## Step 3: Vercel Deployment (3 minutes)

1. Go to [vercel.com](https://vercel.com) → "New Project"
2. Import your GitHub repository
3. **Build Settings:**
   - Framework Preset: **Other**
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

4. **Environment Variables** (Add these):
   ```bash
   DATABASE_URL=your-neon-connection-string
   SESSION_SECRET=your-random-32-character-secret
   SENDGRID_API_KEY=your-sendgrid-key
   FROM_EMAIL=noreply@yourdomain.com
   FROM_NAME=SP1Mint
   NODE_ENV=production
   ```

5. Click **Deploy**

## Step 4: Database Setup (1 minute)

After deployment succeeds:

```bash
# Install Drizzle CLI
npm install -g drizzle-kit

# Set your database URL
export DATABASE_URL="your-neon-connection-string"

# Push schema to database
npx drizzle-kit push
```

## Environment Variables Checklist

Copy to Vercel Dashboard → Project Settings → Environment Variables:

- [ ] `DATABASE_URL` - Your Neon connection string
- [ ] `SESSION_SECRET` - Random 32+ character string
- [ ] `SENDGRID_API_KEY` - For password reset emails
- [ ] `FROM_EMAIL` - Your domain email
- [ ] `FROM_NAME` - "SP1Mint"
- [ ] `NODE_ENV` - "production"

## Generate Session Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Troubleshooting

**Build Fails?**
- Check Vercel function logs
- Verify all dependencies in package.json

**Database Connection Issues?**
- Verify DATABASE_URL is correct
- Ensure SSL mode is required in connection string

**Session Problems?**
- Confirm SESSION_SECRET is set and 32+ characters

## Your Live Marketplace

After successful deployment: `https://your-project.vercel.app`

## Post-Deployment

1. Test user registration
2. Test NFT creation
3. Test marketplace features
4. Set up custom domain (optional)

Your SP1Mint marketplace will be live with full functionality!