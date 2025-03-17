import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useOptimizedRequest } from '@/hooks/use-optimized-request';

interface PrefetchRule {
  pathname: string | RegExp;
  endpoints: string[];
}

interface DataPrefetcherProps {
  rules: PrefetchRule[];
  children: React.ReactNode;
}

/**
 * Component that prefetches data based on the current route
 * 
 * Example usage:
 * ```tsx
 * <DataPrefetcher
 *   rules={[
 *     {
 *       pathname: '/dashboard',
 *       endpoints: ['/api/events', '/api/users/me']
 *     },
 *     {
 *       pathname: /^\/agencies/,
 *       endpoints: ['/api/agencies']
 *     }
 *   ]}
 * >
 *   <App />
 * </DataPrefetcher>
 * ```
 */
export function DataPrefetcher({ rules, children }: DataPrefetcherProps) {
  const [location] = useLocation();
  const { prefetch } = useOptimizedRequest();

  useEffect(() => {
    // Find matching rules for current location
    const matchingRules = rules.filter(rule => {
      if (typeof rule.pathname === 'string') {
        return location === rule.pathname;
      } else if (rule.pathname instanceof RegExp) {
        return rule.pathname.test(location);
      }
      return false;
    });

    // Prefetch data for all matching rules
    if (matchingRules.length > 0) {
      const endpoints = matchingRules
        .flatMap(rule => rule.endpoints)
        .filter((endpoint, index, self) => self.indexOf(endpoint) === index);

      // Handle endpoints with path parameters
      const processedEndpoints = endpoints.map(endpoint => {
        // Check if it contains a path parameter like {agencyId}
        if (endpoint.includes('{') && endpoint.includes('}')) {
          // Extract parameter names from current location
          const pathSegments = location.split('/');
          
          // Replace path parameters with actual values
          let processedEndpoint = endpoint;
          
          // Common parameter: agencyId
          if (processedEndpoint.includes('{agencyId}')) {
            // Find agencyId in the URL - it's usually the last part of paths like /swat/equipment/:agencyId
            const agencyIdMatch = location.match(/\/([^\/]+)$/);
            if (agencyIdMatch && agencyIdMatch[1]) {
              processedEndpoint = processedEndpoint.replace('{agencyId}', agencyIdMatch[1]);
            } else {
              // If we can't find the parameter, skip this endpoint
              return null;
            }
          }
          
          // Add more parameter replacements as needed
          return processedEndpoint;
        }
        return endpoint;
      }).filter(Boolean) as string[]; // Filter out null values and cast to string[]

      // Stagger prefetch requests to avoid network congestion
      processedEndpoints.forEach((endpoint, index) => {
        setTimeout(() => {
          if (endpoint) prefetch(endpoint);
        }, index * 100); // 100ms delay between prefetches
      });
    }
  }, [location, rules, prefetch]);

  return <>{children}</>;
}

export default DataPrefetcher;