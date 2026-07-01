export type IpVersion = "IPv4" | "IPv6";

export type IpLookupStatus = "success" | "local" | "invalid" | "unavailable";

export type IpLookupResult = {
  status: IpLookupStatus;
  ip: string;
  label: string;
  version: IpVersion;
  ipType: string;
  isPublic: boolean;
  summary: string;
  source: string;
  lookupMs: number;
  message?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  location: {
    cityRegion: string;
    country: string;
    latitudeLongitude: string;
    timezone: string;
    localTime: string;
    postalCode: string;
    mapUrl?: string;
  };
  identity: {
    isp: string;
    organization: string;
    asn: string;
    domain: string;
    reverseDns: string;
    hostname: string;
    abuseContact: string;
  };
  network: {
    asn: string;
    asnName: string;
    network: string;
    cidr: string;
    netmask: string;
    route: string;
    countryCode: string;
  };
  connection: {
    ip: string;
    isp: string;
    organization: string;
    connectionType: string;
    services: string;
    usageType: string;
  };
  security: {
    proxy: string;
    vpn: string;
    tor: string;
  };
};

type IpClassification = {
  version: IpVersion;
  ipType: string;
  isPublic: boolean;
  summary: string;
  range: string;
  cidr: string;
  netmask: string;
  route: string;
  connectionType: string;
  services: string;
  usageType: string;
};

const unavailable = "Not available";

export const demoIpLookupResult: IpLookupResult = {
  status: "success",
  ip: "8.8.8.8",
  label: "Google Public DNS",
  version: "IPv4",
  ipType: "Public",
  isPublic: true,
  summary:
    "This is a public IPv4 address. Public IP location is approximate and usually points to an ISP or service region.",
  source: "Demo result",
  lookupMs: 245,
  coordinates: {
    latitude: 37.4192,
    longitude: -122.0574,
  },
  location: {
    cityRegion: "Mountain View, California",
    country: "United States",
    latitudeLongitude: "37.4192° N, 122.0574° W",
    timezone: "America/Los_Angeles",
    localTime: "Approximate timezone location",
    postalCode: "94043",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=37.4192,-122.0574",
  },
  identity: {
    isp: "Google LLC",
    organization: "Google LLC",
    asn: "AS15169",
    domain: "google.com",
    reverseDns: "dns.google",
    hostname: "dns.google",
    abuseContact: "abuse@google.com",
  },
  network: {
    asn: "AS15169",
    asnName: "GOOGLE",
    network: "8.8.8.0/24",
    cidr: "8.8.8.0/24",
    netmask: "255.255.255.0",
    route: "8.8.8.0/24",
    countryCode: "US",
  },
  connection: {
    ip: "8.8.8.8",
    isp: "Google LLC",
    organization: "Google LLC",
    connectionType: "Corporate",
    services: "DNS",
    usageType: "Content Delivery Network",
  },
  security: {
    proxy: "No",
    vpn: "No",
    tor: "No",
  },
};

