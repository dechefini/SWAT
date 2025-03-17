import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

type AccessControl = {
  // Role-based access - 'admin', 'agency', or both allowed
  roles?: ('admin' | 'agency')[];
  // Features required - optional features that must be enabled for the user
  requiredFeatures?: ('tracking')[];
};

export function ProtectedRoute({
  path,
  component: Component,
  accessControl,
}: {
  path: string;
  component: () => React.JSX.Element;
  accessControl?: AccessControl;
}) {
  return (
    <Route path={path}>
      {() => {
        const { user, isLoading } = useAuth();
        const [, setLocation] = useLocation();

        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        // Redirect to login if not authenticated
        if (!user) {
          return <Redirect to="/auth" />;
        }

        // Access control based on roles and features
        if (accessControl) {
          // Check if user has required role
          if (accessControl.roles && !accessControl.roles.includes(user.role)) {
            console.log(`Access denied for ${path}: User role ${user.role} not in allowed roles`, accessControl.roles);
            // Redirect based on role
            if (user.role === 'agency') {
              return <Redirect to="/admin/dashboard" />;
            }
            return <Redirect to="/admin/dashboard" />;
          }

          // Check if user has required features
          // For tracking pages: admins always have access
          // Agency users need either tracking interface type OR premium access
          if (accessControl.requiredFeatures?.includes('tracking') && 
              user.role !== 'admin' && 
              user.interfaceType !== 'tracking' && 
              !user.premiumAccess) {
            console.log(`Access denied for ${path}: User doesn't have required tracking permissions. User:`, {
              role: user.role,
              interfaceType: user.interfaceType,
              premiumAccess: user.premiumAccess
            });
            return <Redirect to="/admin/dashboard" />;
          }
        }

        // Check if the path is a SWAT tracking page and the user doesn't have access
        // Admins always have access to SWAT tracking pages
        // Users with premiumAccess OR interfaceType tracking should also have access 
        if (path.startsWith('/swat/') && 
            user.role !== 'admin' && 
            user.interfaceType !== 'tracking' && 
            !user.premiumAccess) {
          console.log(`Access denied for ${path}: SWAT tracking access required. User permissions:`, {
            role: user.role,
            interfaceType: user.interfaceType,
            premiumAccess: user.premiumAccess
          });
          return <Redirect to="/admin/dashboard" />;
        }

        // User has access, render the component
        return <Component />;
      }}
    </Route>
  );
}