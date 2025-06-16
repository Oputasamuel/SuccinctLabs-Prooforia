import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { formatTokens } from "@/lib/utils";
import { 
  Heart, 
  ShoppingCart, 
  TrendingUp, 
  Clock, 
  Users, 
  CheckCircle, 
  Database, 
  Gavel,
  DollarSign,
  Timer,
  Trophy,
  Wallet,
  AlertCircle,
  Copy,
  ExternalLink
} from "lucide-react";
import type { Nft, Listing, Bid, NftOwnership } from "@shared/schema";

interface NftWithExtras extends Nft {
  creator?: {
    id: number;
    username: string;
  } | null;
  listings?: Listing[];
  bids?: Bid[];
  ownerships?: NftOwnership[];
  isOwned?: boolean;
  isMintedOut?: boolean;
  highestBid?: number;
  lowestListing?: number;
}

interface NFTDetailPopupProps {
  nft: NftWithExtras | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NFTDetailPopup({ nft, isOpen, onClose }: NFTDetailPopupProps) {
  const [bidAmount, setBidAmount] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch detailed NFT data when popup opens
  const { data: nftDetails, isLoading } = useQuery<NftWithExtras>({
    queryKey: ["/api/nfts", nft?.id, "details"],
    enabled: isOpen && !!nft?.id,
    refetchInterval: 5000,
  });

  const currentNft = nftDetails || nft;
  const mintedOutPercentage = currentNft ? (currentNft.currentEdition / currentNft.editionSize) * 100 : 0;
  const isMintedOut = mintedOutPercentage >= 100;
  const remainingEditions = currentNft ? currentNft.editionSize - currentNft.currentEdition : 0;

  // Place bid mutation
  const placeBidMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", "/api/bids", {
        nftId: nft!.id,
        amount,
      });
      return res;
    },
    onSuccess: () => {
      toast({ title: "Bid placed successfully!" });
      setBidAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/nfts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place bid",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: async (price: number) => {
      const res = await apiRequest("POST", "/api/listings", {
        nftId: nft!.id,
        price,
      });
      return res;
    },
    onSuccess: () => {
      toast({ title: "NFT listed for sale!" });
      setListingPrice("");
      queryClient.invalidateQueries({ queryKey: ["/api/nfts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create listing",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Buy from listing mutation
  const buyFromListingMutation = useMutation({
    mutationFn: async (listingId: number) => {
      const res = await apiRequest("POST", `/api/listings/${listingId}/buy`);
      return res;
    },
    onSuccess: () => {
      toast({ title: "Purchase successful!" });
      queryClient.invalidateQueries({ queryKey: ["/api/nfts"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Buy new mint mutation
  const buyNewMintMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/nfts/buy", { nftId: nft!.id });
      return res;
    },
    onSuccess: () => {
      toast({ title: "NFT minted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/nfts"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Minting failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePlaceBid = () => {
    const amount = parseInt(bidAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid bid amount",
        description: "Please enter a valid bid amount",
        variant: "destructive",
      });
      return;
    }
    placeBidMutation.mutate(amount);
  };

  const handleCreateListing = () => {
    const price = parseInt(listingPrice);
    if (!price || price <= 0) {
      toast({
        title: "Invalid listing price",
        description: "Please enter a valid listing price",
        variant: "destructive",
      });
      return;
    }
    createListingMutation.mutate(price);
  };

  if (!nft) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{displayNft.title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image and Basic Info */}
          <div className="space-y-6">
            <div className="relative">
              <img
                src={displayNft.imageUrl}
                alt={displayNft.title}
                className="w-full rounded-lg shadow-lg"
              />
              <div className="absolute top-4 left-4">
                <Badge className="bg-emerald-500/90 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  ZK Verified
                </Badge>
              </div>
              <div className="absolute top-4 right-4">
                <Badge variant="outline" className="bg-white/90">
                  #{displayNft.id?.toString().padStart(4, '0') || '0000'}
                </Badge>
              </div>
            </div>

            {/* Edition Progress */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Edition Progress</span>
                  <span className="text-sm text-gray-600">
                    {displayNft.currentEdition} / {displayNft.editionSize}
                  </span>
                </div>
                <Progress value={mintedOutPercentage} className="mb-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Minted: {displayNft.currentEdition}</span>
                  <span className={isMintedOut ? "text-red-600 font-medium" : "text-green-600"}>
                    {isMintedOut ? "MINTED OUT" : `${remainingEditions} Available`}
                  </span>
                  <span>Total: {displayNft.editionSize}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Original Price</p>
                      <p className="font-semibold">{formatTokens(displayNft.price)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <div>
                      <p className="text-xs text-gray-500">Highest Bid</p>
                      <p className="font-semibold">
                        {displayNft.highestBid ? formatTokens(displayNft.highestBid) : "No bids"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Tabs and Actions */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="bids">Bids</TabsTrigger>
                <TabsTrigger value="listings">Listings</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-600 text-sm">{displayNft.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Creator:</span>
                      <span>{displayNft.creator?.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category:</span>
                      <Badge variant="outline">{displayNft.category}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span>{new Date(displayNft.createdAt || '').toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Blockchain:</span>
                      <div className="flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        <span>Ethereum</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {!isMintedOut && (
                    <Button
                      onClick={() => buyNewMintMutation.mutate()}
                      disabled={buyNewMintMutation.isPending}
                      className="w-full"
                    >
                      {buyNewMintMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Mint for {formatTokens(displayNft.price)}
                        </>
                      )}
                    </Button>
                  )}

                  {user && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => setActiveTab("bids")}>
                        <Gavel className="w-4 h-4 mr-2" />
                        Place Bid
                      </Button>
                      <Button variant="outline">
                        <Heart className="w-4 h-4 mr-2" />
                        Favorite
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Bids Tab */}
              <TabsContent value="bids" className="space-y-4">
                {user && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Place a Bid</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Bid Amount (Credits)</label>
                        <Input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder="Enter bid amount..."
                          min="1"
                        />
                      </div>
                      <Button
                        onClick={handlePlaceBid}
                        disabled={placeBidMutation.isPending}
                        className="w-full"
                      >
                        {placeBidMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <>
                            <Gavel className="w-4 h-4 mr-2" />
                            Place Bid
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <div>
                  <h3 className="font-semibold mb-3">Current Bids</h3>
                  {displayNft.bids && displayNft.bids.length > 0 ? (
                    <div className="space-y-2">
                      {displayNft.bids.map((bid) => (
                        <div key={bid.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{formatTokens(bid.amount)}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(bid.createdAt || '').toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline">Active</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No bids placed yet.</p>
                  )}
                </div>
              </TabsContent>

              {/* Listings Tab */}
              <TabsContent value="listings" className="space-y-4">
                {user && displayNft.isOwned && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">List for Sale</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Listing Price (Credits)</label>
                        <Input
                          type="number"
                          value={listingPrice}
                          onChange={(e) => setListingPrice(e.target.value)}
                          placeholder="Enter listing price..."
                          min="1"
                        />
                      </div>
                      <Button
                        onClick={handleCreateListing}
                        disabled={createListingMutation.isPending}
                        className="w-full"
                      >
                        {createListingMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Create Listing
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <div>
                  <h3 className="font-semibold mb-3">Active Listings</h3>
                  {displayNft.listings && displayNft.listings.length > 0 ? (
                    <div className="space-y-2">
                      {displayNft.listings.map((listing) => (
                        <div key={listing.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{formatTokens(listing.price)}</p>
                            <p className="text-xs text-gray-500">
                              Listed {new Date(listing.createdAt || '').toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => buyFromListingMutation.mutate(listing.id)}
                            disabled={buyFromListingMutation.isPending}
                          >
                            Buy Now
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No active listings.</p>
                  )}
                </div>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">NFT Created</p>
                        <p className="text-xs text-gray-500">
                          by {displayNft.creator?.username} • {new Date(displayNft.createdAt || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}