import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Wallet, Zap, Users } from "lucide-react";
import { registerUserSchema } from "@shared/schema";
import Header from "@/components/header";
import { useLocation, Link } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerUserSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [, setLocation] = useLocation();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const handleRegister = (data: RegisterFormData) => {
    // Exclude confirmPassword when sending to API
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Header 
        activeTab="marketplace" 
        onTabChange={handleTabChange} 
        currentUser={null}
      />
      <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Auth forms */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent">
              SP1Mint
            </h1>
            <p className="text-muted-foreground mt-2">
              Zero-knowledge proof powered NFT minting platform
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>
                    Sign in to your account to continue creating and trading NFTs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        {...loginForm.register("email")}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                    
                    <div className="text-center">
                      <Link to="/forgot-password">
                        <Button variant="link" className="text-sm text-muted-foreground hover:text-primary">
                          Forgot your password?
                        </Button>
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create your account</CardTitle>
                  <CardDescription>
                    Join SP1Mint and create NFTs with zero-knowledge proof technology
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Username</Label>
                      <Input
                        id="register-username"
                        placeholder="Choose a username"
                        {...registerForm.register("username")}
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="Enter your email"
                        {...registerForm.register("email")}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create a password"
                        {...registerForm.register("password")}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password">Confirm Password</Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        {...registerForm.register("confirmPassword")}
                      />
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right side - Hero section */}
        <div className="hidden lg:block">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-foreground">
                Zero-Knowledge NFTs
              </h2>
              <p className="text-xl text-muted-foreground">
                Create, mint, and trade digital art with cryptographic proof
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
              <div className="flex items-center space-x-4 p-4 bg-card rounded-lg border">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Auto Wallet Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Get your Ethereum wallet automatically
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-card rounded-lg border">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">10 Free Credits</h3>
                  <p className="text-sm text-muted-foreground">
                    Start minting NFTs immediately
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-card rounded-lg border">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Social Rewards</h3>
                  <p className="text-sm text-muted-foreground">
                    +4 credits for Discord, +6 for X
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-primary/10 via-pink-500/10 to-primary/10 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Powered by SP1 zkVM</h3>
              <p className="text-sm text-muted-foreground">
                Every NFT mint and transfer is secured with zero-knowledge proofs, 
                ensuring privacy and authenticity without compromising transparency.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}