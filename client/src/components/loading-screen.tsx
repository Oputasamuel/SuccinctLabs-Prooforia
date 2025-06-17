import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">prooforia</h2>
          <p className="text-gray-600 mb-4">Zero-Knowledge NFT Marketplace</p>
        </div>
        <div className="space-y-2">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600 mx-auto" />
          <p className="text-sm text-gray-500">Connecting securely...</p>
        </div>
      </div>
    </div>
  );
}