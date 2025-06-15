import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { registerUserSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  walletAddress: string;
  credits: number;
  discordConnected: boolean;
  discordUsername?: string;
  discordAvatar?: string;
  xConnected: boolean;
  xUsername?: string;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = z.infer<typeof registerUserSchema>;

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AuthUser, Error, LoginData>;
  registerMutation: UseMutationResult<AuthUser, Error, RegisterData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  connectDiscordMutation: UseMutationResult<AuthUser, Error, { discordUsername: string; discordAvatar?: string }>;
  connectXMutation: UseMutationResult<AuthUser, Error, { xUsername: string }>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

async function apiRequest(path: string, options?: RequestInit) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  return response.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<AuthUser | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        return await apiRequest("/api/user");
      } catch (error: any) {
        if (error.message.includes('401')) {
          return null;
        }
        throw error;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData): Promise<AuthUser> => {
      const response = await apiRequest("/api/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      return response.user;
    },
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.username}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData): Promise<AuthUser> => {
      const response = await apiRequest("/api/register", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      return response.user;
    },
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Welcome to NFT Lab!",
        description: `Account created successfully. You have ${user.credits} credits to start minting.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await apiRequest("/api/logout", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "See you next time!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const connectDiscordMutation = useMutation({
    mutationFn: async (data: { discordUsername: string; discordAvatar?: string }): Promise<AuthUser> => {
      const response = await apiRequest("/api/connect/discord", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.user;
    },
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Discord connected!",
        description: `+4 credits earned. You now have ${user.credits} credits.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Discord connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const connectXMutation = useMutation({
    mutationFn: async (data: { xUsername: string }): Promise<AuthUser> => {
      const response = await apiRequest("/api/connect/x", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.user;
    },
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "X (Twitter) connected!",
        description: `+6 credits earned. You now have ${user.credits} credits.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "X connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        registerMutation,
        logoutMutation,
        connectDiscordMutation,
        connectXMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}