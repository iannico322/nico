import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Loader from "../../components/loader/loader";
import { isAdmin, getHomePath } from "./roles";

interface AdminRouteProps {
  children: React.ReactNode;
}

// Same as ProtectedRoute, but also requires acc_lvl === 0. A logged-in
// non-admin gets bounced to their own dashboard, not to the login page.
const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/nico/login" replace />;
  if (!isAdmin(user)) return <Navigate to={getHomePath(user)} replace />;

  return <>{children}</>;
};

export default AdminRoute;
