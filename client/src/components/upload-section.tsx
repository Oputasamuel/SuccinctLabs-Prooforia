import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Upload, Image, ShieldCheck, Zap, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { validateFileType, validateFileSize } from "@/lib/utils";

import { type AuthUser } from "@/hooks/use-auth";

interface UploadSectionProps {
  currentUser: AuthUser;
}

export default function UploadSection({ currentUser }: UploadSectionProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    editionSize: "1",
    category: "Digital Art",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  const mintMutation = useMutation({
    mutationFn: async (data: { file: File; metadata: any }) => {
      const formData = new FormData();
      formData.append("image", data.file);
      formData.append("title", data.metadata.title);
      formData.append("description", data.metadata.description);
      formData.append("price", data.metadata.price.toString());
      formData.append("editionSize", data.metadata.editionSize.toString());
      formData.append("category", data.metadata.category);
      formData.append("userId", currentUser.id.toString());

      const response = await apiRequest("POST", "/api/nfts/mint", formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "NFT Minted Successfully!",
        description: `Transaction: ${data.transactionHash?.slice(0, 10)}... | Proof: ${data.proofHash?.slice(0, 10)}...`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/nfts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      refreshUser(); // Update user credits in real-time
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Minting Failed",
        description: error.message || "Failed to mint NFT",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!validateFileType(file)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, GIF, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    if (!validateFileSize(file)) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title || !formData.category || !formData.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const mintingCost = 5;
    if ((currentUser.credits || 0) < mintingCost) {
      toast({
        title: "Insufficient Credits",
        description: `You need at least ${mintingCost} credits to mint an NFT.`,
        variant: "destructive",
      });
      return;
    }

    mintMutation.mutate({
      file: selectedFile,
      metadata: {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        editionSize: formData.editionSize,
        category: formData.category,
      },
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      editionSize: "1",
      category: "",
    });
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <section className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="bg-primary/10 text-primary mb-4">
            <Upload className="w-4 h-4 mr-2" />
            Upload Your Art
          </Badge>
          <h2 className="text-3xl font-bold text-gray-900">Create Your ZK-Verified NFT</h2>
          <p className="text-gray-600 mt-4">
            Upload your artwork and mint it with zero-knowledge proof verification
          </p>
          
          {/* User Wallet Info */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Connected as {currentUser.discordUsername}</span>
              <Badge variant="secondary" className="bg-green-100 text-green-600">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{currentUser.credits || 0}</div>
              <div className="text-xs text-gray-600">SP1 Credits</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Upload */}
          <Card>
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary"
                }`}
              >
                <input {...getInputProps()} />
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg mx-auto"
                    />
                    <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetForm();
                      }}
                    >
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Drop your art here
                      </h3>
                      <p className="text-gray-600 mb-4">or click to browse</p>
                      <p className="text-sm text-gray-500">JPG, PNG, GIF, WebP - Max 50MB</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* NFT Details */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">NFT Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Enter NFT title"
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (Credits) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="1"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, price: e.target.value }))
                    }
                    placeholder="Enter price in credits"
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Digital Art">Digital Art</SelectItem>
                      <SelectItem value="Photography">Photography</SelectItem>
                      <SelectItem value="3D Models">3D Models</SelectItem>
                      <SelectItem value="Generative Art">Generative Art</SelectItem>
                      <SelectItem value="Abstract">Abstract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editionSize">Edition Size</Label>
                  <Select
                    value={formData.editionSize}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, editionSize: value }))
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 of 1 (Unique)</SelectItem>
                      <SelectItem value="10">1 of 10</SelectItem>
                      <SelectItem value="100">1 of 100</SelectItem>
                      <SelectItem value="1000">1 of 1000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Describe your artwork..."
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ZK Proof Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">SP1 Zero-Knowledge Proof</h4>
                  <p className="text-sm text-gray-600">
                    Generating cryptographic proof for authenticity
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Proof Generation</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ready
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">IPFS Upload</span>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Blockchain Minting</span>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={mintMutation.isPending || !selectedFile}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center space-x-2"
          >
            {mintMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span>Minting with ZK Proof...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Mint with ZK Proof</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
}
