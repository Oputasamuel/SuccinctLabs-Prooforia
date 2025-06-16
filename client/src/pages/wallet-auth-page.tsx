import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Redirect } from "wouter";
import Header from "@/components/header";

const createAccountSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(50, "Display name too long"),
  profilePicture: z.string().optional(),
});

const loginSchema = z.object({
  privateKey: z.string().min(1, "Private key is required"),
});

type CreateAccountData = z.infer<typeof createAccountSchema>;
type LoginData = z.infer<typeof loginSchema>;

interface WalletCreationResponse {
  user: any;
  privateKey: string;
  message: string;
}

export default function WalletAuthPage() {
  const [activeTab, setActiveTab] = useState<"create" | "login">("create");
  const [createdWallet, setCreatedWallet] = useState<{ privateKey: string; user: any } | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createForm = useForm<CreateAccountData>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      displayName: "",
      profilePicture: "",
    },
  });

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      privateKey: "",
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: CreateAccountData) => {
      const res = await apiRequest("POST", "/api/wallet/create-account", data);
      return await res.json() as WalletCreationResponse;
    },
    onSuccess: (data) => {
      setCreatedWallet({ privateKey: data.privateKey, user: data.user });
      queryClient.setQueryData(["/api/user"], data.user);
      toast({
        title: "Account Created!",
        description: "Your wallet has been generated. Please save your private key securely.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Account Creation Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await apiRequest("POST", "/api/wallet/login", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data.user);
      toast({
        title: "Login Successful",
        description: "Welcome back to SP1Mint!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid private key or account not found",
        variant: "destructive",
      });
    },
  });

  const handleCreateAccount = (data: CreateAccountData) => {
    createAccountMutation.mutate(data);
  };

  const handleLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const copyPrivateKey = () => {
    if (createdWallet?.privateKey) {
      navigator.clipboard.writeText(createdWallet.privateKey);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Private key copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Check if user is already logged in
  const userData = queryClient.getQueryData(["/api/user"]);
  if (userData) {
    return <Redirect to="/" />;
  }

  if (createdWallet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <Header activeTab="marketplace" onTabChange={() => {}} />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-primary">Account Created Successfully!</CardTitle>
                <CardDescription>
                  Your wallet has been generated. Please save your private key securely - this is your only way to access your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertDescription className="text-orange-800">
                    <strong>Important:</strong> Your private key is the only way to access your account. Store it in a secure location and never share it with anyone.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Your Private Key</Label>
                  <div className="relative">
                    <Textarea
                      value={createdWallet.privateKey}
                      readOnly
                      className="font-mono text-sm pr-20"
                      type={showPrivateKey ? "text" : "password"}
                      rows={3}
                    />
                    <div className="absolute right-2 top-2 flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                      >
                        {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={copyPrivateKey}
                        disabled={copied}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <h3 className="font-medium text-foreground">Account Details:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Display Name:</span>
                      <p>{createdWallet.user.displayName}</p>
                    </div>
                    <div>
                      <span className="font-medium">Wallet Address:</span>
                      <p className="font-mono text-xs break-all">{createdWallet.user.walletAddress}</p>
                    </div>
                    <div>
                      <span className="font-medium">Credits:</span>
                      <p>{createdWallet.user.credits}</p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => setCreatedWallet(null)} 
                  className="w-full"
                  size="lg"
                >
                  Continue to SP1Mint
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Header activeTab="marketplace" onTabChange={() => {}} />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Form */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">
                Welcome to SP1Mint
              </h1>
              <p className="text-muted-foreground">
                Create your account or login with your wallet private key
              </p>
            </div>

            <Card className="border-2 border-primary/20">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "create" | "login")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create">Create Account</TabsTrigger>
                    <TabsTrigger value="login">Login</TabsTrigger>
                  </TabsList>

                  <TabsContent value="create" className="space-y-4">
                    <form onSubmit={createForm.handleSubmit(handleCreateAccount)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          {...createForm.register("displayName")}
                          placeholder="Enter your display name"
                        />
                        {createForm.formState.errors.displayName && (
                          <p className="text-sm text-destructive">
                            {createForm.formState.errors.displayName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profilePicture">Profile Picture URL (Optional)</Label>
                        <Input
                          id="profilePicture"
                          {...createForm.register("profilePicture")}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <Alert>
                        <AlertDescription>
                          Creating an account will generate a new Ethereum wallet. You'll receive a private key that's your only way to access this account.
                        </AlertDescription>
                      </Alert>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        size="lg"
                        disabled={createAccountMutation.isPending}
                      >
                        {createAccountMutation.isPending ? "Creating Account..." : "Create Account & Generate Wallet"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="login" className="space-y-4">
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="privateKey">Private Key</Label>
                        <Textarea
                          id="privateKey"
                          {...loginForm.register("privateKey")}
                          placeholder="Enter your wallet private key"
                          className="font-mono"
                          rows={3}
                        />
                        {loginForm.formState.errors.privateKey && (
                          <p className="text-sm text-destructive">
                            {loginForm.formState.errors.privateKey.message}
                          </p>
                        )}
                      </div>

                      <Alert>
                        <AlertDescription>
                          Enter the private key from your wallet to access your account. Never share your private key with anyone.
                        </AlertDescription>
                      </Alert>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        size="lg"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Signing In..." : "Login with Private Key"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Hero */}
          <div className="text-center lg:text-left space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">
                Decentralized NFT Marketplace
              </h2>
              <p className="text-lg text-muted-foreground">
                Create, mint, and trade NFTs with zero-knowledge proof technology using SP1 zkVM.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-2">🔐 Wallet-Only Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  No passwords or emails. Your wallet private key is your only authentication method.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-2">⚡ Zero-Knowledge Proofs</h3>
                <p className="text-sm text-muted-foreground">
                  Every NFT transaction is verified with SP1 zkVM for privacy and authenticity.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-2">🎨 Create & Trade</h3>
                <p className="text-sm text-muted-foreground">
                  Mint your digital art, set editions, and trade in our secure marketplace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}