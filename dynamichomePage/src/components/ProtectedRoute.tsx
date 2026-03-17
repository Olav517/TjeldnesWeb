import React from 'react';
import { useAuth } from 'react-oidc-context';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Allow bypassing auth in local development via .env.local
  if (import.meta.env.VITE_DEV_SKIP_AUTH === 'true') {
    return <>{children}</>;
  }

  const auth = useAuth();
  if (!auth.isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <h2>Authentication Required</h2>
        <p>You must be signed in to view this page.</p>
        <button onClick={() => auth.signinRedirect()}>Sign in</button>
      </div>
    );
  }
  return <>{children}</>;
};

export default ProtectedRoute; 