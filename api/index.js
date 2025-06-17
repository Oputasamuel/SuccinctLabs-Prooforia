// Vercel serverless function entry point
export default async function handler(req, res) {
  // Import and run the Express server
  const { default: app } = await import('../dist/index.js');
  return app(req, res);
}