import { useEffect, useState } from 'react';
import { 
  optimizedRequest, 
  prefetchEndpoint, 
  invalidateCacheForEndpoint, 
  resetRequestCounts,
  configureRequestOptimizer,
  getRequestOptimizerStats
} from '@/lib/requestOptimizer';

/**
 * Hook for optimized API requests
 * Provides a simplified interface for working with the request optimizer
 */
export function useOptimizedRequest() {
  // Helpful status information for debugging
  const [requestStats, setRequestStats] = useState(getRequestOptimizerStats());

  // Reset request counts on unmount (component cleanup)
  useEffect(() => {
    return () => {
      resetRequestCounts();
    };
  }, []);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setRequestStats(getRequestOptimizerStats());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Expose the main functionality
  return {
    /**
     * Execute an optimized request
     */
    request: optimizedRequest,
    
    /**
     * Prefetch an endpoint to have it ready in cache
     */
    prefetch: prefetchEndpoint,
    
    /**
     * Invalidate cache for an endpoint
     */
    invalidateCache: invalidateCacheForEndpoint,
    
    /**
     * Configure the request optimizer
     */
    configure: configureRequestOptimizer,
    
    /**
     * Get current request statistics
     */
    stats: requestStats,
    
    /**
     * Reset throttling counts
     */
    resetCounts: resetRequestCounts,
  };
}

export default useOptimizedRequest;