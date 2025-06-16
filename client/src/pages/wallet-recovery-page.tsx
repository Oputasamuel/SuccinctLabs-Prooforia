import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Key, Wallet, Shield } from "lucide-react";

const recoverySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  privateKey: z.string().min(64, "Private key must be at least 64 characters").max(66, "Private key is too long"),
  newPassword: z.string().min(4, "Password must be at least 4 characters"),
  confirmPassword: z.string().min(4, "Password must be at least 4 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RecoveryFormData = z.infer<typeof recoverySchema>;

export default function WalletRecoveryPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RecoveryFormData>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      email: "",
      privateKey: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleRecovery = async (data: RecoveryFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/wallet-recovery", {
        email: data.email,
        privateKey: data.privateKey,
        newPassword: data.newPassword,
      });

      if (response.ok) {
        toast({
          title: "Account recovered successfully",
          description: "You can now sign in with your new password",
        });
        setLocation("/auth");
      }
    } catch (error: any) {
      toast({
        title: "Recovery failed",
        description: error.message || "Private key verification failed. Please check your details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link to="/auth">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign In
            </Button>
          </Link>
        </div>

        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Wallet Recovery</CardTitle>
            <CardDescription>
              Recover your account using your wallet private key
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleRecovery)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="privateKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Wallet Private Key
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your wallet private key (0x...)"
                          className="font-mono text-sm"
                          rows={3}
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Your private key is encrypted and never stored on our servers
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter new password"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Recover Account"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">How to find your private key:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Check your wallet backup files</li>
                <li>• Look for your seed phrase backup</li>
                <li>• Export from MetaMask or other wallets</li>
                <li>• Check secure password managers</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}