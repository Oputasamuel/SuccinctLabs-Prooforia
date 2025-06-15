import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Heart, CheckCircle, Database, ShoppingCart } from "lucide-react";
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
}

export default function NFTCard({ nft, viewMode = "grid" }: NFTCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase NFT",
        variant: "destructive",
      });
    },
  });

  const handleBuy = () => {
    buyMutation.mutate();
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
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
    <Card className="nft-card overflow-hidden">
      <div className="relative">
        <img
          src={nft.imageUrl}
          alt={nft.title}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <Badge className="zk-badge">ZK Verified</Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLike}
            className="w-8 h-8 bg-white/90 rounded-full p-0 hover:bg-white"
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
          </Button>
        </div>
      </div>
      <CardContent className="p-6">
        <h3 className="font-semibold text-gray-900 mb-2">{nft.title}</h3>
        <p className="text-gray-600 text-sm mb-3">by {nft.creator?.username}</p>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500">Current Price</p>
            <p className="font-bold text-lg text-gray-900">{formatTokens(nft.price)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Edition</p>
            <p className="font-medium text-gray-900">
              {nft.currentEdition} of {nft.editionSize}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600">ZK Proof Verified</span>
          </div>
          <div className="flex items-center space-x-1">
            <Database className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-blue-600">IPFS</span>
          </div>
        </div>

        <Button
          onClick={handleBuy}
          disabled={buyMutation.isPending}
          className="w-full btn-primary"
        >
          {buyMutation.isPending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            "Buy Now"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
