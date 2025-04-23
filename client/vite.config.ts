import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
  server: {
    host: "0.0.0.0",
    allowedHosts: [
      // your EC2 public DNS
      "ec2-54-91-85-225.compute-1.amazonaws.com",
      // add other hostnames or domains here if needed
    ],
    // If you ever need to allow *all* hosts (not recommended for production):
    // allowedHosts: "all",
  },
});
