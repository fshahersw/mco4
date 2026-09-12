// Vercel serverless entry: the entire Express API served as one catch-all
// function. Routes are defined with their /api prefix in server/app.ts, and
// Vercel forwards the original /api/* path to this function, so Express matches
// them directly. An Express app instance is itself a (req, res) handler, which
// is exactly what the Vercel Node runtime expects as the default export.
import app from "../server/app";

export default app;
