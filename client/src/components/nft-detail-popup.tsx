import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  CheckCircle, 
  Database, 
  Gavel,
  DollarSign,
  Timer,
  Wallet,
  AlertCircle,
  Copy,
  ExternalLink,
  TrendingUp,
  Clock,
  Users
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
  
  if (!currentNft) return null;

  const mintedOutPercentage = (currentNft.currentEdition / currentNft.editionSize) * 100;
  const isMintedOut = mintedOutPercentage >= 100;
  const remainingEditions = currentNft.editionSize - currentNft.currentEdition;

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/nfts/purchase", {
        nftId: currentNft.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Purchase successful!",
        description: `You've successfully purchased ${currentNft.title}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/nfts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Purchase failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Bid mutation
  const bidMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", "/api/bids", {
        nftId: currentNft.id,
        amount,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid placed successfully!",
        description: `Your bid of ${bidAmount} credits has been placed`,
      });
      setBidAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/nfts", currentNft.id, "details"] });
    },
    onError: (error: any) => {
      toast({
        title: "Bid failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Listing mutation
  const createListingMutation = useMutation({
    mutationFn: async (price: number) => {
      const response = await apiRequest("POST", "/api/listings", {
        nftId: currentNft.id,
        price,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Listing created successfully!",
        description: `Your NFT is now listed for ${listingPrice} credits`,
      });
      setListingPrice("");
      queryClient.invalidateQueries({ queryKey: ["/api/nfts", currentNft.id, "details"] });
    },
    onError: (error: any) => {
      toast({
        title: "Listing failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handlePurchase = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to purchase NFTs",
        variant: "destructive",
      });
      return;
    }
    purchaseMutation.mutate();
  };

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
    bidMutation.mutate(amount);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{currentNft.title}</DialogTitle>
          <DialogDescription>
            NFT Details and Marketplace Actions
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image and Basic Info */}
          <div className="space-y-6">
            <div className="relative">
              <img
                src={currentNft.imageUrl}
                alt={currentNft.title}
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
                  #{currentNft.id?.toString().padStart(4, '0') || '0000'}
                </Badge>
              </div>
            </div>

            {/* Edition Progress */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Edition Progress</span>
                    <span className="text-sm text-gray-600">
                      {currentNft.currentEdition} / {currentNft.editionSize}
                    </span>
                  </div>
                  <Progress value={mintedOutPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{Math.round(mintedOutPercentage)}% Minted</span>
                    <span>{remainingEditions} Remaining</span>
                  </div>
                  {isMintedOut && (
                    <Badge variant="destructive" className="w-full justify-center">
                      MINTED OUT
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing Info */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Price</span>
                    <span className="text-lg font-bold">{formatTokens(currentNft.price)}</span>
                  </div>
                  {currentNft.highestBid && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Highest Bid</span>
                      <span className="text-md font-semibold text-green-600">
                        {formatTokens(currentNft.highestBid)}
                      </span>
                    </div>
                  )}
                  {currentNft.lowestListing && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Lowest Listing</span>
                      <span className="text-md font-semibold text-blue-600">
                        {formatTokens(currentNft.lowestListing)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="bids">Bids</TabsTrigger>
                <TabsTrigger value="listings">Listings</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Description</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {currentNft.description || "No description available."}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Creator:</span>
                      <span>{currentNft.creator?.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category:</span>
                      <Badge variant="outline">{currentNft.category}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span>{new Date(currentNft.createdAt || '').toLocaleDateString()}</span>
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

                {/* Purchase/Bid Actions */}
                <div className="space-y-3">
                  {!isMintedOut && currentNft.isListed && (
                    <Button 
                      onClick={handlePurchase}
                      disabled={purchaseMutation.isPending}
                      className="w-full"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {purchaseMutation.isPending ? "Processing..." : `Buy for ${formatTokens(currentNft.price)}`}
                    </Button>
                  )}

                  {/* Bidding */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Enter bid amount"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handlePlaceBid}
                        disabled={bidMutation.isPending || !bidAmount}
                        variant="outline"
                      >
                        <Gavel className="w-4 h-4 mr-2" />
                        {bidMutation.isPending ? "Placing..." : "Place Bid"}
                      </Button>
                    </div>
                  </div>

                  {/* Listing (if owner) */}
                  {currentNft.isOwned && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Enter listing price"
                          value={listingPrice}
                          onChange={(e) => setListingPrice(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={handleCreateListing}
                          disabled={createListingMutation.isPending || !listingPrice}
                          variant="outline"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          {createListingMutation.isPending ? "Listing..." : "List for Sale"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Bids Tab */}
              <TabsContent value="bids" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Current Bids</h3>
                  {currentNft.bids && currentNft.bids.length > 0 ? (
                    <div className="space-y-2">
                      {currentNft.bids.map((bid) => (
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
                    <p className="text-gray-500 text-center py-8">No bids placed yet</p>
                  )}
                </div>
              </TabsContent>

              {/* Listings Tab */}
              <TabsContent value="listings" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Active Listings</h3>
                  {currentNft.listings && currentNft.listings.length > 0 ? (
                    <div className="space-y-2">
                      {currentNft.listings.map((listing) => (
                        <div key={listing.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{formatTokens(listing.price)}</p>
                            <p className="text-xs text-gray-500">
                              Listed {new Date(listing.createdAt || '').toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={listing.isActive ? "default" : "secondary"}>
                            {listing.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No active listings</p>
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
                          by {currentNft.creator?.username} • {new Date(currentNft.createdAt || '').toLocaleDateString()}
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