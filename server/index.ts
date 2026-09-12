import "dotenv/config";
import app from "./app";

// Dedicated env var (not PORT) so this doesn't collide with the Vite dev server's
// own PORT when both run under the same `npm run dev` process tree.
const PORT = Number(process.env.API_PORT) || 4000;
app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
