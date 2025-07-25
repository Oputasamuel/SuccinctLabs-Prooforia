import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Grid3X3, List } from "lucide-react";
import NFTCard from "@/components/nft-card";
import NFTDetailPopup from "@/components/nft-detail-popup";
import type { Nft } from "@shared/schema";

interface NftWithCreator extends Nft {
  creator?: {
    id: number;
    username: string;
  } | null;
}

export default function MarketplaceSection() {
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedNft, setSelectedNft] = useState<NftWithCreator | null>(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [defaultTab, setDefaultTab] = useState<string>("overview");
  const [marketFilter, setMarketFilter] = useState<string>("all");

  const handleViewDetails = (nft: NftWithCreator, tab: string = "overview") => {
    setSelectedNft(nft);
    setDefaultTab(tab);
    setShowDetailPopup(true);
  };

  const handleClosePopup = () => {
    setShowDetailPopup(false);
    setSelectedNft(null);
    setDefaultTab("overview");
  };

  const { data: nfts, isLoading } = useQuery<NftWithCreator[]>({
    queryKey: ["/api/nfts", { category: category === "all" || !category ? undefined : category }],
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const { data: listings = [] } = useQuery<any[]>({
    queryKey: ["/api/listings"],
    refetchInterval: 5000,
  });

  const filteredAndSortedNfts = (() => {
    let filtered = nfts || [];
    
    // Filter by category
    if (category !== "all") {
      filtered = filtered.filter(nft => nft.category === category);
    }
    
    // Filter by market status
    if (marketFilter === "listed") {
      const listedNftIds = new Set(listings.map((listing: any) => listing.nftId));
      filtered = filtered.filter(nft => listedNftIds.has(nft.id));
    } else if (marketFilter === "unlisted") {
      const listedNftIds = new Set(listings.map((listing: any) => listing.nftId));
      filtered = filtered.filter(nft => !listedNftIds.has(nft.id));
    }
    
    // Sort NFTs
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "name":
          return a.title.localeCompare(b.title);
        case "oldest":
          return new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime();
        case "recent":
        default:
          return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
      }
    });
  })();

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <Badge variant="secondary" className="bg-primary/10 text-primary mb-4">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Marketplace
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900">Discover ZK-Verified Art</h2>
            <p className="text-gray-600 mt-2">
              Browse and trade NFTs secured by zero-knowledge proofs
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6 md:mt-0 w-full md:w-auto">
            <Select value={marketFilter} onValueChange={setMarketFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All NFTs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All NFTs</SelectItem>
                <SelectItem value="listed">Listed for Sale</SelectItem>
                <SelectItem value="unlisted">Not Listed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Digital Art">Digital Art</SelectItem>
                <SelectItem value="Photography">Photography</SelectItem>
                <SelectItem value="3D Models">3D Models</SelectItem>
                <SelectItem value="Generative Art">Generative Art</SelectItem>
                <SelectItem value="Abstract">Abstract</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Created</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name: A-Z</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="px-3"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="px-3"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* NFT Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-64" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="flex justify-between mb-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedNfts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No NFTs Found</h3>
            <p className="text-gray-600">
              {category !== "all" ? `No NFTs found in ${category} category.` : 
               marketFilter === "listed" ? "No NFTs are currently listed for sale." :
               marketFilter === "unlisted" ? "No unlisted NFTs found." :
               "No NFTs available yet."}
            </p>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 mb-12 ${
              viewMode === "grid" 
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "grid-cols-1"
            }`}>
              {filteredAndSortedNfts.map((nft) => (
                <NFTCard 
                  key={nft.id} 
                  nft={nft} 
                  viewMode={viewMode}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>

            <div className="text-center text-gray-600">
              <p className="mb-2">
                Showing {filteredAndSortedNfts.length} NFTs
                {marketFilter === "listed" && " listed for sale"}
                {marketFilter === "unlisted" && " not listed"}
                {category !== "all" && ` in ${category}`}
              </p>
              <p className="text-sm">
                Sort: {sortBy === "recent" ? "Recently Created" : 
                       sortBy === "oldest" ? "Oldest First" :
                       sortBy === "price-low" ? "Price: Low to High" :
                       sortBy === "price-high" ? "Price: High to Low" :
                       sortBy === "name" ? "Name: A-Z" : "Recent"}
              </p>
            </div>
          </>
        )}

        {/* NFT Detail Popup */}
        <NFTDetailPopup
          nft={selectedNft}
          isOpen={showDetailPopup}
          onClose={handleClosePopup}
          defaultTab={defaultTab}
        />
      </div>
    </section>
  );
}