// ============================================
// ⚠️  SERVER LOGIC MUTED - STATIC MODE ENABLED
// ============================================
// All API routes are commented out.
// The frontend will run in static mode with mock data.
// To re-enable API routes, uncomment the code below.
// ============================================

// import "dotenv/config";
// import express from "express";
// import cors from "cors";
// import { handleDemo } from "./routes/demo";

export function createServer() {
  // Muted server initialization for static frontend mode
  // const app = express();

  // // Middleware
  // app.use(cors());
  // app.use(express.json());
  // app.use(express.urlencoded({ extended: true }));

  // // Example API routes - MUTED
  // app.get("/api/ping", (_req, res) => {
  //   const ping = process.env.PING_MESSAGE ?? "ping";
  //   res.json({ message: ping });
  // });

  // app.get("/api/demo", handleDemo);

  // return app;

  // Stub: Return null or a minimal object for compatibility
  return {} as any;
}
