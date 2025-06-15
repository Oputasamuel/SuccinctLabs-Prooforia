interface SuccinctProof {
  id: string;
  status: "pending" | "completed" | "failed";
  proof_hash: string;
  proof_type: "mint" | "transfer" | "verification";
  created_at: string;
  metadata?: {
    nft_title?: string;
    wallet_address?: string;
    transaction_hash?: string;
  };
}

interface SuccinctApiResponse {
  proofs: SuccinctProof[];
  total: number;
  page: number;
  limit: number;
}

class SuccinctService {
  private baseUrl = "https://alpha.succinct.xyz/api/v1";
  private apiKey = process.env.SUCCINCT_API_KEY;

  async getProofs(page: number = 1, limit: number = 20): Promise<SuccinctApiResponse> {
    try {
      if (!this.apiKey) {
        // Return mock data for development if no API key
        return this.getMockProofs(page, limit);
      }

      const response = await fetch(`${this.baseUrl}/proofs?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Succinct API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching proofs from Succinct API:", error);
      // Fallback to mock data on error
      return this.getMockProofs(page, limit);
    }
  }

  async getProofById(proofId: string): Promise<SuccinctProof | null> {
    try {
      if (!this.apiKey) {
        return null;
      }

      const response = await fetch(`${this.baseUrl}/proofs/${proofId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Succinct API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching proof by ID from Succinct API:", error);
      return null;
    }
  }

  private getMockProofs(page: number, limit: number): SuccinctApiResponse {
    const mockProofs: SuccinctProof[] = [
      {
        id: "proof_7a8b9c2d",
        status: "completed",
        proof_hash: "0x7a8b9c2d5f6e8a1b3c4d7e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6a9b",
        proof_type: "mint",
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
        metadata: {
          nft_title: "SP1 Circuit Dreams",
          wallet_address: "0xCD655f0AaC66219086E232c21FC88D9e2"
        }
      },
      {
        id: "proof_3f5e1a8b",
        status: "completed",
        proof_hash: "0x3f5e1a8b7c2d9e4f6a3b8c5d0e7f2a9b4c1d6e3f8a5b0c7d2e9f4a1b6c3d8e5f",
        proof_type: "transfer",
        created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
        metadata: {
          nft_title: "Digital Abstraction #1",
          wallet_address: "0x1234567890abcdef1234567890abcdef12345678"
        }
      },
      {
        id: "proof_9d2c4e7f",
        status: "completed",
        proof_hash: "0x9d2c4e7f1a3b6c8d5e0f7a2b9c4d1e6f3a8b5c0d7e2f9a4b1c6d3e8f5a0b7c2d",
        proof_type: "mint",
        created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(), // 1.25 hours ago
        metadata: {
          nft_title: "Quantum Mesh",
          wallet_address: "0xabcdef1234567890abcdef1234567890abcdef12"
        }
      },
      {
        id: "proof_6b1a8f3c",
        status: "completed",
        proof_hash: "0x6b1a8f3c2d5e9a4b7c0d3e6f1a8b5c2d9e4f7a0b3c6d1e8f5a2b9c4d7e0f3a6b",
        proof_type: "verification",
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        metadata: {
          nft_title: "Neon Cityscape",
          wallet_address: "0x5678901234abcdef5678901234abcdef56789012"
        }
      },
      {
        id: "proof_2e4d7c9a",
        status: "completed",
        proof_hash: "0x2e4d7c9a1b5f8c3d6e0a4b7c2e9f5a1b8c3d6e0a7b2c9f4a1d8e5f0a3b6c9d2e",
        proof_type: "mint",
        created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
        metadata: {
          nft_title: "Ethereal Waves",
          wallet_address: "0x9876543210fedcba9876543210fedcba98765432"
        }
      },
      {
        id: "proof_5a7f3b8e",
        status: "completed",
        proof_hash: "0x5a7f3b8e4c1d9f6a2b5c8d0e3f7a4b1c6d9e2f5a8b0c3d6e1f4a7b2c5d8e1f4a",
        proof_type: "transfer",
        created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
        metadata: {
          nft_title: "Fractured Reality",
          wallet_address: "0xfedcba0987654321fedcba0987654321fedcba09"
        }
      }
    ];

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const pagedProofs = mockProofs.slice(startIndex, endIndex);

    return {
      proofs: pagedProofs,
      total: mockProofs.length,
      page,
      limit
    };
  }

  async submitProof(proofData: {
    proof_type: "mint" | "transfer" | "verification";
    metadata: any;
  }): Promise<string> {
    try {
      if (!this.apiKey) {
        // Return mock proof ID for development
        return `proof_${Math.random().toString(36).substr(2, 8)}`;
      }

      const response = await fetch(`${this.baseUrl}/proofs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proofData),
      });

      if (!response.ok) {
        throw new Error(`Succinct API error: ${response.status}`);
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error("Error submitting proof to Succinct API:", error);
      throw error;
    }
  }
}

export const succinctService = new SuccinctService();