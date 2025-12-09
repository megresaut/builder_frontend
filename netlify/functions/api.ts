// ============================================
// ⚠️  NETLIFY SERVERLESS MUTED - STATIC MODE
// ============================================
// The Netlify serverless function is muted.
// The frontend will run as a static SPA without server dependencies.
// To re-enable the serverless function, uncomment the code below.
// ============================================

// import serverless from "serverless-http";

// import { createServer } from "../../server";

// export const handler = serverless(createServer());

// Stub handler for static mode
export const handler = async (event: any) => {
  return {
    statusCode: 404,
    body: JSON.stringify({
      error: "API endpoints are disabled in static mode",
    }),
  };
};
