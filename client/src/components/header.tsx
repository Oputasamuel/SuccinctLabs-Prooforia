import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Wallet, User, LogOut, Menu, X } from "lucide-react";
import { useAuth, type AuthUser } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useState } from "react";

interface HeaderProps {
  activeTab: "marketplace" | "community" | "upload";
  onTabChange: (tab: "marketplace" | "community" | "upload") => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const { user: currentUser, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">SP1Mint</span>
            <Badge variant="secondary" className="hidden sm:inline-flex bg-primary/10 text-primary hover:bg-primary/20">
              Powered by Succinct Labs
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

          {/* Desktop User Authentication */}
          <div className="hidden md:flex">
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
                    {currentUser.displayName}
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

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Navigation */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onTabChange("marketplace");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "marketplace"
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Marketplace
                </button>
                <button
                  onClick={() => {
                    onTabChange("community");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "community"
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Community
                </button>
                <button
                  onClick={() => {
                    onTabChange("upload");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "upload"
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Upload Art
                </button>
              </div>

              {/* Mobile User Section */}
              {currentUser ? (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Link 
                      href="/profile" 
                      className="text-sm font-medium text-gray-900 hover:text-primary"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {currentUser.displayName}
                    </Link>
                    <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-1">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">
                        {currentUser.credits || 0}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      logoutMutation.mutate();
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={logoutMutation.isPending}
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-4">
                  <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                      <User className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
