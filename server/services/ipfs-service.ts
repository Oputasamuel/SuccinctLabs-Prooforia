import crypto from "crypto";
import fs from "fs";
import path from "path";

interface IPFSUploadResult {
  hash: string;
  url: string;
}

class IPFSService {
  private uploadsDir = path.join(process.cwd(), "uploads");

  constructor() {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async uploadFile(fileBuffer: Buffer, filename: string): Promise<IPFSUploadResult> {
    try {
      const hash = this.generateMockHash(fileBuffer);
      const extension = path.extname(filename);
      const savedFilename = `${hash}${extension}`;
      const filePath = path.join(this.uploadsDir, savedFilename);
      
      // Save file to local uploads directory
      fs.writeFileSync(filePath, fileBuffer);
      
      return {
        hash,
        url: `/uploads/${savedFilename}`,
      };
    } catch (error) {
      console.error("File upload failed:", error);
      throw new Error("Failed to upload file");
    }
  }

  async uploadJSON(data: any): Promise<IPFSUploadResult> {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const buffer = Buffer.from(jsonString, "utf8");
      const hash = this.generateMockHash(buffer);
      const filename = `${hash}.json`;
      const filePath = path.join(this.uploadsDir, filename);
      
      // Save JSON file to local uploads directory
      fs.writeFileSync(filePath, jsonString);
      
      return {
        hash,
        url: `/uploads/${filename}`,
      };
    } catch (error) {
      console.error("JSON upload failed:", error);
      throw new Error("Failed to upload JSON");
    }
  }

  async getFile(hash: string): Promise<Buffer> {
    try {
      // Find file by hash in uploads directory
      const files = fs.readdirSync(this.uploadsDir);
      const file = files.find(f => f.startsWith(hash));
      
      if (!file) {
        throw new Error("File not found");
      }
      
      const filePath = path.join(this.uploadsDir, file);
      return fs.readFileSync(filePath);
    } catch (error) {
      console.error("File retrieval failed:", error);
      throw new Error("Failed to retrieve file");
    }
  }

  async pinFile(hash: string): Promise<boolean> {
    try {
      // For local storage, files are already "pinned" when saved
      return true;
    } catch (error) {
      console.error("File pinning failed:", error);
      return false;
    }
  }

  private generateMockHash(data: Buffer): string {
    // Generate a mock IPFS hash (QmXXXXXX format)
    const hash = crypto.createHash("sha256").update(data).digest("hex");
    return `Qm${hash.substring(0, 44)}`;
  }
}

export const ipfsService = new IPFSService();
