import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ShoppingBag, Palette, TrendingUp, Copy, Share, Heart, HeartOff, Settings, Users, Eye, CheckCircle, Link as LinkIcon, ExternalLink, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Nft, Transaction, ZkProof } from "@shared/schema";
import Header from "@/components/header";
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

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [xUsername, setXUsername] = useState("");
  const [xDialogOpen, setXDialogOpen] = useState(false);
  const [discordUsername, setDiscordUsername] = useState("");
  const [discordDialogOpen, setDiscordDialogOpen] = useState(false);

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchIntervalInBackground: true,
  });

  const favoriteMutation = useMutation({
    mutationFn: async ({ nftId, action }: { nftId: number; action: 'add' | 'remove' }) => {
      const response = await apiRequest("POST", `/api/nfts/${nftId}/favorite`, { action });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const connectDiscordMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await apiRequest("POST", "/api/auth/discord/connect", { username });
      return response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setDiscordDialogOpen(false);
      setDiscordUsername("");
      toast({
        title: "Discord Connected!",
        description: "Your Discord account has been successfully connected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Discord Connection Failed",
        description: error.message || "Failed to connect Discord",
        variant: "destructive",
      });
    },
  });

  const connectXMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await apiRequest("POST", "/api/auth/x/connect", { username });
      return response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setXDialogOpen(false);
      setXUsername("");
      toast({
        title: "X Connected!",
        description: "Your X account has been successfully connected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "X Connection Failed",
        description: error.message || "Failed to connect X account",
        variant: "destructive",
      });
    },
  });

  const copyNFTLink = (nftId: number) => {
    const url = `${window.location.origin}/nft/${nftId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "NFT link has been copied to clipboard.",
    });
  };

  const shareToX = (nft: NftWithCreator) => {
    const url = `${window.location.origin}/nft/${nft.id}`;
    const text = `Check out this amazing NFT: "${nft.title}" on SP1Mint! 🎨✨`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to view your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth" className="text-primary hover:underline">
              Go to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        activeTab="marketplace" 
        onTabChange={(tab) => {
          // Navigate back to home page with the selected tab
          const searchParams = new URLSearchParams();
          searchParams.set('tab', tab);
          setLocation(`/?${searchParams.toString()}`);
        }} 
        currentUser={user}
      />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{user.username}</h1>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Wallet className="h-4 w-4" />
                <span className="font-semibold">{user.credits || 0} Credits</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        {/* Profile Sections */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="created" className="text-xs sm:text-sm">Created</TabsTrigger>
            <TabsTrigger value="purchased" className="text-xs sm:text-sm">Purchased</TabsTrigger>
            <TabsTrigger value="favorited" className="text-xs sm:text-sm">Favorited</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs sm:text-sm">Activity</TabsTrigger>
            <TabsTrigger value="proofs" className="text-xs sm:text-sm">My Proofs</TabsTrigger>
            <TabsTrigger value="wallet" className="text-xs sm:text-sm">Wallet</TabsTrigger>
            <TabsTrigger value="social" className="text-xs sm:text-sm">Social</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
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
                  {profile?.transactions?.slice(0, 5).map((transaction) => {
                    const isPurchase = transaction.buyerId === user.id;
                    return (
                      <div key={transaction.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium text-sm">
                            {isPurchase ? "Purchased" : "Sold"} NFT #{transaction.nftId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.createdAt || '').toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={isPurchase ? "destructive" : "default"}>
                          {isPurchase ? '-' : '+'}{transaction.price} Credits
                        </Badge>
                      </div>
                    );
                  }) || (
                    <p className="text-muted-foreground text-center py-4">No recent activity</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="created" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile?.createdNfts?.length ? (
                profile.createdNfts.map((nft) => (
                  <NFTProfileCard 
                    key={nft.id} 
                    nft={nft} 
                    type="created" 
                    onCopyLink={copyNFTLink}
                    onShareToX={shareToX}
                    onToggleFavorite={favoriteMutation.mutate}
                    isFavorited={profile.favoritedNfts?.some(fav => fav.id === nft.id) || false}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">You haven't created any NFTs yet.</p>
                  <Link href="/" className="text-primary hover:underline mt-2 inline-block">
                    Start Creating
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="purchased" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile?.purchasedNfts?.length ? (
                profile.purchasedNfts.map((nft) => (
                  <NFTProfileCard 
                    key={nft.id} 
                    nft={nft} 
                    type="purchased" 
                    onCopyLink={copyNFTLink}
                    onShareToX={shareToX}
                    onToggleFavorite={favoriteMutation.mutate}
                    isFavorited={profile.favoritedNfts?.some(fav => fav.id === nft.id) || false}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">You haven't purchased any NFTs yet.</p>
                  <Link href="/" className="text-primary hover:underline mt-2 inline-block">
                    Browse Marketplace
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="favorited" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile?.favoritedNfts?.length ? (
                profile.favoritedNfts.map((nft) => (
                  <NFTProfileCard 
                    key={nft.id} 
                    nft={nft} 
                    type="favorited" 
                    onCopyLink={copyNFTLink}
                    onShareToX={shareToX}
                    onToggleFavorite={favoriteMutation.mutate}
                    isFavorited={true}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">You haven't favorited any NFTs yet.</p>
                  <Link href="/" className="text-primary hover:underline mt-2 inline-block">
                    Discover NFTs
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-amber-800">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Development Mode</span>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                Transaction hashes and ZK proofs are simulated for development. In production, these would be real blockchain transactions.
              </p>
            </div>
            <div className="space-y-4">
              {profile?.transactions?.length ? (
                profile.transactions.map((transaction) => {
                  const isPurchase = transaction.buyerId === user.id;
                  return (
                    <Card key={transaction.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              <p className="font-medium">
                                {isPurchase ? "Purchased NFT" : "Sold NFT"} #{transaction.nftId}
                              </p>
                              <Badge variant={isPurchase ? "destructive" : "default"}>
                                {isPurchase ? "Purchase" : "Sale"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Transaction ID: #{transaction.id}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.createdAt || '').toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${isPurchase ? 'text-red-500' : 'text-green-500'}`}>
                              {isPurchase ? '-' : '+'}{transaction.price} Credits
                            </p>
                            {transaction.zkProofHash && (
                              <Badge variant="outline" className="mt-1">
                                ZK Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No activity yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your NFT transactions will appear here.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="proofs" className="mt-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-amber-800">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Development Mode</span>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                These are simulated ZK proofs for development. In production, these would be real SP1 proofs on the blockchain.
              </p>
            </div>
            <div className="space-y-4">
              {profile?.zkProofs?.length ? (
                profile.zkProofs.map((proof) => (
                  <Card key={proof.id}>
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
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Proof Hash: <code className="text-xs bg-muted px-1 rounded">{proof.proofHash.slice(0, 16)}...{proof.proofHash.slice(-8)}</code>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Generated: {new Date(proof.createdAt || '').toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Wallet: <code className="text-xs bg-muted px-1 rounded">{user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}</code>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={proof.proofType === "mint" ? "default" : "secondary"}>
                            {proof.proofType === "mint" ? "Minting" : "Transfer"}
                          </Badge>
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(proof.proofHash);
                                toast({ title: "Copied!", description: "Proof hash copied to clipboard." });
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy Hash
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No ZK proofs generated yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Proofs will appear here when you mint or purchase NFTs.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="wallet" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Wallet Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Wallet Address</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-muted rounded text-sm break-all">
                        {user.walletAddress}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(user.walletAddress);
                          toast({ title: "Copied!", description: "Wallet address copied to clipboard." });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Current Balance:</span>
                    <span className="text-2xl font-bold text-primary">{user.credits || 0} Credits</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {profile?.transactions?.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center p-2 rounded border">
                        <div>
                          <p className="text-sm font-medium">
                            {transaction.transactionType === "purchase" ? "Purchase" : "Sale"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.createdAt || '').toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`font-semibold ${transaction.buyerId === user.id ? 'text-red-500' : 'text-green-500'}`}>
                          {transaction.buyerId === user.id ? '-' : '+'}{transaction.price} Credits
                        </span>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-center py-4">No transactions yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="social" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Social Connections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                        <span className="text-white text-sm font-bold">D</span>
                      </div>
                      <div>
                        <p className="font-medium">Discord</p>
                        <p className="text-sm text-muted-foreground">
                          {user.discordConnected ? user.discordUsername || 'Connected' : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.discordConnected ? "default" : "outline"}>
                        {user.discordConnected ? 'Connected' : 'Disconnected'}
                      </Badge>
                      {!user.discordConnected && (
                        <Dialog open={discordDialogOpen} onOpenChange={setDiscordDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <LinkIcon className="h-3 w-3 mr-1" />
                              Connect
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Connect Your Discord Account</DialogTitle>
                              <DialogDescription>
                                Enter your Discord username to connect your account
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Discord Username</label>
                                <Input
                                  placeholder="Enter your Discord username"
                                  value={discordUsername}
                                  onChange={(e) => setDiscordUsername(e.target.value)}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setDiscordDialogOpen(false)}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => connectDiscordMutation.mutate(discordUsername)}
                                  disabled={!discordUsername.trim() || connectDiscordMutation.isPending}
                                  className="flex-1"
                                >
                                  {connectDiscordMutation.isPending ? "Connecting..." : "Connect"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                        <span className="text-white text-sm font-bold">X</span>
                      </div>
                      <div>
                        <p className="font-medium">X (Twitter)</p>
                        <p className="text-sm text-muted-foreground">
                          {user.xConnected ? `@${user.xUsername}` : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.xConnected ? "default" : "outline"}>
                        {user.xConnected ? 'Connected' : 'Disconnected'}
                      </Badge>
                      {!user.xConnected && (
                        <Dialog open={xDialogOpen} onOpenChange={setXDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <LinkIcon className="h-3 w-3 mr-1" />
                              Connect
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Connect Your X Account</DialogTitle>
                              <DialogDescription>
                                Enter your X (Twitter) username to connect your account
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">X Username</label>
                                <Input
                                  placeholder="Enter your X username (without @)"
                                  value={xUsername}
                                  onChange={(e) => setXUsername(e.target.value)}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setXDialogOpen(false)}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => connectXMutation.mutate(xUsername)}
                                  disabled={!xUsername.trim() || connectXMutation.isPending}
                                  className="flex-1"
                                >
                                  {connectXMutation.isPending ? "Connecting..." : "Connect"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Profile Views:</span>
                    <span className="font-semibold">847</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NFTs Shared:</span>
                    <span className="font-semibold">{profile?.stats.totalCreated || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Community Rank:</span>
                    <Badge variant="outline">Creator</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Account Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Username</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={user.username}
                        disabled
                        className="flex-1 p-2 border rounded bg-muted"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="flex-1 p-2 border rounded bg-muted"
                      />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Email Notifications</span>
                    <Badge variant="outline">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Public Profile</span>
                    <Badge variant="outline">Visible</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>NFT Notifications</span>
                    <Badge variant="outline">Enabled</Badge>
                  </div>
                  <Button variant="outline" className="w-full">
                    Update Preferences
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface NFTProfileCardProps {
  nft: NftWithCreator;
  type: "created" | "purchased" | "favorited";
  onCopyLink: (nftId: number) => void;
  onShareToX: (nft: NftWithCreator) => void;
  onToggleFavorite: (data: { nftId: number; action: 'add' | 'remove' }) => void;
  isFavorited: boolean;
}

function NFTProfileCard({ nft, type, onCopyLink, onShareToX, onToggleFavorite, isFavorited }: NFTProfileCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <div className="aspect-square relative overflow-hidden rounded-t-lg">
        <img
          src={nft.imageUrl}
          alt={nft.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute top-2 right-2">
          <Badge variant={type === "created" ? "default" : type === "purchased" ? "secondary" : "outline"}>
            {type === "created" ? "Created" : type === "purchased" ? "Owned" : "Favorited"}
          </Badge>
        </div>
        <div className="absolute top-2 left-2">
          <Button
            size="sm"
            variant={isFavorited ? "default" : "outline"}
            className="h-8 w-8 p-0"
            onClick={() => onToggleFavorite({ 
              nftId: nft.id, 
              action: isFavorited ? 'remove' : 'add' 
            })}
          >
            {isFavorited ? <Heart className="h-4 w-4 fill-current" /> : <HeartOff className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{nft.title}</h3>
        {nft.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {nft.description}
          </p>
        )}
        
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{nft.price} Credits</span>
            <Badge variant="outline" className="text-xs">
              {nft.category}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onCopyLink(nft.id)}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy Link
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onShareToX(nft)}
          >
            <Share className="h-3 w-3 mr-1" />
            Share to X
          </Button>
        </div>

        {(type === "created" || type === "purchased") && (
          <div className="mt-3 pt-3 border-t">
            <Badge variant={nft.isListed ? "default" : "secondary"}>
              {nft.isListed ? "Listed" : "Unlisted"}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}