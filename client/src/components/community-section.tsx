import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Shield, ExternalLink } from "lucide-react";

export default function CommunitySection() {
  const [activeTab, setActiveTab] = useState<"gallery" | "proofs" | "learn" | "contribute">("gallery");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: nfts, isLoading: nftsLoading } = useQuery({
    queryKey: ["/api/nfts"],
  });

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
              <p className="text-gray-600 mb-8">
                Explore the latest ZK proofs generated on the platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sample ZK Proof entries */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Mint Proof</h4>
                      <p className="text-sm text-gray-600">SP1 Circuit Dreams</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Proof Hash:</span>
                      <span className="font-mono text-xs">0x7a8b...9c2d</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <Badge variant="outline" className="text-xs">NFT Mint</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Transfer Proof</h4>
                      <p className="text-sm text-gray-600">Digital Abstraction #1</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Proof Hash:</span>
                      <span className="font-mono text-xs">0x3f5e...1a8b</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <Badge variant="outline" className="text-xs">Transfer</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Mint Proof</h4>
                      <p className="text-sm text-gray-600">Quantum Mesh</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Proof Hash:</span>
                      <span className="font-mono text-xs">0x9d2c...4e7f</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <Badge variant="outline" className="text-xs">NFT Mint</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Verification Proof</h4>
                      <p className="text-sm text-gray-600">Neon Cityscape</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Proof Hash:</span>
                      <span className="font-mono text-xs">0x6b1a...8f3c</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <Badge variant="outline" className="text-xs">Verification</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Mint Proof</h4>
                      <p className="text-sm text-gray-600">Ethereal Waves</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Proof Hash:</span>
                      <span className="font-mono text-xs">0x2e4d...7c9a</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <Badge variant="outline" className="text-xs">NFT Mint</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Transfer Proof</h4>
                      <p className="text-sm text-gray-600">Fractured Reality</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Proof Hash:</span>
                      <span className="font-mono text-xs">0x5a7f...3b8e</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <Badge variant="outline" className="text-xs">Transfer</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                View All Proofs
              </Button>
            </div>
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
                  <Button variant="outline" className="w-full">
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
                  <Button variant="outline" className="w-full">
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
                  <Button className="btn-primary w-full">Upload Art</Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Join Discord</h4>
                  <p className="text-gray-600 mb-6">
                    Connect with other artists and developers in our Discord community.
                  </p>
                  <Button variant="outline" className="w-full">
                    Join Discord
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Contribute Code</h4>
                  <p className="text-gray-600 mb-6">
                    Help build the future of ZK-powered NFTs by contributing to our
                    open-source project.
                  </p>
                  <Button variant="outline" className="w-full">
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
