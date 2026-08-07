const hopByHopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
]);

const copyRequestHeaders = (req) => {
  const headers = {};
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (!value) continue;
    if (hopByHopHeaders.has(key.toLowerCase())) continue;
    headers[key] = value;
  }
  return headers;
};

const applyResponseHeaders = (res, upstreamHeaders) => {
  for (const [key, value] of upstreamHeaders.entries()) {
    if (hopByHopHeaders.has(key.toLowerCase())) continue;
    if (key.toLowerCase() === "set-cookie") continue;
    res.setHeader(key, value);
  }

  const getSetCookie = upstreamHeaders.getSetCookie?.bind(upstreamHeaders);
  const cookies = getSetCookie ? getSetCookie() : null;
  if (cookies?.length) {
    res.setHeader("set-cookie", cookies);
  } else {
    const single = upstreamHeaders.get("set-cookie");
    if (single) res.setHeader("set-cookie", single);
  }
};

export const createProxyHandler = (targetBaseUrl) => {
  return async (req, res) => {
    try {
      const url = new URL(req.originalUrl, targetBaseUrl);

      const method = req.method?.toUpperCase() || "GET";
      const headers = copyRequestHeaders(req);

      const init = {
        method,
        headers,
        redirect: "manual",
      };

      if (!["GET", "HEAD"].includes(method)) {
        const contentType = req.headers["content-type"] || "";
        if (contentType.includes("application/json")) {
          init.body = JSON.stringify(req.body ?? {});
          init.headers["content-type"] = "application/json";
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
          init.body = new URLSearchParams(req.body ?? {}).toString();
          init.headers["content-type"] = "application/x-www-form-urlencoded";
        } else if (req.body != null) {
          init.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
        }
      }

      const upstream = await fetch(url, init);

      res.status(upstream.status);
      applyResponseHeaders(res, upstream.headers);

      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.send(buffer);
    } catch (error) {
      res.status(502).json({ message: "Bad gateway", error: error.message });
    }
  };
};

