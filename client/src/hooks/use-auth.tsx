import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export type AuthUser = User;

type WalletLoginData = {
  walletPrivateKey: string;
};

type CreateAccountData = {
  displayName: string;
  profilePicture?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  walletLoginMutation: UseMutationResult<AuthUser, Error, WalletLoginData>;
  createAccountMutation: UseMutationResult<AuthUser, Error, CreateAccountData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  connectDiscordMutation: UseMutationResult<AuthUser, Error, { discordUsername: string; discordAvatar?: string }>;
  connectXMutation: UseMutationResult<AuthUser, Error, { xUsername: string }>;
  refreshUser: () => void;
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

  return await response.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<AuthUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const response = await fetch("/api/user", {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.status === 401) {
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.warn('Authentication request timed out');
          return null;
        }
        if (error.message.includes("401") || error.message.includes("Not authenticated")) {
          return null;
        }
        console.error('Auth query error:', error);
        return null;
      }
    },
    retry: false, // Don't retry auth checks
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false,
    gcTime: 10 * 60 * 1000 // 10 minutes garbage collection
  });

  const walletLoginMutation = useMutation({
    mutationFn: async (credentials: WalletLoginData): Promise<AuthUser> => {
      const response = await fetch("/api/wallet/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privateKey: credentials.walletPrivateKey }),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Login failed" }));
        throw new Error(errorData.message);
      }
      
      const data = await response.json();
      return data.user;
    },
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(["/api/user"], user);
      // Invalidate and refetch to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.displayName}`,
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

  const createAccountMutation = useMutation({
    mutationFn: async (credentials: CreateAccountData): Promise<AuthUser> => {
      const response = await fetch("/api/wallet/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Account creation failed" }));
        throw new Error(errorData.message);
      }
      
      const data = await response.json();
      return data.user;
    },
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Welcome to prooforia!",
        description: `Account created successfully. You have ${user.credits} credits to start minting.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Account creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
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
      const response = await fetch("/api/connect/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Discord connection failed" }));
        throw new Error(errorData.message);
      }
      
      const result = await response.json();
      return result.user;
    },
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Discord Connected!",
        description: `Connected Discord account: ${user.discordUsername}. You earned 5 bonus credits!`,
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
      const response = await fetch("/api/connect/x", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "X connection failed" }));
        throw new Error(errorData.message);
      }
      
      const result = await response.json();
      return result.user;
    },
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "X Connected!",
        description: `Connected X account: ${user.xUsername}. You earned 5 bonus credits!`,
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

  const refreshUser = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        walletLoginMutation,
        createAccountMutation,
        logoutMutation,
        connectDiscordMutation,
        connectXMutation,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Return default values instead of throwing error during development
    return {
      user: null,
      isLoading: false,
      error: null,
      walletLoginMutation: { mutate: () => {}, isPending: false } as any,
      createAccountMutation: { mutate: () => {}, isPending: false } as any,
      logoutMutation: { mutate: () => {}, isPending: false } as any,
      connectDiscordMutation: { mutate: () => {}, isPending: false } as any,
      connectXMutation: { mutate: () => {}, isPending: false } as any,
      refreshUser: () => {},
    };
  }
  return context;
}