import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Shield, ExternalLink, Clock, RefreshCw, Upload, MessageCircle, Github } from "lucide-react";
import { useLocation } from "wouter";

interface SuccinctProof {
  id: string;
  status: "pending" | "completed" | "failed";
  proof_hash: string;
  proof_type: "mint" | "transfer" | "verification";
  created_at: string;
  metadata?: {
    nft_title?: string;
    wallet_address?: string;
    transaction_hash?: string;
  };
}

interface SuccinctApiResponse {
  proofs: SuccinctProof[];
  total: number;
  page: number;
  limit: number;
}

interface CommunitySectionProps {
  onNavigateToUpload?: () => void;
}

export default function CommunitySection({ onNavigateToUpload }: CommunitySectionProps = {}) {
  const [activeTab, setActiveTab] = useState<"gallery" | "proofs" | "learn" | "contribute">("gallery");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: nfts, isLoading: nftsLoading } = useQuery({
    queryKey: ["/api/nfts"],
  });

  // Fetch proofs from Succinct API with 5-second refresh
  const { data: proofsData, isLoading: proofsLoading, refetch: refetchProofs, dataUpdatedAt } = useQuery<SuccinctApiResponse>({
    queryKey: ["/api/proofs"],
    refetchInterval: 5000, // 5 seconds
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    gcTime: 0, // Don't cache to ensure fresh data (TanStack Query v5)
  });

  // Update last updated timestamp when proofs refresh
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdated(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  const featuredNfts = nfts?.slice(0, 3) || [];

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="bg-primary/10 text-primary mb-4">
            <Users className="w-4 h-4 mr-2" />
            Community & Verification Hub
          </Badge>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Community & Verification Hub
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Explore zero-knowledge proofs, connect with the community, and contribute to the
            future of decentralized art
          </p>
        </div>

        {/* Community Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            {[
              { key: "gallery", label: "Gallery" },
              { key: "proofs", label: "ZK Proofs" },
              { key: "learn", label: "Learn ZK" },
              { key: "contribute", label: "Contribute" },
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Gallery Tab */}
        {activeTab === "gallery" && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Community Gallery</h3>
              <Button variant="outline" className="text-primary border-primary hover:bg-primary hover:text-white">
                Share on X →
              </Button>
            </div>

            {nftsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="w-full h-48" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {featuredNfts.map((nft, index) => (
                  <Card key={nft.id} className="overflow-hidden">
                    <img
                      src={nft.imageUrl}
                      alt={nft.title}
                      className="w-full h-48 object-cover"
                    />
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2 mb-3">
                        {index === 0 && (
                          <Badge className="bg-amber-100 text-amber-800">Featured</Badge>
                        )}
                        {index === 1 && (
                          <Badge className="bg-purple-100 text-purple-800">Most Liked</Badge>
                        )}
                        {index === 2 && (
                          <Badge className="bg-green-100 text-green-800">New Arrival</Badge>
                        )}
                        <Badge className="bg-primary/10 text-primary">ZK Pioneers</Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{nft.title}</h4>
                      <p className="text-gray-600 text-sm">
                        {nft.price} Tokens • {Math.floor(Math.random() * 10)} sales
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Community Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {statsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </div>
                ))
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {stats?.totalNfts || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total NFTs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {stats?.activeArtists || 0}
                    </div>
                    <div className="text-sm text-gray-600">Active Artists</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {stats?.totalVolume || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Volume</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {stats?.communityMembers || 0}
                    </div>
                    <div className="text-sm text-gray-600">Discord Members</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ZK Proofs Tab */}
        {activeTab === "proofs" && (
          <div>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Zero-Knowledge Proofs</h3>
              <p className="text-gray-600 mb-4">
                Live proofs from the Succinct Network - updates every 5 seconds
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchProofs()}
                  disabled={proofsLoading}
                  className="h-8 px-3"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${proofsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {proofsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : proofsData?.proofs && proofsData.proofs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {proofsData.proofs.map((proof) => {
                  const getProofTypeColors = (type: string) => {
                    switch (type) {
                      case 'mint': 
                        return { 
                          bg: 'bg-green-100', 
                          icon: 'text-green-600' 
                        };
                      case 'transfer': 
                        return { 
                          bg: 'bg-blue-100', 
                          icon: 'text-blue-600' 
                        };
                      case 'verification': 
                        return { 
                          bg: 'bg-purple-100', 
                          icon: 'text-purple-600' 
                        };
                      default: 
                        return { 
                          bg: 'bg-gray-100', 
                          icon: 'text-gray-600' 
                        };
                    }
                  };

                  const colors = getProofTypeColors(proof.proof_type);
                  const timeAgo = new Date(proof.created_at).toLocaleString();

                  return (
                    <Card key={proof.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className={`w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center`}>
                            <Shield className={`w-5 h-5 ${colors.icon}`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 capitalize">{proof.proof_type} Proof</h4>
                            <p className="text-sm text-gray-600">
                              {proof.metadata?.nft_title || 'Unknown NFT'}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Proof Hash:</span>
                            <span className="font-mono text-xs">
                              {proof.proof_hash.slice(0, 6)}...{proof.proof_hash.slice(-4)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {proof.proof_type}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <Badge 
                              className={`text-xs ${
                                proof.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : proof.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {proof.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Created:</span>
                            <span className="text-xs">{timeAgo}</span>
                          </div>
                          {proof.metadata?.wallet_address && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Wallet:</span>
                              <span className="font-mono text-xs">
                                {proof.metadata.wallet_address.slice(0, 6)}...{proof.metadata.wallet_address.slice(-4)}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Proofs Found</h4>
                <p className="text-gray-600">No ZK proofs are currently available from the Succinct Network.</p>
              </div>
            )}

            {proofsData?.total && proofsData.total > 6 && (
              <div className="text-center mt-8">
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View All {proofsData.total} Proofs
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Learn ZK Tab */}
        {activeTab === "learn" && (
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Learn Zero-Knowledge Proofs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    What are Zero-Knowledge Proofs?
                  </h4>
                  <p className="text-gray-600 mb-6">
                    Learn the fundamentals of ZK technology and how it enables private,
                    verifiable transactions.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open('https://docs.succinct.xyz/getting-started/what-is-sp1.html', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Read Guide
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    SP1 Documentation
                  </h4>
                  <p className="text-gray-600 mb-6">
                    Dive deep into SP1 zkVM technology and learn how to build with
                    zero-knowledge proofs.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open('https://docs.succinct.xyz/', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Docs
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Contribute Tab */}
        {activeTab === "contribute" && (
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Contribute to the Community</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card>
                <CardContent className="p-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Submit Art</h4>
                  <p className="text-gray-600 mb-6">
                    Share your digital art with the community and showcase the power of ZK
                    verification.
                  </p>
                  <Button 
                    className="btn-primary w-full"
                    onClick={() => onNavigateToUpload?.()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Art
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Join Discord</h4>
                  <p className="text-gray-600 mb-6">
                    Connect with other artists and developers in the Succinct Discord community.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open('https://discord.gg/succinct', '_blank')}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Join Discord
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Contribute Code</h4>
                  <p className="text-gray-600 mb-6">
                    Help build the future of ZK-powered NFTs by contributing to the
                    Succinct open-source project.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open('https://github.com/succinctlabs', '_blank')}
                  >
                    <Github className="w-4 h-4 mr-2" />
                    View GitHub
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
