import { useAuthenticator } from '@aws-amplify/ui-react';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { authStatus } = useAuthenticator();
  if (authStatus !== 'authenticated') {
    // Redirect to Cognito Hosted UI
    window.location.assign('/login');
    return null;
  }
  return <>{children}</>;
}
