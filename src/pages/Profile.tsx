import { useEffect } from "react";
import { Navigate } from "react-router-dom";

// This component serves as a fallback for old /profile paths
// It redirects to the new profile structure
export default function Profile() {
  useEffect(() => {
    // Log the redirect for analytics
    console.log("Redirected from legacy Profile page to new structure");
  }, []);

  return <Navigate to="/profile" replace />;
}
