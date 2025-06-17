#!/bin/bash

echo "🚀 SP1Mint Vercel Deployment Setup"
echo "=================================="

# Step 1: Build the application
echo "📦 Building application..."
npm run build

# Step 2: Create uploads directory if it doesn't exist
echo "📁 Setting up uploads directory..."
mkdir -p uploads

# Step 3: Check if vercel.json exists
if [ -f "vercel.json" ]; then
    echo "✅ vercel.json found"
else
    echo "❌ vercel.json missing"
    exit 1
fi

# Step 4: Check if dist directory was created
if [ -d "dist" ]; then
    echo "✅ Build successful - dist directory created"
else
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

# Step 5: List build outputs
echo "📋 Build outputs:"
ls -la dist/

echo ""
echo "🎯 Next Steps for Vercel Deployment:"
echo "1. Push your code to GitHub"
echo "2. Connect your GitHub repo to Vercel"
echo "3. Set environment variables in Vercel dashboard"
echo "4. Deploy!"
echo ""
echo "📖 Full guide available in VERCEL_DEPLOYMENT_GUIDE.md"