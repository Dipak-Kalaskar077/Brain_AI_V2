import { QueryClient, QueryFunction } from "@tanstack/react-query";

export async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      errorData = { message: await res.text() || res.statusText };
    }
    throw new Error(`${res.status}: ${JSON.stringify(errorData)}`);
  }
  return res;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    return await throwIfResNotOk(res);
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Handle array queryKeys by building a proper URL
    let url = queryKey[0] as string;
    
    // If we have more items in the queryKey and the second item is not empty
    if (queryKey.length > 1 && queryKey[1] && queryKey[1] !== '') {
      // Append as path params
      const params = queryKey.slice(1);
      url = `${url}/${params.join('/')}`;
    }
    
    const res = await fetch(url, {
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
