import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Wallet } from "lucide-react";

interface HeaderProps {
  activeTab: "marketplace" | "community" | "upload";
  onTabChange: (tab: "marketplace" | "community" | "upload") => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Succinct Labs</span>
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
              Powered by SP1
            </Badge>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => onTabChange("marketplace")}
              className={`font-medium transition-colors ${
                activeTab === "marketplace"
                  ? "text-primary"
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              Marketplace
            </button>
            <button
              onClick={() => onTabChange("community")}
              className={`font-medium transition-colors ${
                activeTab === "community"
                  ? "text-primary"
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              Community
            </button>
            <button
              onClick={() => onTabChange("upload")}
              className={`font-medium transition-colors ${
                activeTab === "upload"
                  ? "text-primary"
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              Upload Art
            </button>
          </nav>

          {/* Connect Wallet */}
          <Button className="btn-primary flex items-center space-x-2">
            <Wallet className="w-4 h-4" />
            <span>Connect Discord</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
