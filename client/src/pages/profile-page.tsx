import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ShoppingBag, Palette, TrendingUp, Copy, Share, Heart, HeartOff, Settings, Users, Eye, EyeOff, Key, CheckCircle, Link as LinkIcon, ExternalLink, Shield, AlertTriangle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Nft, Transaction, ZkProof } from "@shared/schema";
import Header from "@/components/header";
import UserBidsSection from "@/components/user-bids-section";
import ReceivedBidsSection from "@/components/received-bids-section";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

interface NftWithCreator extends Nft {
  creator?: {
    id: number;
    username: string;
  } | null;
}

interface UserProfile {
  createdNfts: NftWithCreator[];
  purchasedNfts: NftWithCreator[];
  favoritedNfts: NftWithCreator[];
  transactions: Transaction[];
  zkProofs: ZkProof[];
  stats: {
    totalCreated: number;
    totalPurchased: number;
    totalSpent: number;
    totalEarned: number;
  };
}

// NFT Profile Card Component
function NFTProfileCard({ nft, type }: { nft: NftWithCreator; type: "created" | "purchased" | "favorited" }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (nftId: number) => {
      const response = await apiRequest("POST", `/api/nfts/${nftId}/favorite`);
      if (!response.ok) throw new Error("Failed to toggle favorite");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Success",
        description: "Favorite updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isFavorited = type === "favorited";

  const handleToggleFavorite = () => {
    toggleFavoriteMutation.mutate(nft.id);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/nft/${nft.id}`);
    toast({
      title: "Link copied",
      description: "NFT link copied to clipboard",
    });
  };

  const handleShareToX = () => {
    const text = `Check out this amazing NFT: ${nft.title}`;
    const url = `${window.location.origin}/nft/${nft.id}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-square relative overflow-hidden">
        <img
          src={nft.imageUrl}
          alt={nft.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          {type === "created" && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Created
            </Badge>
          )}
          {type === "purchased" && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              Purchased
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg truncate">{nft.title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleFavorite}
            disabled={toggleFavoriteMutation.isPending}
          >
            {isFavorited ? (
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            ) : (
              <HeartOff className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {nft.description}
        </p>
        <div className="flex justify-between items-center mb-3">
          <span className="text-lg font-bold">{nft.price} credits</span>
          <Badge variant="outline">{nft.category}</Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareToX}
            className="flex-1"
          >
            <Share className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
        {type === "created" && nft.currentEdition && (
          <div className="mt-2 text-xs text-gray-500">
            Edition {nft.currentEdition}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [xUsername, setXUsername] = useState("");
  const [xDialogOpen, setXDialogOpen] = useState(false);
  const [discordUsername, setDiscordUsername] = useState("");
  const [discordDialogOpen, setDiscordDialogOpen] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  // Fetch decrypted private key from server when needed
  const { data: privateKeyData, error: privateKeyError } = useQuery<{ privateKey: string }>({
    queryKey: ["/api/wallet/private-key"],
    enabled: !!user && showPrivateKey,
    staleTime: 0, // Always fetch fresh
    retry: false, // Don't retry on failure
  });

  const getDecryptedPrivateKey = () => {
    if (!showPrivateKey) return null;
    if (privateKeyError) {
      // If API fails, show the encrypted key with a warning
      return user?.walletPrivateKey || null;
    }
    return privateKeyData?.privateKey || null;
  };

  const connectXMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await apiRequest("POST", "/api/connect-x", { username });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to connect X account" }));
        throw new Error(errorData.message);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data.user);
      toast({
        title: "Success",
        description: "X account connected successfully",
      });
      setXDialogOpen(false);
      setXUsername("");
    },
    onError: (error: Error) => {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const connectDiscordMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await apiRequest("POST", "/api/connect-discord", { username });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to connect Discord account" }));
        throw new Error(errorData.message);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data.user);
      toast({
        title: "Success",
        description: "Discord account connected successfully",
      });
      setDiscordDialogOpen(false);
      setDiscordUsername("");
    },
    onError: (error: Error) => {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectXMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/disconnect-x", {});
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to disconnect X account" }));
        throw new Error(errorData.message);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Success",
        description: "X account disconnected successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Disconnect failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectDiscordMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/disconnect-discord", {});
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to disconnect Discord account" }));
        throw new Error(errorData.message);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Success",
        description: "Discord account disconnected successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Disconnect failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header activeTab="marketplace" onTabChange={() => {}} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4">Please log in to view your profile</h2>
              <Link href="/auth">
                <Button>Go to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header 
        activeTab="marketplace" 
        onTabChange={(tab) => {
          // Navigate back to home page with the selected tab
          const searchParams = new URLSearchParams();
          searchParams.set('tab', tab);
          setLocation(`/?${searchParams.toString()}`);
        }} 
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl font-bold bg-primary text-white">
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{user.displayName}</h1>
                  <p className="text-gray-600">Wallet: {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{user.credits} credits</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab("settings")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">{profile?.stats.totalCreated || 0}</div>
                <p className="text-sm text-muted-foreground">Created</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">{profile?.stats.totalPurchased || 0}</div>
                <p className="text-sm text-muted-foreground">Purchased</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">{profile?.stats.totalEarned || 0}</div>
                <p className="text-sm text-muted-foreground">Credits Earned</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">{profile?.favoritedNfts?.length || 0}</div>
                <p className="text-sm text-muted-foreground">Favorited</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Profile Sections with Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation for larger screens */}
          <div className="hidden lg:block lg:w-64">
            <div className="sticky top-6">
              <Card>
                <CardContent className="p-4">
                  <nav className="space-y-2">
                    <Button
                      variant={activeTab === "overview" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveTab("overview")}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Overview
                    </Button>
                    <Button
                      variant={activeTab === "created" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveTab("created")}
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      Created
                    </Button>
                    <Button
                      variant={activeTab === "purchased" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveTab("purchased")}
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Purchased
                    </Button>
                    <Button
                      variant={activeTab === "favorited" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveTab("favorited")}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Favorited
                    </Button>
                    <Button
                      variant={activeTab === "activity" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveTab("activity")}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Activity
                    </Button>
                    <Button
                      variant={activeTab === "proofs" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveTab("proofs")}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      My Proofs
                    </Button>
                    <Button
                      variant={activeTab === "bids" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveTab("bids")}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      My Bids
                    </Button>
                    <Button
                      variant={activeTab === "received-bids" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveTab("received-bids")}
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Received Bids
                    </Button>
                    <Button
                      variant={activeTab === "wallet" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveTab("wallet")}
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Wallet
                    </Button>
                    <Button
                      variant={activeTab === "social" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveTab("social")}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Social
                    </Button>
                    <Button
                      variant={activeTab === "settings" ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveTab("settings")}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </nav>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tab navigation for smaller screens */}
          <div className="lg:hidden mb-6">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg bg-white text-sm shadow-sm"
            >
              <option value="overview">📊 Overview</option>
              <option value="created">🎨 Created</option>
              <option value="purchased">🛍️ Purchased</option>
              <option value="favorited">❤️ Favorited</option>
              <option value="activity">📈 Activity</option>
              <option value="proofs">🛡️ My Proofs</option>
              <option value="bids">📊 My Bids</option>
              <option value="received-bids">🛍️ Received Bids</option>
              <option value="wallet">💰 Wallet</option>
              <option value="social">👥 Social</option>
              <option value="settings">⚙️ Settings</option>
            </select>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>NFTs Created:</span>
                      <span className="font-semibold">{profile?.stats.totalCreated || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>NFTs Purchased:</span>
                      <span className="font-semibold">{profile?.stats.totalPurchased || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credits Earned:</span>
                      <span className="font-semibold">{profile?.stats.totalEarned || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credits Spent:</span>
                      <span className="font-semibold">{profile?.stats.totalSpent || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Favorited NFTs:</span>
                      <span className="font-semibold">{profile?.favoritedNfts?.length || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile?.transactions?.slice(0, 5).map((transaction, index) => {
                      const isPurchase = transaction.buyerId === user.id;
                      return (
                        <div key={`transaction-${transaction.id}-${index}`} className="flex justify-between items-center py-2 border-b last:border-b-0">
                          <div>
                            <p className="font-medium text-sm">
                              {isPurchase ? "Purchased" : "Sold"} NFT #{transaction.nftId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.createdAt || '').toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={isPurchase ? "default" : "secondary"}>
                            {isPurchase ? "-" : "+"}{transaction.price} credits
                          </Badge>
                        </div>
                      );
                    }) || (
                      <p className="text-muted-foreground text-center py-4">No recent activity</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Created Tab */}
            {activeTab === "created" && (
              <div>
                <h3 className="text-xl font-semibold mb-6">Your Created NFTs</h3>
                {profile?.createdNfts?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profile.createdNfts.map((nft, index) => (
                      <NFTProfileCard key={`created-${nft.id}-${index}`} nft={nft} type="created" />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No NFTs Created Yet</h4>
                      <p className="text-gray-600 mb-4">Start creating your first NFT to see it here.</p>
                      <Link href="/upload">
                        <Button>Create Your First NFT</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Purchased Tab */}
            {activeTab === "purchased" && (
              <div>
                <h3 className="text-xl font-semibold mb-6">Your Purchased NFTs</h3>
                {profile?.purchasedNfts?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profile.purchasedNfts.map((nft, index) => (
                      <NFTProfileCard key={`purchased-${nft.id}-${index}`} nft={nft} type="purchased" />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No NFTs Purchased Yet</h4>
                      <p className="text-gray-600 mb-4">Browse the marketplace to discover and purchase amazing NFTs.</p>
                      <Link href="/marketplace">
                        <Button>Browse Marketplace</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Favorited Tab */}
            {activeTab === "favorited" && (
              <div>
                <h3 className="text-xl font-semibold mb-6">Your Favorited NFTs</h3>
                {profile?.favoritedNfts?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profile.favoritedNfts.map((nft, index) => (
                      <NFTProfileCard key={`favorited-${nft.id}-${index}`} nft={nft} type="favorited" />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Favorited NFTs Yet</h4>
                      <p className="text-gray-600 mb-4">Heart NFTs you love to save them here.</p>
                      <Link href="/marketplace">
                        <Button>Discover NFTs</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* My Bids Tab */}
            {activeTab === "bids" && (
              <div>
                <h3 className="text-xl font-semibold mb-6">My Bids</h3>
                <UserBidsSection />
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Development Mode</span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    Transaction hashes are simulated for development. In production, these would be real blockchain transactions.
                  </p>
                </div>
                <h3 className="text-xl font-semibold mb-6">Transaction History</h3>
                {profile?.transactions?.length ? (
                  <div className="space-y-4">
                    {profile.transactions.map((transaction, index) => {
                      const isPurchase = transaction.buyerId === user.id;
                      return (
                        <Card key={`activity-${transaction.id}-${index}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {isPurchase ? (
                                    <ShoppingBag className="h-4 w-4 text-blue-500" />
                                  ) : (
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                  )}
                                  <p className="font-medium">
                                    {isPurchase ? "Purchased" : "Sold"} NFT #{transaction.nftId}
                                  </p>
                                  <Badge variant={isPurchase ? "default" : "secondary"}>
                                    {isPurchase ? "Purchase" : "Sale"}
                                  </Badge>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Amount:</span>
                                    <span className="font-medium">
                                      {isPurchase ? "-" : "+"}{transaction.price} credits
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Date:</span>
                                    <span>{new Date(transaction.createdAt || '').toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Transaction Hash:</span>
                                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                      {transaction.transactionHash || transaction.zkProofHash}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Activity Yet</h4>
                      <p className="text-gray-600">Your transaction history will appear here.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* My Bids Tab */}
            {activeTab === "bids" && (
              <div>
                <UserBidsSection />
              </div>
            )}

            {/* Received Bids Tab */}
            {activeTab === "received-bids" && (
              <div>
                <ReceivedBidsSection />
              </div>
            )}

            {/* My Proofs Tab */}
            {activeTab === "proofs" && (
              <div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Development Mode</span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    These are simulated ZK proofs for development. In production, these would be real SP1 proofs on the blockchain.
                  </p>
                </div>
                <h3 className="text-xl font-semibold mb-6">Your ZK Proofs</h3>
                {profile?.zkProofs?.length ? (
                  profile.zkProofs.map((proof, index) => (
                    <Card key={`proof-${proof.id}-${index}`} className="mb-4">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <p className="font-medium capitalize">
                                {proof.proofType} Proof
                              </p>
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                ZK Verified
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-600">Proof Hash:</span>
                                <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                                  {proof.proofHash}
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Generated:</span>
                                <span className="text-xs">
                                  {new Date(proof.createdAt || '').toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No ZK Proofs Yet</h4>
                      <p className="text-gray-600">Proofs will appear here when you mint or purchase NFTs.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Wallet Tab */}
            {activeTab === "wallet" && (
              <div>
                <h3 className="text-xl font-semibold mb-6">Wallet Details</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Wallet Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm break-all">
                        {user.walletAddress}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => {
                          navigator.clipboard.writeText(user.walletAddress);
                          toast({
                            title: "Copied",
                            description: "Wallet address copied to clipboard",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Address
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Private Key
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {privateKeyError && showPrivateKey && (
                        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <AlertTriangle className="h-4 w-4 inline mr-1" />
                            Session expired. Please log in again to view your private key.
                          </p>
                        </div>
                      )}
                      <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm break-all">
                        {showPrivateKey ? (
                          privateKeyData?.privateKey ? 
                            privateKeyData.privateKey : 
                            privateKeyError ? 'Private key unavailable - please log in again' :
                            'Loading private key...'
                        ) : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setShowPrivateKey(!showPrivateKey)}
                        >
                          {showPrivateKey ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                          {showPrivateKey ? "Hide" : "Show"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={!privateKeyData?.privateKey}
                          onClick={() => {
                            const privateKey = getDecryptedPrivateKey();
                            if (privateKey) {
                              navigator.clipboard.writeText(privateKey);
                              toast({
                                title: "Copied",
                                description: "Private key copied to clipboard",
                              });
                            } else {
                              toast({
                                title: "Error",
                                description: "Private key not available. Please show it first.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Key
                        </Button>
                      </div>
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                        <strong>Warning:</strong> Never share your private key with anyone.
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary mb-2">
                        {user.credits} credits
                      </div>
                      <p className="text-sm text-gray-600">
                        Available for purchasing and minting NFTs
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Social Tab */}
            {activeTab === "social" && (
              <div>
                <h3 className="text-xl font-semibold mb-6">Social Connections</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        X (Twitter)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {user.xConnected ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{user.xUsername}</p>
                            <Badge className="bg-green-100 text-green-800">
                              Connected
                            </Badge>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => disconnectXMutation.mutate()}
                            disabled={disconnectXMutation.isPending}
                          >
                            {disconnectXMutation.isPending ? "Disconnecting..." : "Disconnect"}
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-600 mb-4">Connect your X account to earn bonus credits</p>
                          <Dialog open={xDialogOpen} onOpenChange={setXDialogOpen}>
                            <DialogTrigger asChild>
                              <Button className="w-full">
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Connect X Account
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Connect X Account</DialogTitle>
                                <DialogDescription>
                                  Enter your X username to connect your account and earn 5 bonus credits.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Input
                                  placeholder="Your X username (without @)"
                                  value={xUsername}
                                  onChange={(e) => setXUsername(e.target.value)}
                                />
                                <Button
                                  onClick={() => connectXMutation.mutate(xUsername)}
                                  disabled={!xUsername || connectXMutation.isPending}
                                  className="w-full"
                                >
                                  {connectXMutation.isPending ? "Connecting..." : "Connect Account"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                        Discord
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {user.discordConnected ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{user.discordUsername}</p>
                            <Badge className="bg-green-100 text-green-800">
                              Connected
                            </Badge>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => disconnectDiscordMutation.mutate()}
                            disabled={disconnectDiscordMutation.isPending}
                          >
                            {disconnectDiscordMutation.isPending ? "Disconnecting..." : "Disconnect"}
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-600 mb-4">Connect your Discord account to earn bonus credits</p>
                          <Dialog open={discordDialogOpen} onOpenChange={setDiscordDialogOpen}>
                            <DialogTrigger asChild>
                              <Button className="w-full">
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Connect Discord
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Connect Discord Account</DialogTitle>
                                <DialogDescription>
                                  Enter your Discord username to connect your account and earn 5 bonus credits.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Input
                                  placeholder="Your Discord username"
                                  value={discordUsername}
                                  onChange={(e) => setDiscordUsername(e.target.value)}
                                />
                                <Button
                                  onClick={() => connectDiscordMutation.mutate(discordUsername)}
                                  disabled={!discordUsername || connectDiscordMutation.isPending}
                                  className="w-full"
                                >
                                  {connectDiscordMutation.isPending ? "Connecting..." : "Connect Account"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div>
                <h3 className="text-xl font-semibold mb-6">Account Settings</h3>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-medium mb-2">Profile Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Display Name
                            </label>
                            <Input value={user.displayName} disabled />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Wallet Address
                            </label>
                            <Input value={user.walletAddress} disabled />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-medium mb-2">Preferences</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Email Notifications</p>
                              <p className="text-sm text-gray-600">Receive updates about your NFTs</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Configure
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Privacy Settings</p>
                              <p className="text-sm text-gray-600">Control who can see your profile</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Manage
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}