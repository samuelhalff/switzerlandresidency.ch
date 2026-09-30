/**
 * Minimal Azure OpenAI chat-completions client (fetch only, no SDK), ported from ark-fid.ch's
 * ai-ressources-update.js: URL normalisation, JSON mode, retry with Retry-After, and the
 * gpt-5 / o-series token-parameter difference.
 */

export function ensureHttpsUrl(input) {
  const raw = String(input || "").trim();
  if (!raw || /^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith("//") ? `https:${raw}` : `https://${raw}`;
}

export function buildChatUrl({ endpoint, deployment, apiVersion }) {
  if (!endpoint) throw new Error("Missing Azure OpenAI endpoint");
  if (!deployment) throw new Error("Missing Azure OpenAI deployment");
  if (!apiVersion) throw new Error("Missing Azure OpenAI api version");
  const u = new URL(ensureHttpsUrl(endpoint));
  if (/\/openai\/deployments\//.test(u.pathname)) {
    u.pathname = u.pathname.replace(/(\/openai\/deployments\/)([^/]+)/, `$1${deployment}`);
    if (!/\/chat\/completions$/.test(u.pathname)) u.pathname = `${u.pathname.replace(/\/+$/, "")}/chat/completions`;
  } else {
    u.pathname = `/openai/deployments/${deployment}/chat/completions`;
  }
  if (!u.searchParams.has("api-version")) u.searchParams.set("api-version", apiVersion);
  return u.toString();
}

/** Reasoning models (gpt-5*, o1/o3/o4) take max_completion_tokens and reject temperature. */
export function isReasoningDeployment(deployment) {
  return /^(gpt-5|o[134])(?:[.\-_]|$)/i.test(String(deployment || "").trim());
}

export function buildChatBody({ deployment, messages, temperature = 0.3, maxTokens, json = true }) {
  const reasoning = isReasoningDeployment(deployment);
  return {
    messages,
    ...(reasoning ? {} : { temperature }),
    ...(json ? { response_format: { type: "json_object" } } : {}),
    ...(maxTokens ? { [reasoning ? "max_completion_tokens" : "max_tokens"]: maxTokens } : {}),
  };
}

/** Parse a JSON object out of a model reply (tolerates code fences and leading prose). */
export function extractJson(text) {
  const raw = String(text ?? "").trim();
  try {
    return JSON.parse(raw);
  } catch {
    const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw)?.[1];
    if (fenced) return JSON.parse(fenced);
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1));
    throw new Error(`Model reply is not JSON: ${raw.slice(0, 200)}`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function configFromEnv(env = process.env, prefix = "AZURE_OPENAI") {
  return {
    endpoint: env[`${prefix}_ENDPOINT`],
    apiKey: env[`${prefix}_API_KEY`],
    deployment: env[`${prefix}_DEPLOYMENT`],
    apiVersion: env[`${prefix}_API_VERSION`],
  };
}

export function hasConfig(cfg) {
  return Boolean(cfg.endpoint && cfg.apiKey && cfg.deployment && cfg.apiVersion);
}

/**
 * Call chat completions and return the parsed JSON object.
 * @param {{ endpoint, apiKey, deployment, apiVersion }} cfg
 */
export async function chatJson(cfg, { system, user, maxTokens = 16000, temperature = 0.3, label = "chat", retries = 5, timeoutMs = 600000 }) {
  const url = buildChatUrl(cfg);
  const body = buildChatBody({
    deployment: cfg.deployment,
    temperature,
    maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  for (let attempt = 1; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": cfg.apiKey },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (attempt <= retries) {
        const delay = Math.min(60000, 2000 * 2 ** (attempt - 1));
        console.warn(`[${label}] fetch error (${err.message}); retry ${attempt}/${retries} in ${delay}ms`);
        await sleep(delay);
        continue;
      }
      throw new Error(`[${label}] Azure OpenAI fetch failed: ${err.message}`);
    }
    clearTimeout(timer);
    const text = await res.text().catch(() => "");
    if (res.ok) {
      const parsed = JSON.parse(text);
      const usage = parsed.usage ? ` tokens in/out ${parsed.usage.prompt_tokens}/${parsed.usage.completion_tokens}` : "";
      const finish = parsed.choices?.[0]?.finish_reason;
      console.log(`[${label}] ok${usage}${finish && finish !== "stop" ? ` finish=${finish}` : ""}`);
      const content = parsed.choices?.[0]?.message?.content;
      if (!content) throw new Error(`[${label}] empty reply (finish=${finish})`);
      return extractJson(content);
    }
    if ([408, 429, 500, 502, 503, 504].includes(res.status) && attempt <= retries) {
      const ms = Number(res.headers.get("x-ms-retry-after-ms"));
      const s = Number(res.headers.get("retry-after"));
      const delay = Number.isFinite(ms) && ms > 0 ? ms : Number.isFinite(s) && s > 0 ? s * 1000 : Math.min(60000, 3000 * 2 ** (attempt - 1));
      console.warn(`[${label}] HTTP ${res.status}; retry ${attempt}/${retries} in ${delay}ms`);
      await sleep(delay);
      continue;
    }
    throw new Error(`[${label}] Azure OpenAI HTTP ${res.status}: ${text.slice(0, 400)}`);
  }
}
