import { Hydrate, QueryClientProvider } from "@tanstack/react-query";
import { hydrateRoot } from "react-dom/client";
import { Router } from "wouter";
import { queryClient } from "./src/query-client.ts";
import App from "./src/app.tsx";

declare const __REACT_QUERY_DEHYDRATED_STATE: unknown;

hydrateRoot(
  document,
  <QueryClientProvider client={queryClient}>
    <Hydrate state={__REACT_QUERY_DEHYDRATED_STATE}>
      <Router>
        <App />
      </Router>
    </Hydrate>
  </QueryClientProvider>,
);
