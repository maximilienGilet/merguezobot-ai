type DomainConfig = {
  prefix: string;
  keepWww?: boolean;
};

const domainConfigs: Record<string, DomainConfig> = {
  "tiktok.com": { prefix: "vx", keepWww: true },
  "twitter.com": { prefix: "fx" },
  "x.com": { prefix: "fixup" },
  "bsky.app": { prefix: "fx" },
  "instagram.com": { prefix: "kk" },
};

const embedFriendlyHosts = new Set<string>();

Object.entries(domainConfigs).forEach(([domain, config]) => {
  const friendlyDomain = `${config.prefix}${domain}`;
  embedFriendlyHosts.add(friendlyDomain);
  embedFriendlyHosts.add(`www.${friendlyDomain}`);
});

const whitespaceRegex = /^[<\s]+|[)\]>.,!?;:\s]+$/g;

export function ensureProtocol(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function formatSupportedDomains() {
  return Object.keys(domainConfigs)
    .map((domain) => `\`${domain}\``)
    .join(", ");
}

function isEmbedFriendlyHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  const canonical = normalized.replace(/^www\./, "");
  return (
    embedFriendlyHosts.has(normalized) ||
    embedFriendlyHosts.has(canonical) ||
    embedFriendlyHosts.has(`www.${canonical}`)
  );
}

function matchDomainConfig(hostname: string) {
  const normalized = hostname.toLowerCase();
  const entry = Object.entries(domainConfigs).find(([domain]) => {
    return (
      normalized === domain ||
      normalized === `www.${domain}` ||
      normalized.endsWith(`.${domain}`)
    );
  });
  if (!entry) {
    return null;
  }
  return { domain: entry[0], config: entry[1] };
}

export type EmbedConversion = {
  original: string;
  converted: string;
};

export type ConversionResult =
  | { status: "converted"; conversion: EmbedConversion }
  | { status: "unsupported" }
  | { status: "already-friendly" }
  | { status: "invalid" };

export function convertLinkDetailed(rawLink: string): ConversionResult {
  const cleanedLink = rawLink.replace(whitespaceRegex, "");

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(ensureProtocol(cleanedLink));
  } catch {
    return { status: "invalid" };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (isEmbedFriendlyHost(hostname)) {
    return { status: "already-friendly" };
  }

  const matchedConfig = matchDomainConfig(hostname);
  if (!matchedConfig) {
    return { status: "unsupported" };
  }

  const { domain, config } = matchedConfig;
  const embedDomain = `${config.prefix}${domain}`;
  const shouldKeepWww =
    config.keepWww && (hostname === `www.${domain}` || hostname === domain);

  parsedUrl.hostname = shouldKeepWww ? `www.${embedDomain}` : embedDomain;

  return {
    status: "converted",
    conversion: {
      original: cleanedLink,
      converted: parsedUrl.toString(),
    },
  };
}

export function convertLink(rawLink: string): EmbedConversion | null {
  const result = convertLinkDetailed(rawLink);
  return result.status === "converted" ? result.conversion : null;
}

const domainAlternatives = Object.keys(domainConfigs)
  .map((domain) => domain.replace(/\./g, "\\."))
  .join("|");

const fixableUrlRegex = new RegExp(
  `(?:https?:\\/\\/)?(?:[\\w-]+\\.)*(?:${domainAlternatives})[^\\s<>]*`,
  "gi",
);

export function findEmbedConversions(text: string): EmbedConversion[] {
  const conversions: EmbedConversion[] = [];
  const seen = new Set<string>();

  const matches = text.matchAll(fixableUrlRegex);
  for (const match of matches) {
    const matchedLink = match[0];
    const conversion = convertLink(matchedLink);
    if (conversion && !seen.has(conversion.original)) {
      conversions.push(conversion);
      seen.add(conversion.original);
    }
  }

  return conversions;
}

export { domainConfigs };
