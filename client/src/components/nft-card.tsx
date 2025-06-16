import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Heart, CheckCircle, Database, ShoppingCart, Eye, Calendar, Hash, Palette, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatTokens } from "@/lib/utils";

import type { Nft } from "@shared/schema";

interface NftWithCreator extends Nft {
  creator?: {
    id: number;
    username: string;
  } | null;
}

interface NFTCardProps {
  nft: NftWithCreator;
  viewMode?: "grid" | "list";
  onViewDetails?: () => void;
}

export default function NFTCard({ nft, viewMode = "grid", onViewDetails }: NFTCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { refreshUser, user } = useAuth();

  // Check if this NFT is in user's favorites
  const { data: profile } = useQuery<{
    favoritedNfts: Nft[];
    createdNfts: Nft[];
    purchasedNfts: Nft[];
    transactions: any[];
    zkProofs: any[];
    stats: any;
  }>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  useEffect(() => {
    if (profile?.favoritedNfts) {
      const isFavorited = profile.favoritedNfts.some((favNft) => favNft.id === nft.id);
      setIsLiked(isFavorited);
    }
  }, [profile, nft.id]);

  const buyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/nfts/${nft.id}/buy`, {
        buyerId: 1, // Mock buyer ID
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Purchase Successful!",
        description: `You successfully purchased ${nft.title}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/nfts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      refreshUser(); // Update user credits in real-time
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase NFT",
        variant: "destructive",
      });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      const action = isLiked ? "remove" : "add";
      const response = await apiRequest("POST", `/api/nfts/${nft.id}/favorite`, { action });
      return response.json();
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: isLiked ? "Removed from Favorites" : "Added to Favorites",
        description: `${nft.title} ${isLiked ? "removed from" : "added to"} your favorites`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update favorites",
        variant: "destructive",
      });
    },
  });

  const handleBuy = () => {
    buyMutation.mutate();
  };

  const toggleLike = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add NFTs to your favorites",
        variant: "destructive",
      });
      return;
    }
    favoriteMutation.mutate();
  };

  if (viewMode === "list") {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="flex">
          <div className="relative w-48 h-48 flex-shrink-0">
            <img
              src={nft.imageUrl}
              alt={nft.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3">
              <Badge className="zk-badge">ZK Verified</Badge>
            </div>
          </div>
          <CardContent className="flex-1 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-xl mb-2">{nft.title}</h3>
                <p className="text-gray-600 text-sm mb-2">by {nft.creator?.username}</p>
                <p className="text-gray-600 mb-4 line-clamp-2">{nft.description}</p>
                
                <div className="flex items-center space-x-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-bold text-lg text-gray-900">{formatTokens(nft.price)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Edition</p>
                    <p className="font-medium text-gray-900">
                      {nft.currentEdition} of {nft.editionSize}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600">ZK Proof Verified</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-blue-600">IPFS</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-3 ml-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLike}
                  className="self-end"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
                </Button>
                <Button
                  onClick={handleBuy}
                  disabled={buyMutation.isPending}
                  className="btn-primary min-w-[120px]"
                >
                  {buyMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Buy Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="nft-card group overflow-hidden relative transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl">
      <div className="relative overflow-hidden">
        <img
          src={nft.imageUrl}
          alt={nft.title}
          className="w-full h-64 object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-75"
        />
        
        {/* Whisper Overlay - Always visible on mobile/tablet, hover on desktop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-500 ease-out">
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-0 md:translate-y-8 md:group-hover:translate-y-0 transition-transform duration-500 ease-out">
            
            {/* Metadata - visible on mobile, appears on hover for desktop */}
            <div className="space-y-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 delay-200">
              <div className="flex items-center space-x-2 text-sm">
                <Hash className="w-4 h-4 text-blue-300" />
                <span className="font-mono text-blue-200">#{nft.id.toString().padStart(4, '0')}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-purple-300" />
                <span className="text-purple-200">
                  {new Date(nft.createdAt || Date.now()).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Palette className="w-4 h-4 text-pink-300" />
                <span className="text-pink-200 capitalize">{nft.category}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Eye className="w-4 h-4 text-green-300" />
                <span className="text-green-200">
                  {Math.floor(Math.random() * 500 + 100)} views
                </span>
              </div>

              {nft.description && (
                <p className="text-gray-300 text-sm mt-3 line-clamp-2 opacity-90">
                  {nft.description}
                </p>
              )}
            </div>
            
            {/* Action buttons - visible on mobile/tablet, appears on hover for desktop */}
            <div className="mt-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-500 delay-300 transform translate-y-0 md:translate-y-4 md:group-hover:translate-y-0 space-y-2">
              <Button
                onClick={handleBuy}
                disabled={buyMutation.isPending}
                className="w-full bg-primary/90 hover:bg-primary backdrop-blur-sm border border-white/20 text-white"
              >
                {buyMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buy for {formatTokens(nft.price)}
                  </>
                )}
              </Button>
              <Button
                onClick={onViewDetails}
                variant="outline"
                className="w-full bg-white/90 hover:bg-white backdrop-blur-sm border border-white/50 text-gray-900"
              >
                <Info className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </div>
          </div>
        </div>

        {/* Static badges */}
        <div className="absolute top-3 left-3 transform transition-all duration-300 group-hover:scale-110">
          <Badge className="zk-badge backdrop-blur-sm bg-emerald-500/90 border border-emerald-400/50">
            <CheckCircle className="w-3 h-3 mr-1" />
            ZK Verified
          </Badge>
        </div>
        
        <div className="absolute top-3 right-3 transform transition-all duration-300 group-hover:scale-110">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLike}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full p-0 hover:bg-white transition-all duration-300 group-hover:bg-pink-50"
          >
            <Heart className={`w-4 h-4 transition-all duration-300 ${
              isLiked 
                ? "fill-red-500 text-red-500 scale-110" 
                : "text-gray-600 group-hover:text-red-400"
            }`} />
          </Button>
        </div>
      </div>

      {/* Card content with subtle animations */}
      <CardContent className="p-6 transition-all duration-300 group-hover:bg-gray-50/50">
        <div className="transition-all duration-300 group-hover:transform group-hover:-translate-y-1">
          <h3 className="font-semibold text-gray-900 mb-2 transition-colors duration-300 group-hover:text-primary">
            {nft.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3 transition-colors duration-300 group-hover:text-gray-700">
            by {nft.creator?.username}
          </p>

          <div className="flex items-center justify-between mb-4">
            <div className="transition-all duration-300 group-hover:transform group-hover:scale-105">
              <p className="text-xs text-gray-500 transition-colors duration-300 group-hover:text-gray-600">Current Price</p>
              <p className="font-bold text-lg text-gray-900 transition-colors duration-300 group-hover:text-primary">
                {formatTokens(nft.price)}
              </p>
            </div>
            <div className="text-right transition-all duration-300 group-hover:transform group-hover:scale-105">
              <p className="text-xs text-gray-500 transition-colors duration-300 group-hover:text-gray-600">Edition</p>
              <p className="font-medium text-gray-900 transition-colors duration-300 group-hover:text-primary">
                {nft.currentEdition} of {nft.editionSize}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-1 transition-all duration-300 group-hover:transform group-hover:scale-105">
              <CheckCircle className="w-4 h-4 text-green-500 transition-all duration-300 group-hover:text-green-600" />
              <span className="text-xs text-green-600 transition-colors duration-300 group-hover:text-green-700">
                ZK Verified
              </span>
            </div>
            <div className="flex items-center space-x-1 transition-all duration-300 group-hover:transform group-hover:scale-105">
              <Database className="w-4 h-4 text-blue-500 transition-all duration-300 group-hover:text-blue-600" />
              <span className="text-xs text-blue-600 transition-colors duration-300 group-hover:text-blue-700">
                IPFS
              </span>
            </div>
          </div>
        </div>
      </CardContent>

    </Card>
  );
}
