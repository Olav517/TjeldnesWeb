import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "react-oidc-context";
import "./index.css";

const origin = window.location.origin;

const env = (window as Window & typeof globalThis & { __env__?: Record<string, string> }).__env__ ?? {};

const cognitoAuthConfig = {
  authority: env.COGNITO_AUTHORITY || "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_ETCFkPKDJ",
  client_id: env.COGNITO_CLIENT_ID || "1q6dmagqniqskhlhcdp41ermtt",
  redirect_uri: origin + "/",
  response_type: "code",
  scope: "email openid profile",
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
