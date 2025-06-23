import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "react-oidc-context";
import "./index.css";

const cognitoAuthConfig = {
  authority: "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_ETCFkPKDJ",
  client_id: "1q6dmagqniqskhlhcdp41ermtt",
  redirect_uri: "http://localhost:5173/",
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
