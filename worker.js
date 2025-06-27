// --- WROKER used in cloudflare for downlaod ---

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (request.method !== "POST") {
      return new Response("Only POST allowed", { status: 405, headers: corsHeaders() });
    }

    try {
      const data = await request.json();

      // --- CLEANUP REQUEST ---
      if (data.action === "cleanup") {
        await cleanupRelease(env);
        return new Response("Cleanup complete", { status: 200, headers: corsHeaders() });
      }

      // --- WRITE selected-pages.json to trigger bundle ---
      const fileUrl =
        "https://api.github.com/repos/Gabriel-Velez/GBE-Deck/contents/bundle-trigger/selected-pages.json";

      const shaRes = await fetch(fileUrl, {
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          "User-Agent": "Cloudflare-Worker",
        },
      });

      let sha;
      if (shaRes.ok) {
        const shaJson = await shaRes.json();
        sha = shaJson.sha;
      }

      const payload = {
        ...data,
        timestamp: Date.now(), // Force file change
        bundleId: data.bundleId || Math.random().toString(36).slice(2, 10),
      };

      const res = await fetch(fileUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": "Cloudflare-Worker",
        },
        body: JSON.stringify({
          message: "Trigger bundle from GBE selector",
          content: btoa(JSON.stringify(payload, null, 2)),
          ...(sha ? { sha } : {}),
          committer: { name: "GBE Bot", email: "actions@github.com" },
        }),
      });

      if (res.ok) {
        return new Response("OK", { status: 200, headers: corsHeaders() });
      }

      const error = await res.text();
      return new Response(error, { status: 500, headers: corsHeaders() });
    } catch (err) {
      return new Response("Error: " + err.message, { status: 500, headers: corsHeaders() });
    }
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// 🧹 CLEANUP: Only remove the release—not the JSON file
async function cleanupRelease(env) {
  const headers = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "User-Agent": "Cloudflare-Worker",
  };

  const releasesRes = await fetch("https://api.github.com/repos/Gabriel-Velez/GBE-Deck/releases", {
    headers,
  });
  const releases = await releasesRes.json();
  const release = releases.find((r) => r.tag_name === "GBE-Custom-Bundle");

  if (release) {
    await fetch(`https://api.github.com/repos/Gabriel-Velez/GBE-Deck/releases/${release.id}`, {
      method: "DELETE",
      headers,
    });
  }

  return true;
}
