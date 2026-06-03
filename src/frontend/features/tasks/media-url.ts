const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

export function toCurrentOriginUrl(url: string) {
  if (typeof window === "undefined") {
    return url;
  }

  if (url.startsWith("/")) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    if (!LOCAL_HOSTNAMES.has(parsedUrl.hostname)) {
      return url;
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return url;
  }
}
