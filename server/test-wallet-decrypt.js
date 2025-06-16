import { walletService } from './services/wallet-service.js';
import { db } from './db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function testDecryption() {
  try {
    // Get the user's encrypted private key
    const [user] = await db.select().from(users).where(eq(users.email, 'zedef0808@gmail.com'));
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', user.email);
    console.log('Wallet address:', user.walletAddress);
    console.log('Encrypted private key:', user.walletPrivateKey);
    
    // Decrypt the private key
    const decryptedKey = walletService.decryptPrivateKey(user.walletPrivateKey);
    console.log('Decrypted private key:', decryptedKey);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testDecryption();