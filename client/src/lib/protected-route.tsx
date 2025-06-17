import { useAuth } from "@/hooks/use-auth";
import { LoadingScreen } from "@/components/loading-screen";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {isLoading ? (
        <LoadingScreen />
      ) : !user ? (
        <Redirect to="/auth" />
      ) : (
        <Component />
      )}
    </Route>
  );
}