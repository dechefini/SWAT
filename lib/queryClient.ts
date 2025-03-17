import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { optimizedRequest, clearResponseCache, resetRequestCounts } from "./requestOptimizer";

/**
 * Enhanced error checking for response objects
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to parse JSON error first
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.json();
        console.error("API Error (JSON):", errorData);
        const errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
        throw new Error(`${res.status}: ${errorMessage}`);
      } else {
        // Fallback to text
        const text = await res.text();
        console.error("API Error (Text):", text);
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
    } catch (parseError) {
      // If parsing fails, use status text
      console.error("API Error (Unparseable):", parseError);
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

type RequestConfig = {
  method: string;
  headers?: Record<string, string>;
  body?: string;
};

/**
 * Enhanced API request function with optimization and debugging
 * This is the main function to use for all API requests
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  console.log(`🚀 API Request: ${method} ${url}`);
  try {
    // Use the optimized request function that includes caching, throttling and rate limit handling
    const res = await optimizedRequest(method, url, data);
    console.log(`✅ API Response: ${method} ${url} - Status: ${res.status}`);
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`❌ API Request Failed: ${method} ${url}`, error);
    throw error;
  }
}

/**
 * Direct fetch with minimal processing - use this as a fallback
 * when the optimizer has issues
 */
export async function directApiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  console.log(`🔄 Direct API Request: ${method} ${url}`);
  
  const headers: HeadersInit = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    console.log(`✅ Direct API Response: ${method} ${url} - Status: ${res.status}`);
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`❌ Direct API Request Failed: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Enhanced query function with error handling and request debugging
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    console.log(`🔍 Query: ${url}`, { queryKey });
    
    try {
      // First try with the optimized request
      const res = await optimizedRequest("GET", url);
      
      // Handle unauthorized
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`🔒 Unauthorized access (401) to ${url} - Returning null`);
        return null;
      }
      
      // Check for other errors
      try {
        await throwIfResNotOk(res);
      } catch (error) {
        // Log but don't throw yet - we'll try direct request as fallback
        console.warn(`⚠️ Optimized request failed for ${url}:`, error);
        
        // Try again with direct fetch as fallback
        console.log(`🔄 Trying direct fetch for ${url}`);
        const directRes = await directApiRequest("GET", url);
        await throwIfResNotOk(directRes);
        return await directRes.json();
      }
      
      // If we got here, the optimized request worked
      return await res.json();
    } catch (error) {
      console.error(`❌ Query failed for ${url}:`, error);
      throw error;
    }
  };

/**
 * Reset all caches and counts - use when debugging
 */
export function resetApiState() {
  clearResponseCache();
  resetRequestCounts();
  console.log("API state has been reset");
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 10000, // 10 seconds - shorter while debugging
      retry: 2, // Allow more retries
      retryDelay: 1000, // Wait 1 second between retries
    },
    mutations: {
      retry: 1, // Allow 1 retry for mutations
    },
  },
});