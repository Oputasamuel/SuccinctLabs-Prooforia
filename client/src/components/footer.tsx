import { Badge } from "@/components/ui/badge";
import { Zap, Twitter, Github } from "lucide-react";
import { SiDiscord } from "react-icons/si";

interface FooterProps {
  onTabChange?: (tab: "marketplace" | "community" | "upload") => void;
}

export default function Footer({ onTabChange }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">prooforia</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              The future of NFTs powered by zero-knowledge proofs. Create, trade, and verify
              digital art with cryptographic certainty.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://twitter.com/succinctlabs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://github.com/succinctlabs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="https://discord.gg/succinctlabs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <SiDiscord className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <button 
                  onClick={() => onTabChange?.("marketplace")} 
                  className="hover:text-primary transition-colors text-left"
                >
                  Marketplace
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onTabChange?.("upload")} 
                  className="hover:text-primary transition-colors text-left"
                >
                  Upload Art
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onTabChange?.("community")} 
                  className="hover:text-primary transition-colors text-left"
                >
                  Community
                </button>
              </li>
              <li>
                <a 
                  href="https://docs.succinct.xyz/"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a
                  href="https://succinctlabs.notion.site/SP1-Community-Developer-Resources-1afe020fb42f807888efe7190c3d427d"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  SP1 Documentation
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.succinct.xyz/learning-resources" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  ZK Learning
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.succinct.xyz/api-reference" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  API Reference
                </a>
              </li>
              <li>
                <a 
                  href="https://discord.gg/succinctlabs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex space-x-6 mb-4 md:mb-0">
            <a 
              href="https://succinct.xyz/privacy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary text-sm transition-colors"
            >
              Privacy Policy
            </a>
            <a 
              href="https://succinct.xyz/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary text-sm transition-colors"
            >
              Terms of Service
            </a>
          </div>
          <div className="text-gray-400 text-sm">
            Made by{' '}
            <a 
              href="https://x.com/chizaramch?s=21" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors font-medium"
            >
              samuel.ip
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
