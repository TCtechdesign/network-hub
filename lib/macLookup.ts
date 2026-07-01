export type MacLookupStatus = "success" | "invalid" | "unknown";

export type MacVendorInfo = {
  name: string;
  organization: string;
  website: string;
  assignmentDate: string;
  firstSeen: string;
  lastSeen: string;
};

export type MacLookupResult = {
  status: MacLookupStatus;
  input: string;
  formatted: string;
  compact: string;
  lookupMs: number;
  source: string;
  message?: string;
  lookupHint: string;
  vendor: MacVendorInfo;
  classification: {
    addressType: string;
    localGlobal: string;
    format: string;
    multicast: string;
    broadcast: string;
    ieeeAssignment: string;
  };
  allocation: {
    addressBlock: string;
    assignmentBlock: string;
    oui: string;
    nic: string;
    octets: string[];
  };
};

const unavailable = "Not available";

const knownVendors: Record<string, MacVendorInfo> = {
  "001A2B": {
    name: "Dell Inc.",
    organization: "Dell Technologies Inc.",
    website: "https://www.dell.com",
    assignmentDate: "Jan 17, 2006",
    firstSeen: "Dec 12, 2012",
    lastSeen: "Apr 18, 2024",
  },
  "000C29": {
    name: "VMware, Inc.",
    organization: "VMware, Inc.",
    website: "https://www.vmware.com",
    assignmentDate: "Not available",
    firstSeen: "Not available",
    lastSeen: "Not available",
  },
  "001C42": {
    name: "Parallels, Inc.",
    organization: "Parallels, Inc.",
    website: "https://www.parallels.com",
    assignmentDate: "Not available",
    firstSeen: "Not available",
    lastSeen: "Not available",
  },
  B827EB: {
    name: "Raspberry Pi Foundation",
    organization: "Raspberry Pi Foundation",
    website: "https://www.raspberrypi.com",
    assignmentDate: "Not available",
    firstSeen: "Not available",
    lastSeen: "Not available",
  },
  F4F5D8: {
    name: "Google LLC",
    organization: "Google LLC",
    website: "https://www.google.com",
    assignmentDate: "Not available",
    firstSeen: "Not available",
    lastSeen: "Not available",
  },
  "3C5A37": {
    name: "Samsung Electronics Co., Ltd.",
    organization: "Samsung Electronics Co., Ltd.",
    website: "https://www.samsung.com",
    assignmentDate: "Not available",
    firstSeen: "Not available",
    lastSeen: "Not available",
  },
  "001B21": {
    name: "Intel Corporate",
    organization: "Intel Corporation",
    website: "https://www.intel.com",
    assignmentDate: "Not available",
    firstSeen: "Not available",
    lastSeen: "Not available",
  },
  "A4C138": {
    name: "Apple, Inc.",
    organization: "Apple Inc.",
    website: "https://www.apple.com",
    assignmentDate: "Not available",
    firstSeen: "Not available",
    lastSeen: "Not available",
  },
  "D850E6": {
    name: "Apple, Inc.",
    organization: "Apple Inc.",
    website: "https://www.apple.com",
    assignmentDate: "Not available",
    firstSeen: "Not available",
    lastSeen: "Not available",
  },
  "F0D1A9": {
    name: "Apple, Inc.",
    organization: "Apple Inc.",
    website: "https://www.apple.com",
    assignmentDate: "Not available",
    firstSeen: "Not available",
    lastSeen: "Not available",
  },
  "F4F5E8": {
    name: "Google LLC",
    organization: "Google LLC",
    website: "https://www.google.com",
    assignmentDate: "Not available",
    firstSeen: "Not available",
    lastSeen: "Not available",
  },
  "B4FBF9": {
    name: "Ubiquiti Inc.",
    organization: "Ubiquiti Inc.",
    website: "https://www.ui.com",
    assignmentDate: "Not available",
    firstSeen: "Not available",
    lastSeen: "Not available",
  },
  "D8D090": {
    name: "Cisco Systems, Inc.",
    organization: "Cisco Systems, Inc.",
    website: "https://www.cisco.com",
    assignmentDate: "Not available",
    firstSeen: "Not available",
    lastSeen: "Not available",
  },
};

export const demoMacLookupResult = createMacLookupResult(
  "00:1A:2B:3C:4D:5E",
  knownVendors["001A2B"],
  143,
  "Demo result"
);

export function parseMacAddress(value: string) {
  const input = value.trim();
  const withoutPrefix = input.replace(/^mac:/i, "");
  const compact = withoutPrefix.replace(/[\s:.-]/g, "").toUpperCase();

  if (!/^[0-9A-F]{12}$/.test(compact)) {
    return null;
  }

  return {
    compact,
    formatted: formatMacAddress(compact),
    oui: compact.slice(0, 6),
  };
}

export function formatMacAddress(compact: string) {
  return splitOctets(compact).join(":");
}

export function getKnownVendor(oui: string) {
  return knownVendors[oui.toUpperCase()] ?? null;
}

export function createLiveVendorInfo(vendorName: string): MacVendorInfo {
  const name = normalizeVendorName(vendorName);

  return {
    name,
    organization: inferOrganization(name),
    website: inferWebsite(name),
    assignmentDate: unavailable,
    firstSeen: unavailable,
    lastSeen: unavailable,
  };
}

