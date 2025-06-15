import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ShoppingBag, Palette, TrendingUp, Copy, Share, Heart, HeartOff } from "lucide-react";
import { Link } from "wouter";
import { Nft, Transaction, ZkProof } from "@shared/schema";
import Header from "@/components/header";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
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
        onTabChange={() => {}} 
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

        {/* NFT Collections */}
        <Tabs defaultValue="created" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="created">Created NFTs</TabsTrigger>
            <TabsTrigger value="purchased">Purchased NFTs</TabsTrigger>
            <TabsTrigger value="favorited">Favorited NFTs</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

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
            <div className="space-y-4">
              {profile?.transactions?.length ? (
                profile.transactions.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {transaction.transactionType === "purchase" ? "Purchased" : "Sold"} NFT
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.price} Credits
                          </p>
                        </div>
                        <Badge variant="outline">
                          {new Date(transaction.createdAt || '').toLocaleDateString()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No activity yet.</p>
                </div>
              )}
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