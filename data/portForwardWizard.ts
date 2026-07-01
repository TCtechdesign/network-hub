export const portForwardDeviceIcons = [
  "gamepad",
  "camera",
  "server",
  "network",
  "printer",
  "wifi",
  "globe",
] as const;

export const portForwardAccentOptions = [
  "emerald",
  "blue",
  "violet",
  "amber",
  "cyan",
  "red",
] as const;

export type PortForwardDeviceIcon = (typeof portForwardDeviceIcons)[number];
export type PortForwardAccent = (typeof portForwardAccentOptions)[number];
export type PortProtocol = "TCP" | "UDP";

export type PortForwardingRule = {
  protocol: PortProtocol;
  port: string;
  description: string;
};

export type PortForwardingDevice = {
  id: string;
  name: string;
  type: string;
  icon: PortForwardDeviceIcon;
  accent: PortForwardAccent;
  defaultLocalIp: string;
  notes: string;
  rules: PortForwardingRule[];
};

export type PortForwardWizardContent = {
  title: string;
  intro: string;
  quickSelectTitle: string;
  quickSelectHelp: string;
  emptyStateTitle: string;
  emptyStateBody: string;
  howToTitle: string;
  howToBody: string;
  safetyNotice: string;
  devices: PortForwardingDevice[];
  updatedAt?: string;
};

export const defaultPortForwardWizardContent: PortForwardWizardContent = {
  title: "Port Forwarding Wizard",
  intro:
    "Select a device to generate recommended port forwarding rules. You will need to add these rules manually in your router.",
  quickSelectTitle: "Quick Select",
  quickSelectHelp:
    "Results stay blank until a device is selected. Choose a profile to generate recommended rules.",
  emptyStateTitle: "Port rules are blank",
  emptyStateBody:
    "Select a device above to show recommended port forwarding rules, selected device details, and export options.",
  howToTitle: "How to use these ports",
  howToBody:
    "Copy the recommended rules and add them manually in your router's Port Forwarding, NAT, or Virtual Server section. The exact menu names vary by router.",
  safetyNotice:
    "This tool generates port forwarding rules only. It does not access or change your router settings. You must add the rules manually in your router.",
  devices: [
    {
      id: "xbox-series-x",
      name: "Xbox Series X",
      type: "Gaming Console",
      icon: "gamepad",
      accent: "emerald",
      defaultLocalIp: "192.168.1.50",
      notes:
        "These are commonly recommended Xbox Live ports. Your router, ISP, or double NAT setup can still affect multiplayer connectivity.",
      rules: [
        {
          protocol: "TCP",
          port: "3074",
          description: "Xbox Live connection",
        },
        {
          protocol: "UDP",
          port: "88",
          description: "Xbox Live authentication",
        },
        {
          protocol: "UDP",
          port: "500",
          description: "IPSec IKE",
        },
        {
          protocol: "UDP",
          port: "3074",
          description: "Xbox Live gameplay traffic",
        },
        {
          protocol: "UDP",
          port: "3544",
          description: "Teredo tunneling",
        },
        {
          protocol: "UDP",
          port: "4500",
          description: "IPSec NAT-T",
        },
      ],
    },
  ],
};

export function clonePortForwardWizardContent(
  content: PortForwardWizardContent = defaultPortForwardWizardContent
) {
  return JSON.parse(JSON.stringify(content)) as PortForwardWizardContent;
}

export function createPortForwardDeviceId(value: string) {
  const id = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return id || "device-profile";
}

export function normalizePortForwardWizardContent(
  value: unknown
): PortForwardWizardContent {
  const fallback = defaultPortForwardWizardContent;
  const source = isRecord(value) ? value : {};
  const rawDevices = Array.isArray(source.devices) ? source.devices : [];
  const devices = rawDevices
    .map((device, index) => normalizeDevice(device, index))
    .filter(isPortForwardingDevice);

  return {
    title: readString(source.title, fallback.title),
    intro: readString(source.intro, fallback.intro),
    quickSelectTitle: readString(
      source.quickSelectTitle,
      fallback.quickSelectTitle
    ),
    quickSelectHelp: readString(source.quickSelectHelp, fallback.quickSelectHelp),
    emptyStateTitle: readString(
      source.emptyStateTitle,
      fallback.emptyStateTitle
    ),
    emptyStateBody: readString(source.emptyStateBody, fallback.emptyStateBody),
    howToTitle: readString(source.howToTitle, fallback.howToTitle),
    howToBody: readString(source.howToBody, fallback.howToBody),
    safetyNotice: readString(source.safetyNotice, fallback.safetyNotice),
    devices: devices.length > 0 ? devices : clonePortForwardWizardContent().devices,
    updatedAt: readOptionalString(source.updatedAt),
  };
}

function normalizeDevice(value: unknown, index: number) {
  if (!isRecord(value)) {
    return null;
  }

  const rawRules = Array.isArray(value.rules) ? value.rules : [];
  const rules = rawRules
    .map((rule) => normalizeRule(rule))
    .filter(isPortForwardingRule);
  const name = readString(value.name, `Device ${index + 1}`);

  return {
    id: createPortForwardDeviceId(readString(value.id, name)),
    name,
    type: readString(value.type, "Device"),
    icon: readIcon(value.icon),
    accent: readAccent(value.accent),
    defaultLocalIp: readString(value.defaultLocalIp, "192.168.1.50"),
    notes: readString(value.notes, ""),
    rules:
      rules.length > 0
        ? rules
        : [
            {
              protocol: "TCP",
              port: "",
              description: "",
            },
          ],
  } satisfies PortForwardingDevice;
}

function normalizeRule(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  return {
    protocol: value.protocol === "UDP" ? "UDP" : "TCP",
    port: readString(value.port, ""),
    description: readString(value.description, ""),
  } satisfies PortForwardingRule;
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readIcon(value: unknown): PortForwardDeviceIcon {
  return portForwardDeviceIcons.includes(value as PortForwardDeviceIcon)
    ? (value as PortForwardDeviceIcon)
    : "network";
}

function readAccent(value: unknown): PortForwardAccent {
  return portForwardAccentOptions.includes(value as PortForwardAccent)
    ? (value as PortForwardAccent)
    : "cyan";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPortForwardingDevice(
  value: PortForwardingDevice | null
): value is PortForwardingDevice {
  return value !== null;
}

function isPortForwardingRule(
  value: PortForwardingRule | null
): value is PortForwardingRule {
  return value !== null;
}