export function createMacLookupResult(
  input: string,
  vendor: MacVendorInfo | null,
  lookupMs = 0,
  source = "Local MAC analysis"
): MacLookupResult {
  const parsed = parseMacAddress(input);

  if (!parsed) {
    return createInvalidMacLookupResult(input, lookupMs);
  }

  const firstOctet = Number.parseInt(parsed.compact.slice(0, 2), 16);
  const isMulticast = (firstOctet & 1) === 1;
  const isLocal = (firstOctet & 2) === 2;
  const isBroadcast = parsed.compact === "FFFFFFFFFFFF";
  const octets = splitOctets(parsed.compact);
  const vendorInfo = vendor ?? createUnknownVendorInfo(isLocal);
  const status: MacLookupStatus = vendor ? "success" : "unknown";
  const oui = `${octets[0]}:${octets[1]}:${octets[2]}`;
  const nic = `${octets[3]}:${octets[4]}:${octets[5]}`;

  return {
    status,
    input,
    formatted: parsed.formatted,
    compact: parsed.compact,
    lookupMs,
    source,
    message:
      status === "unknown"
        ? getUnknownLookupMessage(isLocal)
        : undefined,
    lookupHint: getLookupHint(status, isLocal),
    vendor: vendorInfo,
    classification: {
      addressType: isBroadcast ? "Broadcast" : isMulticast ? "Multicast" : "Unicast",
      localGlobal: isLocal ? "Locally Administered" : "Globally Administered",
      format: "Standard (48-bit)",
      multicast: isMulticast ? "Yes" : "No",
      broadcast: isBroadcast ? "Yes" : "No",
      ieeeAssignment: vendor && !isLocal ? "Yes" : "No",
    },
    allocation: {
      addressBlock: oui,
      assignmentBlock:
        vendor && !isLocal
          ? `MA-L (${vendorInfo.name})`
          : isLocal
            ? "Private or randomized address"
            : "OUI not found in local dataset",
      oui,
      nic,
      octets,
    },
  };
}

export function createInvalidMacLookupResult(
  input: string,
  lookupMs = 0
): MacLookupResult {
  return {
    status: "invalid",
    input,
    formatted: input,
    compact: "",
    lookupMs,
    source: "Local validation",
    message:
      "Enter a valid 48-bit MAC address, such as 00:1A:2B:3C:4D:5E or 001A.2B3C.4D5E.",
    lookupHint:
      "MAC addresses are 12 hexadecimal characters and can use colons, hyphens, dots, or no separators.",
    vendor: createUnknownVendorInfo(false),
    classification: {
      addressType: unavailable,
      localGlobal: unavailable,
      format: unavailable,
      multicast: unavailable,
      broadcast: unavailable,
      ieeeAssignment: unavailable,
    },
    allocation: {
      addressBlock: unavailable,
      assignmentBlock: unavailable,
      oui: unavailable,
      nic: unavailable,
      octets: [],
    },
  };
}

function splitOctets(compact: string) {
  return compact.match(/.{1,2}/g) ?? [];
}

function createUnknownVendorInfo(isLocal: boolean): MacVendorInfo {
  return {
    name: isLocal ? "Private / Randomized MAC" : "Unknown Vendor",
    organization: isLocal ? "Device-generated address" : unavailable,
    website: unavailable,
    assignmentDate: unavailable,
    firstSeen: unavailable,
    lastSeen: unavailable,
  };
}

function getUnknownLookupMessage(isLocal: boolean) {
  if (isLocal) {
    return "This is a valid locally administered MAC address. It may be a private or randomized Wi-Fi address, so it usually will not have a vendor OUI.";
  }

  return "This MAC address is valid, but its OUI is not in the local vendor sample yet.";
}

function getLookupHint(status: MacLookupStatus, isLocal: boolean) {
  if (status === "success") {
    return "The first 24 bits matched a known vendor OUI in the local dataset.";
  }

  if (isLocal) {
    return "Locally administered MAC addresses are often generated by the device or operating system for privacy.";
  }

  return "Vendor lookup is local-only right now. A larger offline OUI dataset would find more manufacturers without sending full MAC addresses anywhere.";
}

function normalizeVendorName(value: string) {
  const trimmed = value.trim();

  if (!trimmed || trimmed.toLowerCase().includes("not found")) {
    return "Unknown Vendor";
  }

  return trimmed;
}

function inferOrganization(vendorName: string) {
  const lowerName = vendorName.toLowerCase();

  if (lowerName.includes("dell")) {
    return "Dell Technologies Inc.";
  }

  if (lowerName.includes("apple")) {
    return "Apple Inc.";
  }

  if (lowerName.includes("google")) {
    return "Google LLC";
  }

  if (lowerName.includes("cisco")) {
    return "Cisco Systems, Inc.";
  }

  return vendorName;
}

function inferWebsite(vendorName: string) {
  const lowerName = vendorName.toLowerCase();

  if (lowerName.includes("dell")) {
    return "https://www.dell.com";
  }

  if (lowerName.includes("apple")) {
    return "https://www.apple.com";
  }

  if (lowerName.includes("google")) {
    return "https://www.google.com";
  }

  if (lowerName.includes("cisco")) {
    return "https://www.cisco.com";
  }

  if (lowerName.includes("vmware")) {
    return "https://www.vmware.com";
  }

  return unavailable;
}
