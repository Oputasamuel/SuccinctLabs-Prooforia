import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await res.json();
        const errorMessage = errorData.message || errorData.error || `HTTP ${res.status}: ${res.statusText}`;
        const error = new Error(errorMessage);
        // Preserve original error data for debugging
        (error as any).originalError = errorData;
        (error as any).status = res.status;
        throw error;
      } else {
        const text = await res.text();
        // If we get HTML (like an error page), extract meaningful error
        if (text.includes("<!DOCTYPE html>")) {
          throw new Error(`Server error (${res.status}). Please check your connection and try again.`);
        }
        throw new Error(text || res.statusText || `HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (parseError) {
      // If parsing fails but we know it's an error response
      if (parseError instanceof Error && parseError.message.startsWith('HTTP')) {
        throw parseError;
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const isFormData = data instanceof FormData;
  
  const res = await fetch(url, {
    method,
    headers: isFormData ? {} : data ? { "Content-Type": "application/json" } : {},
    body: isFormData ? data : data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
