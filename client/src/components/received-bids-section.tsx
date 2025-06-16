import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, User } from "lucide-react";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";

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
  const { toast } = useToast();

  const { data: nftsWithBids = [], isLoading } = useQuery<NftWithBids[]>({
    queryKey: ["/api/user/received-bids"],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/received-bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      
      toast({
        title: "Bid Accepted",
        description: "The bid has been accepted and payment transferred.",
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
      queryClient.invalidateQueries({ queryKey: ["/api/user/received-bids"] });
      
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Received Bids</h3>
        <Badge variant="secondary" className="ml-2">
          {nftsWithBids.reduce((total, nft) => total + nft.bids.length, 0)} Total Bids
        </Badge>
      </div>

      {nftsWithBids.length > 0 ? (
        <div className="space-y-6">
          {nftsWithBids.map((nft) => (
            <Card key={nft.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={nft.imageUrl}
                      alt={nft.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{nft.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {nft.bids.length} active bid{nft.bids.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {nft.bids.map((bid) => (
                  <div
                    key={bid.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary text-white">
                          {bid.bidder?.displayName?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {bid.bidder?.displayName || `User #${bid.bidderId}`}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {bid.amount} credits
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(bid.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectBid(bid.id)}
                        disabled={processingBidId === bid.id}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptBid(bid.id)}
                        disabled={processingBidId === bid.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No bids received yet</p>
          <p className="text-sm text-gray-500">
            When users place bids on your NFTs, they'll appear here for you to accept or reject.
          </p>
        </div>
      )}
    </div>
  );
}