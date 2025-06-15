import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Wallet, ShoppingBag, Palette, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Nft, Transaction, ZkProof } from "@shared/schema";
import Header from "@/components/header";

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

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-2xl font-bold">{profile?.stats.totalCreated || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Purchased</p>
                  <p className="text-2xl font-bold">{profile?.stats.totalPurchased || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Earned</p>
                  <p className="text-2xl font-bold text-green-500">{profile?.stats.totalEarned || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-500 transform rotate-180" />
                <div>
                  <p className="text-sm text-muted-foreground">Spent</p>
                  <p className="text-2xl font-bold text-red-500">{profile?.stats.totalSpent || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* NFT Collections */}
      <Tabs defaultValue="created" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="created">Created NFTs</TabsTrigger>
          <TabsTrigger value="purchased">Purchased NFTs</TabsTrigger>
        </TabsList>

        <TabsContent value="created" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile?.createdNfts?.length ? (
              profile.createdNfts.map((nft) => (
                <NFTProfileCard key={nft.id} nft={nft} type="created" />
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
                <NFTProfileCard key={nft.id} nft={nft} type="purchased" />
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
      </Tabs>
    </div>
  );
}

function NFTProfileCard({ nft, type }: { nft: NftWithCreator; type: "created" | "purchased" }) {
  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <div className="aspect-square relative overflow-hidden rounded-t-lg">
        <img
          src={nft.imageUrl}
          alt={nft.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute top-2 right-2">
          <Badge variant={type === "created" ? "default" : "secondary"}>
            {type === "created" ? "Created" : "Owned"}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{nft.title}</h3>
        {nft.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {nft.description}
          </p>
        )}
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{nft.price} Credits</span>
            <Badge variant="outline" className="text-xs">
              {nft.category}
            </Badge>
          </div>
          
          <div className="text-xs text-muted-foreground">
            #{nft.currentEdition}/{nft.editionSize}
          </div>
        </div>

        {type === "created" && (
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