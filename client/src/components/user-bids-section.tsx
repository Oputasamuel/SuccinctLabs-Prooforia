import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gavel, Clock, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";

interface Bid {
  id: number;
  nftId: number;
  amount: number;
  isActive: boolean;
  createdAt: string;
}

interface NftWithBid extends Bid {
  nft?: {
    id: number;
    title: string;
    imageUrl: string;
    creator: {
      id: number;
      username: string;
    };
  };
}

export default function UserBidsSection() {
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "outbid">("all");

  const { data: userBids = [], isLoading } = useQuery<Bid[]>({
    queryKey: ["/api/user/bids"],
    refetchInterval: 5000,
  });

  const { data: nftDetails = {} } = useQuery({
    queryKey: ["/api/nfts/details", userBids.map(bid => bid.nftId).sort().join(",")],
    queryFn: async () => {
      const details: Record<number, any> = {};
      const uniqueNftIds = Array.from(new Set(userBids.map(bid => bid.nftId)));
      
      for (const nftId of uniqueNftIds) {
        try {
          const response = await fetch(`/api/nfts/${nftId}`);
          if (response.ok) {
            const nft = await response.json();
            details[nftId] = nft;
          }
        } catch (error) {
          console.error(`Error fetching NFT ${nftId}:`, error);
        }
      }
      return details;
    },
    enabled: userBids.length > 0,
  });

  const { data: currentHighestBids = {} } = useQuery({
    queryKey: ["/api/nfts/highest-bids", userBids.map(bid => bid.nftId).sort().join(",")],
    queryFn: async () => {
      const highestBids: Record<number, number> = {};
      const uniqueNftIds = Array.from(new Set(userBids.map(bid => bid.nftId)));
      
      for (const nftId of uniqueNftIds) {
        try {
          const response = await fetch(`/api/nfts/${nftId}/bids`);
          if (response.ok) {
            const bids = await response.json();
            if (bids.length > 0) {
              highestBids[nftId] = Math.max(...bids.map((b: Bid) => b.amount));
            }
          }
        } catch (error) {
          console.error(`Error fetching bids for NFT ${nftId}:`, error);
        }
      }
      return highestBids;
    },
    enabled: userBids.length > 0,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const bidsWithNftData: NftWithBid[] = useMemo(() => 
    userBids.map((bid: Bid) => ({
      ...bid,
      nft: nftDetails[bid.nftId],
    })), [userBids, nftDetails]
  );

  const filteredBids = useMemo(() => 
    bidsWithNftData.filter((bid) => {
      const isHighestBid = currentHighestBids[bid.nftId] === bid.amount;
      
      switch (activeFilter) {
        case "active":
          return bid.isActive && isHighestBid;
        case "outbid":
          return bid.isActive && !isHighestBid;
        default:
          return true;
      }
    }), [bidsWithNftData, currentHighestBids, activeFilter]
  );

  const activeBidsCount = useMemo(() => 
    bidsWithNftData.filter((bid) => 
      bid.isActive && currentHighestBids[bid.nftId] === bid.amount
    ).length, [bidsWithNftData, currentHighestBids]
  );

  const outbidCount = useMemo(() => 
    bidsWithNftData.filter((bid) => 
      bid.isActive && currentHighestBids[bid.nftId] !== bid.amount
    ).length, [bidsWithNftData, currentHighestBids]
  );

  return (
    <div className="space-y-6" key="user-bids-section">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2" key="filter-tabs">
        <Button
          variant={activeFilter === "all" ? "default" : "outline"}
          onClick={() => setActiveFilter("all")}
          className="flex items-center gap-2"
        >
          <Gavel className="h-4 w-4" />
          All Bids ({bidsWithNftData.length})
        </Button>
        <Button
          variant={activeFilter === "active" ? "default" : "outline"}
          onClick={() => setActiveFilter("active")}
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Highest Bids ({activeBidsCount})
        </Button>
        <Button
          variant={activeFilter === "outbid" ? "default" : "outline"}
          onClick={() => setActiveFilter("outbid")}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Outbid ({outbidCount})
        </Button>
      </div>

      {/* Bids List */}
      {filteredBids.length > 0 ? (
        <div className="grid gap-4" key="bids-list">
          {filteredBids.map((bid, index) => {
            const isHighestBid = currentHighestBids[bid.nftId] === bid.amount;
            const currentHighest = currentHighestBids[bid.nftId] || 0;
            
            return (
              <Card key={`bid-${bid.id}-${bid.nftId}-${index}`} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* NFT Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      {bid.nft?.imageUrl ? (
                        <img
                          src={bid.nft.imageUrl}
                          alt={bid.nft.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Bid Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold truncate">
                          {bid.nft?.title || `NFT #${bid.nftId}`}
                        </h4>
                        <Badge
                          variant={isHighestBid ? "default" : "secondary"}
                          className={isHighestBid ? "bg-green-500" : ""}
                        >
                          {isHighestBid ? "Highest Bid" : "Outbid"}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        by {bid.nft?.creator?.username || "Unknown Artist"}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium">
                            Your Bid: {bid.amount} credits
                          </span>
                          {!isHighestBid && currentHighest > 0 && (
                            <span className="text-red-600">
                              Current: {currentHighest} credits
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {new Date(bid.createdAt).toLocaleDateString()}
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
        <div className="text-center py-12">
          <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {activeFilter === "all" 
              ? "You haven't placed any bids yet"
              : activeFilter === "active"
              ? "You don't have any active highest bids"
              : "You don't have any outbid items"
            }
          </p>
          <p className="text-sm text-gray-500">
            Explore the marketplace and place bids on NFTs you love!
          </p>
        </div>
      )}
    </div>
  );
}