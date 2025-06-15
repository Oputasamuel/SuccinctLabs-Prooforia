import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Coins, Zap, Shield, LogOut, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DiscordUser {
  id: number;
  username: string;
  discordUsername: string;
  discordAvatar: string;
  walletAddress: string;
  testTokenBalance: number;
  delegatedCredits: number;
}

interface DiscordAuthProps {
  onUserLogin: (user: DiscordUser) => void;
  currentUser: DiscordUser | null;
}

export default function DiscordAuth({ onUserLogin, currentUser }: DiscordAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [demoUsername, setDemoUsername] = useState("");

  useEffect(() => {
    // Check URL params for auth result
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const userId = urlParams.get('userId');

    if (authStatus === 'success' && userId) {
      fetchUserInfo(parseInt(userId));
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (authStatus === 'error') {
      console.error('Discord authentication failed');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchUserInfo = async (userId: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/auth/user/${userId}`);
      if (response.ok) {
        const user = await response.json();
        onUserLogin(user);
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordLogin = () => {
    setIsLoading(true);
    window.location.href = '/api/auth/discord';
  };

  const handleDemoLogin = async () => {
    if (!demoUsername.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: demoUsername.trim() }),
      });
      
      const data = await response.json();
      
      if (data.success && data.user) {
        onUserLogin(data.user);
      }
    } catch (error) {
      console.error('Demo login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    onUserLogin(null as any);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (currentUser) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={currentUser.discordAvatar ? `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.discordAvatar}.png` : undefined} 
                alt={currentUser.discordUsername} 
              />
              <AvatarFallback>{currentUser.discordUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{currentUser.discordUsername}</CardTitle>
              <p className="text-sm text-gray-600">Connected via Discord</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Wallet Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Wallet className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Wallet Address</span>
            </div>
            <p className="text-xs font-mono bg-white px-2 py-1 rounded border">
              {formatAddress(currentUser.walletAddress)}
            </p>
          </div>

          {/* Balances */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Coins className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Test Tokens</span>
              </div>
              <p className="text-lg font-bold text-blue-600">{currentUser.testTokenBalance}</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Zap className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">SP1 Credits</span>
              </div>
              <p className="text-lg font-bold text-purple-600">{currentUser.delegatedCredits}</p>
            </div>
          </div>

          {/* ZK Proof Status */}
          <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">ZK Proof Ready</span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-600">
              Active
            </Badge>
          </div>

          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Connect with Discord</CardTitle>
        <p className="text-gray-600">
          Sign in to create your ZK-powered NFT wallet and start minting
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">What you'll get:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• New Ethereum wallet with private key</li>
              <li>• 100 test tokens for minting</li>
              <li>• 10 SP1 credits for ZK proofs</li>
              <li>• Secure Discord-based authentication</li>
            </ul>
          </div>

          {!showDemo ? (
            <>
              <Button 
                onClick={handleDiscordLogin}
                disabled={isLoading}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                )}
                {isLoading ? 'Connecting...' : 'Connect with Discord'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button 
                variant="outline"
                onClick={() => setShowDemo(true)}
                className="w-full"
              >
                <User className="h-4 w-4 mr-2" />
                Try Demo Login
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="demo-username">Demo Username</Label>
                <Input
                  id="demo-username"
                  placeholder="Enter any username"
                  value={demoUsername}
                  onChange={(e) => setDemoUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleDemoLogin()}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleDemoLogin}
                  disabled={isLoading || !demoUsername.trim()}
                  className="flex-1"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <User className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? 'Creating...' : 'Create Demo Wallet'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setShowDemo(false)}
                  disabled={isLoading}
                >
                  Back
                </Button>
              </div>
            </div>
          )}
          
          <p className="text-xs text-gray-500 text-center">
            {showDemo 
              ? "Demo creates a test wallet with SP1 credits and test tokens"
              : "By connecting, you agree to create a new wallet for NFT minting and trading"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}