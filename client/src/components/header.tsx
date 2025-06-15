import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Wallet, User, LogOut } from "lucide-react";
import { useAuth, type AuthUser } from "@/hooks/use-auth";
import { Link } from "wouter";

interface HeaderProps {
  activeTab: "marketplace" | "community" | "upload";
  onTabChange: (tab: "marketplace" | "community" | "upload") => void;
  currentUser?: AuthUser | null;
}

export default function Header({ activeTab, onTabChange, currentUser }: HeaderProps) {
  const { logoutMutation } = useAuth();
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

          {/* User Authentication */}
          {currentUser ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">
                    {currentUser.credits || 0} credits
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Link href="/profile" className="text-sm font-medium text-gray-900 hover:text-primary">
                  {currentUser.username}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Link href="/auth">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
