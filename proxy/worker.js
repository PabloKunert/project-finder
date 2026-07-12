/**
 * Cloudflare Worker — Anthropic API proxy for BidRoute
 *
 * Deploy steps:
 *   1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
 *   2. Paste this file, click Save & Deploy — name it "bidroute-proxy"
 *   3. Settings → Variables → add Secret: ANTHROPIC_API_KEY = sk-ant-...
 *   4. Copy the worker URL (e.g. https://bidroute-proxy.YOUR_NAME.workers.dev)
 *   5. Paste it as PROXY_URL in index.html
 *
 * Or deploy via CLI:
 *   npx wrangler deploy proxy/worker.js --name bidroute-proxy
 *   npx wrangler secret put ANTHROPIC_API_KEY --name bidroute-proxy
 */

const ALLOWED_ORIGIN = "https://pablokunert.github.io";
const ANTHROPIC_API  = "https://api.anthropic.com/v1/messages";

const CORS = {
  "Access-Control-Allow-Origin":  ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age":       "86400",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const body = await request.text();

    const upstream = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body,
    });

    const text = await upstream.text();

    return new Response(text, {
      status:  upstream.status,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  },
};
