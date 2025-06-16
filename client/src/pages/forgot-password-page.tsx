import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Mail, Key, Check } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const codeSchema = z.object({
  code: z.string().min(6, "Reset code must be 6 digits").max(6, "Reset code must be 6 digits"),
});

const resetSchema = z.object({
  newPassword: z.string().min(4, "Password must be at least 4 characters"),
  confirmPassword: z.string().min(4, "Password must be at least 4 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailFormData = z.infer<typeof emailSchema>;
type CodeFormData = z.infer<typeof codeSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetCode, setResetCode] = useState("");

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const handleEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      if (response.ok) {
        setEmail(data.email);
        setStep("code");
        toast({
          title: "Reset code sent",
          description: "Check your email for the 6-digit reset code",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (data: CodeFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/verify-reset-code", {
        email,
        code: data.code,
      });
      if (response.ok) {
        setResetCode(data.code);
        setStep("password");
        toast({
          title: "Code verified",
          description: "Now enter your new password",
        });
      }
    } catch (error) {
      toast({
        title: "Invalid code",
        description: "Please check your code and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/reset-password", {
        email,
        code: resetCode,
        newPassword: data.newPassword,
      });
      if (response.ok) {
        toast({
          title: "Password reset successful",
          description: "You can now sign in with your new password",
        });
        setLocation("/auth");
      }
    } catch (error) {
      toast({
        title: "Reset failed",
        description: "Failed to reset password. Please try again.",
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
              {step === "email" && <Mail className="h-6 w-6 text-primary" />}
              {step === "code" && <Key className="h-6 w-6 text-primary" />}
              {step === "password" && <Check className="h-6 w-6 text-primary" />}
            </div>
            <CardTitle className="text-2xl">
              {step === "email" && "Reset Password"}
              {step === "code" && "Enter Reset Code"}
              {step === "password" && "Set New Password"}
            </CardTitle>
            <CardDescription>
              {step === "email" && "Enter your email address and we'll send you a reset code"}
              {step === "code" && "Check your email for the 6-digit reset code"}
              {step === "password" && "Enter your new password below"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" && (
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
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
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Code"}
                  </Button>
                </form>
              </Form>
            )}

            {step === "code" && (
              <Form {...codeForm}>
                <form onSubmit={codeForm.handleSubmit(handleCodeSubmit)} className="space-y-4">
                  <FormField
                    control={codeForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reset Code</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            {...field}
                            disabled={isLoading}
                            className="text-center text-lg tracking-wider font-mono"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Verifying..." : "Verify Code"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setStep("email")}
                    disabled={isLoading}
                  >
                    Use Different Email
                  </Button>
                </form>
              </Form>
            )}

            {step === "password" && (
              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-4">
                  <FormField
                    control={resetForm.control}
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
                    control={resetForm.control}
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
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}