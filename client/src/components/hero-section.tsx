import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

interface HeroSectionProps {
  onStartCreating: () => void;
}

export default function HeroSection({ onStartCreating }: HeroSectionProps) {
  return (
    <section className="gradient-bg py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Create & Trade NFTs with{" "}
          <span className="text-primary">Zero-Knowledge Proofs</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Upload your digital art, mint limited editions, and trade securely using SP1 zkVM
          technology. Join the Succinct Labs community and experience the future of private,
          verifiable transactions.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            onClick={onStartCreating}
            className="btn-primary px-8 py-4 text-lg flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Start Creating</span>
          </Button>
          <Button
            variant="outline"
            className="btn-secondary px-8 py-4 text-lg flex items-center justify-center space-x-2"
          >
            <Search className="w-5 h-5" />
            <span>Explore Marketplace</span>
          </Button>
        </div>

        <p className="text-primary font-medium">
          Or explore our{" "}
          <button className="underline hover:no-underline">Community Hub →</button>
        </p>
      </div>
    </section>
  );
}
