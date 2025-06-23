export function signOutRedirect() {
  const clientId = "1q6dmagqniqskhlhcdp41ermtt";
  const logoutUri = window.location.origin + "/";
  const cognitoDomain = "https://tjeldnes-web-webapp.auth.eu-central-1.amazoncognito.com";
  window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
} 