export function normalizeIpInput(value: string) {
  const trimmed = value.trim();
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");
  const withoutBrackets = withoutProtocol.replace(/^\[/, "").replace(/\]$/, "");

  return withoutBrackets.split(/[/?#]/)[0].trim();
}

export function classifyIpAddress(value: string): IpClassification | null {
  const input = normalizeIpInput(value);
  const ipv4Parts = parseIpv4(input);

  if (ipv4Parts) {
    return classifyIpv4(ipv4Parts);
  }

  if (isValidIpv6(input)) {
    return classifyIpv6(input);
  }

  return null;
}

export function createInvalidLookupResult(
  ip: string,
  lookupMs = 0
): IpLookupResult {
  return {
    status: "invalid",
    ip,
    label: "Invalid IP address",
    version: "IPv4",
    ipType: "Invalid",
    isPublic: false,
    summary:
      "Enter a valid IPv4 or IPv6 address, such as 8.8.8.8 or 2001:4860:4860::8888.",
    source: "Local validation",
    lookupMs,
    message: "That does not look like a valid IP address.",
    location: emptyLocation(),
    identity: emptyIdentity(),
    network: emptyNetwork(),
    connection: {
      ip,
      isp: unavailable,
      organization: unavailable,
      connectionType: unavailable,
      services: unavailable,
      usageType: unavailable,
    },
    security: emptySecurity(),
  };
}

export function createLocalLookupResult(
  ip: string,
  classification: IpClassification,
  lookupMs = 0
): IpLookupResult {
  return {
    status: "local",
    ip,
    label: classification.ipType,
    version: classification.version,
    ipType: classification.ipType,
    isPublic: false,
    summary: classification.summary,
    source: "Local IP classification",
    lookupMs,
    location: {
      cityRegion: "Private or local network",
      country: "Not publicly routable",
      latitudeLongitude: unavailable,
      timezone: unavailable,
      localTime: unavailable,
      postalCode: unavailable,
    },
    identity: {
      isp: "Local network",
      organization: "Local network",
      asn: unavailable,
      domain: unavailable,
      reverseDns: unavailable,
      hostname: unavailable,
      abuseContact: unavailable,
    },
    network: {
      asn: unavailable,
      asnName: unavailable,
      network: classification.range,
      cidr: classification.cidr,
      netmask: classification.netmask,
      route: classification.route,
      countryCode: unavailable,
    },
    connection: {
      ip,
      isp: "Local network",
      organization: "Local network",
      connectionType: classification.connectionType,
      services: classification.services,
      usageType: classification.usageType,
    },
    security: emptySecurity(),
  };
}

export function createUnavailablePublicLookupResult(
  ip: string,
  classification: IpClassification,
  lookupMs = 0
): IpLookupResult {
  return {
    status: "unavailable",
    ip,
    label: "Public IP",
    version: classification.version,
    ipType: "Public",
    isPublic: true,
    summary:
      "This is a public IP address, but the live geolocation lookup could not be completed right now.",
    source: "Lookup unavailable",
    lookupMs,
    message: "The public IP lookup service did not return data.",
    location: emptyLocation(),
    identity: emptyIdentity(),
    network: emptyNetwork(ip),
    connection: {
      ip,
      isp: unavailable,
      organization: unavailable,
      connectionType: "Public internet",
      services: unavailable,
      usageType: unavailable,
    },
    security: emptySecurity(),
  };
}

function parseIpv4(value: string) {
  const parts = value.split(".");

  if (parts.length !== 4) {
    return null;
  }

  const numbers = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return Number.NaN;
    }

    return Number(part);
  });

  if (numbers.some((number) => !Number.isInteger(number) || number < 0 || number > 255)) {
    return null;
  }

  return numbers;
}

function classifyIpv4(parts: number[]): IpClassification {
  const [first, second, third] = parts;

  if (first === 10) {
    return privateIpv4("10.0.0.0 - 10.255.255.255", "10.0.0.0/8", "255.0.0.0");
  }

  if (first === 172 && second >= 16 && second <= 31) {
    return privateIpv4(
      "172.16.0.0 - 172.31.255.255",
      "172.16.0.0/12",
      "255.240.0.0"
    );
  }

  if (first === 192 && second === 168) {
    return privateIpv4(
      "192.168.0.0 - 192.168.255.255",
      "192.168.0.0/16",
      "255.255.0.0"
    );
  }

  if (first === 127) {
    return localIpv4(
      "Loopback",
      "127.0.0.0 - 127.255.255.255",
      "127.0.0.0/8",
      "255.0.0.0",
      "Used by this device to talk to itself."
    );
  }

  if (first === 169 && second === 254) {
    return localIpv4(
      "Link-local",
      "169.254.0.0 - 169.254.255.255",
      "169.254.0.0/16",
      "255.255.0.0",
      "Usually appears when DHCP fails and a device self-assigns an address."
    );
  }

  if (first === 100 && second >= 64 && second <= 127) {
    return localIpv4(
      "Carrier-grade NAT",
      "100.64.0.0 - 100.127.255.255",
      "100.64.0.0/10",
      "255.192.0.0",
      "Shared address space often used between an ISP and customer routers."
    );
  }

  if (first === 192 && second === 0 && third === 2) {
    return documentationIpv4("192.0.2.0/24");
  }

  if (first === 198 && second === 51 && third === 100) {
    return documentationIpv4("198.51.100.0/24");
  }

  if (first === 203 && second === 0 && third === 113) {
    return documentationIpv4("203.0.113.0/24");
  }

  if (first >= 224 && first <= 239) {
    return localIpv4(
      "Multicast",
      "224.0.0.0 - 239.255.255.255",
      "224.0.0.0/4",
      "240.0.0.0",
      "Used for multicast traffic, not for normal public host lookup."
    );
  }

  return {
    version: "IPv4",
    ipType: "Public",
    isPublic: true,
    summary:
      "This is a public IPv4 address. Public IP location is approximate and usually points to an ISP or service region.",
    range: "Public internet",
    cidr: "Provider assigned",
    netmask: "Provider assigned",
    route: "Internet routable",
    connectionType: "Public internet",
    services: unavailable,
    usageType: "Public network",
  };
}

