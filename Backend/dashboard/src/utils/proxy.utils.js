import config from "../config/config.js";

export const toPublicError = (error) => {
  const statusCode = error.statusCode || 500;
  const upstream = error.data;
  const message =
    statusCode < 500 && typeof upstream?.message === "string"
      ? upstream.message
      : statusCode === 502
        ? "Bad gateway."
        : statusCode < 500
          ? "Request failed."
          : "Internal server error.";

  const response = { message };
  if (statusCode < 500 && Array.isArray(upstream?.errors)) {
    response.errors = upstream.errors.map(({ msg, path }) => ({ msg, path }));
  }
  return response;
};

// Render can take longer than a minute to wake a sleeping instance.
// Retries server-side prevent browser timeouts. (Sum = 60s)
export const RENDER_COLD_START_DELAYS_MS = [2000, 4000, 8000, 16000, 30000];

export const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export const isRenderColdStartResponse = async (response) => {
  if (response.status !== 429 || typeof response.clone !== "function") return false;

  const copy = response.clone();
  const body = await copy.text().catch(() => "");
  const contentType = copy.headers?.get?.("content-type") || "";

  return (
    !contentType.toLowerCase().includes("application/json") &&
    /too many requests|rate limit/i.test(body)
  );
};

export const fetchWithColdStartRetry = async (url, options) => {
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(url, options);
    const shouldRetry = await isRenderColdStartResponse(response);

    if (!shouldRetry || attempt === RENDER_COLD_START_DELAYS_MS.length) {
      return response;
    }

    const retryAfterSeconds = Number(response.headers?.get?.("retry-after"));
    const retryAfterMs =
      Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? retryAfterSeconds * 1000
        : 0;
    await wait(Math.max(RENDER_COLD_START_DELAYS_MS[attempt], retryAfterMs));
  }
};

export const fetchAuctionSnapshot = async (auctionId) => {
  const url = new URL(`/api/auctions/${auctionId}`, config.AUCTIONS_SERVICE_URL);
  const response = await fetchWithColdStartRetry(url, { method: "GET" });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Auction service returned HTTP ${response.status}.`);
  }

  const data = await response.json().catch(() => null);
  const auction = data?.auction || data;
  if (!auction) return null;

  return {
    title: auction.title || "",
    images: auction.images || [],
    image: auction.image || auction.images?.[0]?.url || "",
    currentBid: auction.currentBid ?? auction.currentPrice ?? 0,
    startingBid: auction.startingBid ?? auction.price ?? 0,
    price: auction.price ?? 0,
    status: auction.status || "",
    startAuctionAt: auction.startAuctionAt ? new Date(auction.startAuctionAt) : undefined,
    endAuctionAt: auction.endAuctionAt ? new Date(auction.endAuctionAt) : undefined,
  };
};

export const forwardPublicRequest = async (req, url) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetchWithColdStartRetry(url, {
    method: req.method,
    headers: headers,
    ...(req.method !== "GET" && req.method !== "HEAD" && { body: JSON.stringify(req.body) }),
  });

  let data;
  if (typeof response.text !== "function") {
    data = await response.json();
  } else {
    const rawBody = await response.text();
    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      data = {
        message: `The downstream service returned a non-JSON response (status ${response.status}).`,
        upstreamResponse: rawBody.slice(0, 500),
      };
    }
  }
  if (!response.ok) {
    const targetOrigin = new URL(url).origin;
    const serviceName =
      targetOrigin === new URL(config.AUTH_SERVICE_URL).origin
        ? "Auth"
        : targetOrigin === new URL(config.AUCTIONS_SERVICE_URL).origin
          ? "Auctions"
          : targetOrigin === new URL(config.INVENTORY_SERVICE_URL).origin
            ? "Inventory"
            : "Downstream";
    const errorMessage = data.message || `Failed to fetch data from ${serviceName} service at ${url}.`;
    console.error(`Error forwarding public request to ${url}: ${errorMessage} (Status: ${response.status})`);
    const error = new Error(errorMessage);
    error.data = data;
    error.statusCode = response.status;
    throw error;
  }
  return data;
};

export const forwardRequest = async (req, url) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
    throw error;
  }

  const response = await fetchWithColdStartRetry(url, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(req.method !== "GET" && req.method !== "HEAD" && { body: JSON.stringify(req.body) }),
  });

  let data;
  if (typeof response.text !== "function") {
    data = await response.json();
  } else {
    const rawBody = await response.text();
    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      data = {
        message: `The downstream service returned a non-JSON response (status ${response.status}).`,
        upstreamResponse: rawBody.slice(0, 500),
      };
    }
  }
  if (!response.ok) {
    const targetOrigin = new URL(url).origin;
    const serviceName =
      targetOrigin === new URL(config.AUTH_SERVICE_URL).origin
        ? "Auth"
        : targetOrigin === new URL(config.AUCTIONS_SERVICE_URL).origin
          ? "Auctions"
          : targetOrigin === new URL(config.INVENTORY_SERVICE_URL).origin
            ? "Inventory"
            : "Downstream";
    const errorMessage = data.message || `Failed to fetch data from ${serviceName} service at ${url}.`;
    console.error(`Error forwarding request to ${url}: ${errorMessage} (Status: ${response.status})`);
    const error = new Error(errorMessage);
    error.data = data;
    error.statusCode = response.status;
    throw error;
  }
  return data;
};

export const forwardMultipartRequest = async (req, url) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
    throw error;
  }

  const formData = new FormData();

  for (const key in req.body) {
    formData.append(key, req.body[key]);
  }

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      formData.append(file.fieldname, new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    }
  }

  const response = await fetchWithColdStartRetry(url, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({ message: `Failed to parse JSON response from ${url}` }));
  if (!response.ok) {
    const targetOrigin = new URL(url).origin;
    const serviceName =
      targetOrigin === new URL(config.AUTH_SERVICE_URL).origin
        ? "Auth"
        : targetOrigin === new URL(config.AUCTIONS_SERVICE_URL).origin
          ? "Auctions"
          : targetOrigin === new URL(config.INVENTORY_SERVICE_URL).origin
            ? "Inventory"
            : "Downstream";
    const errorMessage = data.message || `Failed to fetch data from ${serviceName} service at ${url}.`;
    console.error(`Error forwarding multipart request to ${url}: ${errorMessage} (Status: ${response.status})`);
    const error = new Error(errorMessage);
    error.data = data;
    error.statusCode = response.status;
    throw error;
  }
  return data;
};

