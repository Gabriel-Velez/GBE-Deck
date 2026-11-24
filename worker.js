const REPOSITORY = "Gabriel-Velez/GBE-Deck";
const WORKFLOW_ID = "bundle-tpz.yml";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return new Response("Only POST allowed", { status: 405, headers: corsHeaders() });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response("Request body must be valid JSON", { status: 400, headers: corsHeaders() });
    }

    const pages = payload?.pages;
    if (
      !Array.isArray(pages) ||
      pages.length === 0 ||
      !pages.every((page) => typeof page === "string" && page.trim())
    ) {
      return new Response("Expected a non-empty pages array", {
        status: 400,
        headers: corsHeaders(),
      });
    }

    const pagesJson = JSON.stringify(pages);
    if (pagesJson.length > 60000) {
      return new Response("Page selection is too large", { status: 413, headers: corsHeaders() });
    }
    if (!env.GITHUB_TOKEN) {
      return new Response("GitHub token is not configured", {
        status: 500,
        headers: corsHeaders(),
      });
    }

    const requestId = crypto.randomUUID();
    let response;
    try {
      response = await fetch(
        `https://api.github.com/repos/${REPOSITORY}/actions/workflows/${WORKFLOW_ID}/dispatches`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            "Content-Type": "application/json",
            "User-Agent": "GBE-Deck-Worker",
            Accept: "application/vnd.github+json",
          },
          body: JSON.stringify({
            ref: "main",
            inputs: {
              pages: pagesJson,
              bundle_id: requestId,
            },
          }),
        }
      );
    } catch (error) {
      return new Response(`GitHub workflow dispatch request failed: ${error.message}`, {
        status: 502,
        headers: corsHeaders(),
      });
    }

    if (!response.ok) {
      return new Response(`GitHub workflow dispatch failed: ${await response.text()}`, {
        status: 502,
        headers: corsHeaders(),
      });
    }

    return new Response(JSON.stringify({ requestId }), {
      status: 202,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