function privateIpv4(
  range: string,
  cidr: string,
  netmask: string
): IpClassification {
  return localIpv4(
    "Private IPv4 Address",
    range,
    cidr,
    netmask,
    "This address is used inside a private local network and does not have a public internet location."
  );
}

function localIpv4(
  ipType: string,
  range: string,
  cidr: string,
  netmask: string,
  summary: string
): IpClassification {
  return {
    version: "IPv4",
    ipType,
    isPublic: false,
    summary,
    range,
    cidr,
    netmask,
    route: "Not publicly routable",
    connectionType: "Local network",
    services: "LAN / internal use",
    usageType: "Private or reserved",
  };
}

function documentationIpv4(cidr: string): IpClassification {
  return localIpv4(
    "Documentation IPv4 Address",
    cidr,
    cidr,
    "255.255.255.0",
    "This address range is reserved for examples and documentation."
  );
}

function classifyIpv6(value: string): IpClassification {
  const normalized = value.toLowerCase();

  if (normalized === "::1") {
    return localIpv6("Loopback", "::1/128", "Used by this device to talk to itself.");
  }

  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return localIpv6(
      "Unique Local IPv6 Address",
      "fc00::/7",
      "Used inside private IPv6 networks."
    );
  }

  if (/^fe[89ab]/.test(normalized)) {
    return localIpv6(
      "Link-local IPv6 Address",
      "fe80::/10",
      "Used for communication on the local network segment."
    );
  }

  if (normalized.startsWith("ff")) {
    return localIpv6(
      "Multicast IPv6 Address",
      "ff00::/8",
      "Used for multicast traffic, not for normal public host lookup."
    );
  }

  if (normalized.startsWith("2001:db8")) {
    return localIpv6(
      "Documentation IPv6 Address",
      "2001:db8::/32",
      "Reserved for examples and documentation."
    );
  }

  return {
    version: "IPv6",
    ipType: "Public",
    isPublic: true,
    summary:
      "This is a public IPv6 address. Public IP location is approximate and usually points to an ISP or service region.",
    range: "Public internet",
    cidr: "Provider assigned",
    netmask: "Not used by IPv6",
    route: "Internet routable",
    connectionType: "Public internet",
    services: unavailable,
    usageType: "Public network",
  };
}

function localIpv6(
  ipType: string,
  cidr: string,
  summary: string
): IpClassification {
  return {
    version: "IPv6",
    ipType,
    isPublic: false,
    summary,
    range: cidr,
    cidr,
    netmask: "Not used by IPv6",
    route: "Not publicly routable",
    connectionType: "Local network",
    services: "LAN / internal use",
    usageType: "Private or reserved",
  };
}

function isValidIpv6(value: string) {
  if (!value.includes(":") || !/^[0-9a-f:.]+$/i.test(value)) {
    return false;
  }

  const compressedParts = value.split("::");

  if (compressedParts.length > 2) {
    return false;
  }

  const head = compressedParts[0] ? compressedParts[0].split(":") : [];
  const tail = compressedParts[1] ? compressedParts[1].split(":") : [];
  const segments = [...head, ...tail];

  if (segments.some((segment) => !/^[0-9a-f]{1,4}$/i.test(segment))) {
    return false;
  }

  if (compressedParts.length === 1) {
    return segments.length === 8;
  }

  return segments.length < 8;
}

function emptyLocation() {
  return {
    cityRegion: unavailable,
    country: unavailable,
    latitudeLongitude: unavailable,
    timezone: unavailable,
    localTime: unavailable,
    postalCode: unavailable,
  };
}

function emptyIdentity() {
  return {
    isp: unavailable,
    organization: unavailable,
    asn: unavailable,
    domain: unavailable,
    reverseDns: unavailable,
    hostname: unavailable,
    abuseContact: unavailable,
  };
}

function emptyNetwork(ip = unavailable) {
  return {
    asn: unavailable,
    asnName: unavailable,
    network: unavailable,
    cidr: unavailable,
    netmask: unavailable,
    route: ip === unavailable ? unavailable : "Internet routable",
    countryCode: unavailable,
  };
}

function emptySecurity() {
  return {
    proxy: "Unknown",
    vpn: "Unknown",
    tor: "Unknown",
  };
}
