import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Gavel, Clock, CheckCircle, X, User, Calendar } from "lucide-react";
import { useState } from "react";

interface Bid {
  id: number;
  nftId: number;
  bidderId: number;
  amount: number;
  isActive: boolean;
  createdAt: string;
  bidder?: {
    id: number;
    displayName: string;
    profilePicture?: string;
  };
}

interface NftWithBids {
  id: number;
  title: string;
  imageUrl: string;
  creatorId: number;
  bids: Bid[];
}

export default function ReceivedBidsSection() {
  const [processingBidId, setProcessingBidId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: userNfts = [], isLoading } = useQuery({
    queryKey: ["/api/user/created-nfts"],
    queryFn: async () => {
      const response = await fetch("/api/user/nfts", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch user NFTs");
      return response.json();
    },
    refetchInterval: 5000,
  });

  const { data: nftsWithBids = [] } = useQuery({
    queryKey: ["/api/nfts-with-bids", userNfts.map((nft: any) => nft.id)],
    queryFn: async () => {
      const nftsWithBidsData: NftWithBids[] = [];
      
      for (const nft of userNfts) {
        try {
          const bidsResponse = await fetch(`/api/nfts/${nft.id}/bids`, {
            credentials: "include",
          });
          
          if (bidsResponse.ok) {
            const bids = await bidsResponse.json();
            const activeBids = bids.filter((bid: Bid) => bid.isActive);
            
            if (activeBids.length > 0) {
              // Fetch bidder details for each bid
              const bidsWithBidders = await Promise.all(
                activeBids.map(async (bid: Bid) => {
                  try {
                    const bidderResponse = await fetch(`/api/users/${bid.bidderId}`, {
                      credentials: "include",
                    });
                    if (bidderResponse.ok) {
                      const bidder = await bidderResponse.json();
                      return { ...bid, bidder };
                    }
                  } catch (error) {
                    console.error(`Error fetching bidder ${bid.bidderId}:`, error);
                  }
                  return bid;
                })
              );
              
              nftsWithBidsData.push({
                ...nft,
                bids: bidsWithBidders.sort((a, b) => b.amount - a.amount), // Sort by highest bid first
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching bids for NFT ${nft.id}:`, error);
        }
      }
      
      return nftsWithBidsData;
    },
    enabled: userNfts.length > 0,
    refetchInterval: 5000,
  });

  const acceptBidMutation = useMutation({
    mutationFn: async (bidId: number) => {
      const response = await fetch(`/api/bids/${bidId}/accept`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to accept bid" }));
        throw new Error(errorData.message);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/created-nfts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nfts-with-bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      
      toast({
        title: "Bid Accepted!",
        description: `Successfully sold NFT for ${data.transaction?.price || 'N/A'} credits. Transaction completed with ZK proof verification.`,
      });
      setProcessingBidId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Accept Bid",
        description: error.message,
        variant: "destructive",
      });
      setProcessingBidId(null);
    },
  });

  const rejectBidMutation = useMutation({
    mutationFn: async (bidId: number) => {
      const response = await fetch(`/api/bids/${bidId}/reject`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to reject bid" }));
        throw new Error(errorData.message);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/created-nfts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nfts-with-bids"] });
      
      toast({
        title: "Bid Rejected",
        description: "The bid has been rejected and removed.",
      });
      setProcessingBidId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Reject Bid",
        description: error.message,
        variant: "destructive",
      });
      setProcessingBidId(null);
    },
  });

  const handleAcceptBid = (bidId: number) => {
    setProcessingBidId(bidId);
    acceptBidMutation.mutate(bidId);
  };

  const handleRejectBid = (bidId: number) => {
    setProcessingBidId(bidId);
    rejectBidMutation.mutate(bidId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (nftsWithBids.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Gavel className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Received Bids</h4>
          <p className="text-gray-600">Bids on your NFTs will appear here for you to accept or reject.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 text-blue-800">
          <Gavel className="w-4 h-4" />
          <span className="text-sm font-medium">Bid Management</span>
        </div>
        <p className="text-xs text-blue-700 mt-1">
          Accept bids to sell your NFTs instantly or reject unwanted offers. All transactions are verified with ZK proofs.
        </p>
      </div>

      {nftsWithBids.map((nft) => (
        <Card key={nft.id} className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <img 
                src={nft.imageUrl} 
                alt={nft.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <h3 className="text-lg font-semibold">{nft.title}</h3>
                <p className="text-sm text-gray-600">{nft.bids.length} active bid{nft.bids.length !== 1 ? 's' : ''}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {nft.bids.map((bid) => (
              <div key={bid.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {bid.bidder?.profilePicture ? (
                          <img 
                            src={bid.bidder.profilePicture} 
                            alt={bid.bidder.displayName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{bid.bidder?.displayName || 'Anonymous Bidder'}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(bid.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {bid.amount} Credits
                      </Badge>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleRejectBid(bid.id)}
                      disabled={processingBidId === bid.id}
                    >
                      {processingBidId === bid.id && rejectBidMutation.isPending ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                      ) : (
                        <X className="w-3 h-3 mr-1" />
                      )}
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleAcceptBid(bid.id)}
                      disabled={processingBidId === bid.id}
                    >
                      {processingBidId === bid.id && acceptBidMutation.isPending ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      ) : (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      )}
                      Accept
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}