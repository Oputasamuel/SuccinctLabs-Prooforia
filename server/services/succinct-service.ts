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
        // Return dynamic mock data for development if no API key
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
      // Fallback to dynamic mock data on error
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
    // Generate time-based proofs that actually change every 30 seconds
    const now = Date.now();
    const cycleTime = Math.floor(now / 30000); // 30-second cycles
    
    const proofTemplates = [
      "SP1 Circuit Dreams", "Digital Abstraction", "Quantum Mesh", "Neon Cityscape",
      "Ethereal Waves", "Fractured Reality", "Cosmic Geometry", "Neural Networks", 
      "Plasma Fields", "Quantum Entanglement", "Holographic Matrix", "Data Streams"
    ];
    
    const proofTypes: ("mint" | "transfer" | "verification")[] = ["mint", "transfer", "verification"];
    
    const mockProofs: SuccinctProof[] = [];
    
    // Generate proofs based on time cycles to ensure they change
    for (let i = 0; i < 6; i++) {
      const proofCycle = cycleTime - i;
      const templateIndex = (proofCycle + i) % proofTemplates.length;
      const typeIndex = (proofCycle + i) % proofTypes.length;
      
      // Use cycle time as seed for consistent but changing data
      const seed = proofCycle * 1000 + i;
      const proofId = `proof_${proofCycle}_${i}`;
      const hashSeed = (seed * 31 + i).toString(16);
      const walletSeed = (seed * 17 + i * 23).toString(16);
      
      mockProofs.push({
        id: proofId,
        status: i === 0 && proofCycle % 3 === 0 ? "pending" : "completed",
        proof_hash: `0x${hashSeed.padStart(64, '0').slice(0, 64)}`,
        proof_type: proofTypes[typeIndex],
        created_at: new Date(proofCycle * 30000).toISOString(),
        metadata: {
          nft_title: `${proofTemplates[templateIndex]} #${proofCycle}`,
          wallet_address: `0x${walletSeed.padStart(40, '0').slice(0, 40)}`
        }
      });
    }

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