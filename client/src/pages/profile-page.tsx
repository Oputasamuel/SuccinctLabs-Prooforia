import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Wallet, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Coins, 
  Shield,
  Twitter,
  MessageCircle,
  Plus,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import { useLocation } from "wouter";

const discordSchema = z.object({
  discordUsername: z.string().min(1, "Discord username is required"),
  discordAvatar: z.string().optional(),
});

const xSchema = z.object({
  xUsername: z.string().min(1, "X username is required"),
});

type DiscordFormData = z.infer<typeof discordSchema>;
type XFormData = z.infer<typeof xSchema>;

interface WalletDetails {
  address: string;
  publicKey: string;
  privateKey: string;
}

export default function ProfilePage() {
  const { user, connectDiscordMutation, connectXMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const discordForm = useForm<DiscordFormData>({
    resolver: zodResolver(discordSchema),
    defaultValues: {
      discordUsername: "",
      discordAvatar: "",
    },
  });

  const xForm = useForm<XFormData>({
    resolver: zodResolver(xSchema),
    defaultValues: {
      xUsername: "",
    },
  });

  const { data: walletDetails, isLoading: walletLoading } = useQuery<WalletDetails>({
    queryKey: ["/api/wallet"],
    queryFn: async () => {
      const response = await fetch("/api/wallet");
      if (!response.ok) {
        throw new Error("Failed to fetch wallet details");
      }
      return response.json();
    },
    enabled: !!user,
  });

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copied!",
        description: `${field} copied to clipboard`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleConnectDiscord = (data: DiscordFormData) => {
    connectDiscordMutation.mutate(data);
  };

  const handleConnectX = (data: XFormData) => {
    connectXMutation.mutate(data);
  };

  const handleTabChange = (tab: "marketplace" | "community" | "upload") => {
    if (tab === "marketplace") {
      setLocation("/");
    } else if (tab === "community") {
      setLocation("/?tab=community");
    } else if (tab === "upload") {
      setLocation("/?tab=upload");
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        activeTab="marketplace" 
        onTabChange={handleTabChange} 
        currentUser={user}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Profile</h1>
            <div className="flex items-center justify-center space-x-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{user.username}</p>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Credits Balance</CardTitle>
                    <Coins className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{user.credits}</div>
                    <p className="text-xs text-muted-foreground">
                      Available for minting NFTs
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Wallet</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-mono">
                      {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ethereum address
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ZK Proofs</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Verified</div>
                    <p className="text-xs text-muted-foreground">
                      SP1 integration active
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Social Connections</CardTitle>
                  <CardDescription>
                    Connect your social accounts to earn bonus credits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Discord</p>
                        <p className="text-sm text-muted-foreground">+4 credits</p>
                      </div>
                    </div>
                    {user.discordConnected ? (
                      <Badge variant="secondary">
                        Connected: {user.discordUsername}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not connected</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Twitter className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="font-medium">X (Twitter)</p>
                        <p className="text-sm text-muted-foreground">+6 credits</p>
                      </div>
                    </div>
                    {user.xConnected ? (
                      <Badge variant="secondary">
                        Connected: {user.xUsername}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not connected</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wallet" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Wallet Details</CardTitle>
                  <CardDescription>
                    Your auto-generated Ethereum wallet for NFT transactions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {walletLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading wallet details...</span>
                    </div>
                  ) : walletDetails ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Wallet Address</Label>
                        <div className="flex items-center space-x-2">
                          <Input 
                            value={walletDetails.address} 
                            readOnly 
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(walletDetails.address, "Wallet Address")}
                          >
                            {copiedField === "Wallet Address" ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://etherscan.io/address/${walletDetails.address}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Public Key</Label>
                        <div className="flex items-center space-x-2">
                          <Input 
                            value={walletDetails.publicKey} 
                            readOnly 
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(walletDetails.publicKey, "Public Key")}
                          >
                            {copiedField === "Public Key" ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Private Key</Label>
                        <div className="flex items-center space-x-2">
                          <Input 
                            type={showPrivateKey ? "text" : "password"}
                            value={walletDetails.privateKey} 
                            readOnly 
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPrivateKey(!showPrivateKey)}
                          >
                            {showPrivateKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(walletDetails.privateKey, "Private Key")}
                          >
                            {copiedField === "Private Key" ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Keep your private key secure. Never share it with anyone.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Unable to load wallet details</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                      <span>Discord</span>
                    </CardTitle>
                    <CardDescription>
                      Connect your Discord account to earn 4 bonus credits
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {user.discordConnected ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary">Connected</Badge>
                          <span className="text-sm">{user.discordUsername}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          You've already earned your Discord bonus credits!
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={discordForm.handleSubmit(handleConnectDiscord)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="discord-username">Discord Username</Label>
                          <Input
                            id="discord-username"
                            placeholder="YourDiscordName#1234"
                            {...discordForm.register("discordUsername")}
                          />
                          {discordForm.formState.errors.discordUsername && (
                            <p className="text-sm text-destructive">
                              {discordForm.formState.errors.discordUsername.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="discord-avatar">Avatar URL (optional)</Label>
                          <Input
                            id="discord-avatar"
                            placeholder="https://cdn.discordapp.com/avatars/..."
                            {...discordForm.register("discordAvatar")}
                          />
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={connectDiscordMutation.isPending}
                        >
                          {connectDiscordMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Connect Discord (+4 credits)
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Twitter className="h-5 w-5 text-blue-400" />
                      <span>X (Twitter)</span>
                    </CardTitle>
                    <CardDescription>
                      Connect your X account to earn 6 bonus credits
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {user.xConnected ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary">Connected</Badge>
                          <span className="text-sm">{user.xUsername}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          You've already earned your X bonus credits!
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={xForm.handleSubmit(handleConnectX)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="x-username">X Username</Label>
                          <Input
                            id="x-username"
                            placeholder="@YourUsername"
                            {...xForm.register("xUsername")}
                          />
                          {xForm.formState.errors.xUsername && (
                            <p className="text-sm text-destructive">
                              {xForm.formState.errors.xUsername.message}
                            </p>
                          )}
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={connectXMutation.isPending}
                        >
                          {connectXMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Connect X (+6 credits)
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Your account details and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Username</Label>
                      <p className="text-sm text-muted-foreground mt-1">{user.username}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label>Account Status</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary">Active</Badge>
                      <span className="text-sm text-muted-foreground">
                        All features unlocked
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}