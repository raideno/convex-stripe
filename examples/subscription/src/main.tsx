import "./index.css";

import "@radix-ui/themes/styles.css";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { Theme } from "@radix-ui/themes";
import { ConvexReactClient } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";

import App from "./app";

import { Toaster } from "./components/ui/sooner";

const address = import.meta.env.VITE_CONVEX_URL;

const convex = new ConvexReactClient(address);

const container = document.getElementById("root")!;

const root = createRoot(container);

root.render(
  <StrictMode>
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <div className="p-4 bg-red-100 text-red-800 rounded">
          <h2 className="text-lg font-bold mb-2">An error occurred:</h2>
          <pre className="whitespace-pre-wrap">{JSON.stringify(error)}</pre>
        </div>
      )}
    >
      <ConvexAuthProvider client={convex}>
        <Theme appearance="dark">
          <App />
          <Toaster />
        </Theme>
      </ConvexAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
