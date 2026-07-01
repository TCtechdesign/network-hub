export const commandPlatformOptions = ["Windows", "macOS", "Linux"] as const;

export type CommandPlatform = (typeof commandPlatformOptions)[number];

export type CommandExample = {
  id: string;
  label: string;
  command: string;
  notes: string;
};

export type CommandRelatedLink = {
  id: string;
  title: string;
  href: string;
};

export type CommandReference = {
  slug: string;
  name: string;
  description: string;
  category: string;
  platforms: CommandPlatform[];
  syntax: string;
  explanation: string;
  examples: CommandExample[];
  useCases: string[];
  relatedGuides: CommandRelatedLink[];
  relatedTools: CommandRelatedLink[];
  createdAt?: string;
  updatedAt?: string;
};

export type CommandsContent = {
  commands: CommandReference[];
  updatedAt?: string;
};

export const commands: CommandReference[] = [
  {
    slug: "ping",
    name: "ping",
    description: "Test connectivity to a device or website.",
    platforms: ["Windows", "macOS", "Linux"],
    category: "Connectivity",
    syntax: "ping <destination>",
    explanation:
      "The ping command sends small packets to a destination and reports whether the destination answers. It is usually the first command to run when checking basic connectivity, latency, and packet loss.",
    examples: [
      {
        id: "ping-public-dns",
        label: "Test internet reachability",
        command: "ping 8.8.8.8",
        notes:
          "If this works but a domain name fails, basic internet access may be working while DNS is failing.",
      },
      {
        id: "ping-domain",
        label: "Test DNS and reachability together",
        command: "ping google.com",
        notes: "This checks whether the name resolves and whether the host replies.",
      },
    ],
    useCases: [
      "Check if a host is reachable.",
      "Measure response time.",
      "Confirm basic network connectivity.",
    ],
    relatedGuides: [
      {
        id: "ping-guide",
        title: "How to Use Ping to Test Connectivity",
        href: "/guides/How-to-Use-Ping-to-Test-Connectivity",
      },
      {
        id: "packet-loss-guide",
        title: "How to Troubleshoot Packet Loss",
        href: "/guides/how-to-troubleshoot-packet-loss",
      },
    ],
    relatedTools: [
      {
        id: "ping-analyzer",
        title: "Ping Test Analyzer",
        href: "/tools/ping-test-analyzer",
      },
    ],
  },
  {
    slug: "nslookup",
    name: "nslookup",
    description: "Query DNS records and troubleshoot DNS issues.",
    platforms: ["Windows", "macOS", "Linux"],
    category: "DNS",
    syntax: "nslookup <domain>",
    explanation:
      "Nslookup asks a DNS server for records about a domain. It helps confirm whether a domain resolves, which DNS server answered, and whether DNS is the reason a site will not load.",
    examples: [
      {
        id: "nslookup-domain",
        label: "Look up a domain",
        command: "nslookup google.com",
        notes: "Use this to confirm whether DNS returns an address.",
      },
      {
        id: "nslookup-public-resolver",
        label: "Ask a specific resolver",
        command: "nslookup google.com 1.1.1.1",
        notes: "Compare your default DNS server with a public resolver.",
      },
    ],
    useCases: [
      "Look up DNS records.",
      "Verify which DNS server answers.",
      "Troubleshoot name resolution issues.",
    ],
    relatedGuides: [
      {
        id: "dns-troubleshooting",
        title: "DNS Troubleshooting",
        href: "/guides/dns-troubleshooting",
      },
      {
        id: "test-dns-resolution",
        title: "How to Test DNS Resolution",
        href: "/guides/how-to-test-dns-resolution",
      },
    ],
    relatedTools: [
      {
        id: "dns-lookup",
        title: "DNS Lookup",
        href: "/tools/dns-lookup",
      },
    ],
  },
  {
    slug: "ipconfig",
    name: "ipconfig",
    description: "Display IP configuration.",
    platforms: ["Windows"],
    category: "DHCP",
    syntax: "ipconfig",
    explanation:
      "Ipconfig shows the current Windows network configuration. It is useful for quickly checking whether an adapter has an IP address, default gateway, and DNS server.",
    examples: [
      {
        id: "ipconfig-basic",
        label: "Show basic adapter details",
        command: "ipconfig",
        notes: "Use this for a quick view of IPv4 address and gateway settings.",
      },
      {
        id: "ipconfig-all",
        label: "Show full adapter details",
        command: "ipconfig /all",
        notes:
          "Use this when you need DHCP, DNS, MAC address, and lease information.",
      },
    ],
    useCases: [
      "View IP address information.",
      "Check DNS and gateway settings.",
      "Troubleshoot DHCP configuration.",
    ],
    relatedGuides: [
      {
        id: "dhcp-troubleshooting",
        title: "DHCP Troubleshooting",
        href: "/guides/dhcp-troubleshooting",
      },
      {
        id: "ip-address-guide",
        title: "What Is an IP Address?",
        href: "/guides/what-is-an-ip-address",
      },
    ],
    relatedTools: [
      {
        id: "ip-lookup",
        title: "IP Address Lookup",
        href: "/tools/ip-address-lookup",
      },
    ],
  },
  {
    slug: "ifconfig",
    name: "ifconfig",
    description: "Display network interface details.",
    platforms: ["macOS", "Linux"],
    category: "DHCP",
    syntax: "ifconfig",
    explanation:
      "Ifconfig displays network interface information on macOS and many Linux systems. It is useful for checking adapter status, assigned IP addresses, and interface names.",
    examples: [
      {
        id: "ifconfig-all",
        label: "Show all interfaces",
        command: "ifconfig",
        notes: "Use this to inspect all visible network adapters.",
      },
      {
        id: "ifconfig-en0",
        label: "Show one interface",
        command: "ifconfig en0",
        notes: "On many Macs, en0 is the Wi-Fi interface.",
      },
    ],
    useCases: [
      "View network interface details.",
      "Check assigned IP addresses.",
      "Inspect interface status.",
    ],
    relatedGuides: [
      {
        id: "dhcp-troubleshooting",
        title: "DHCP Troubleshooting",
        href: "/guides/dhcp-troubleshooting",
      },
    ],
    relatedTools: [
      {
        id: "ip-lookup",
        title: "IP Address Lookup",
        href: "/tools/ip-address-lookup",
      },
    ],
  },
  {
    slug: "tracert",
    name: "tracert",
    description: "Trace packet path on Windows.",
    platforms: ["Windows"],
    category: "Routing",
    syntax: "tracert <destination>",
    explanation:
      "Tracert shows the hops traffic takes from a Windows device to a destination. It helps identify where latency, timeouts, or routing failures begin.",
    examples: [
      {
        id: "tracert-google",
        label: "Trace a public host",
        command: "tracert google.com",
        notes: "Look for the first hop where latency spikes or replies stop.",
      },
    ],
    useCases: [
      "Trace the route packets take.",
      "Find where latency appears.",
      "Identify routing path failures.",
    ],
    relatedGuides: [
      {
        id: "traceroute-guide",
        title: "How to Use Traceroute to Find Network Problems",
        href: "/guides/how-to-use-traceroute-to-find-network-problems",
      },
      {
        id: "timeouts-guide",
        title: "How to Resolve Connection Timeouts",
        href: "/guides/how-to-resolve-connection-timeouts",
      },
    ],
    relatedTools: [
      {
        id: "ping-analyzer",
        title: "Ping Test Analyzer",
        href: "/tools/ping-test-analyzer",
      },
    ],
  },
  {
    slug: "traceroute",
    name: "traceroute",
    description: "Trace packet path on macOS and Linux.",
    platforms: ["macOS", "Linux"],
    category: "Routing",
    syntax: "traceroute <destination>",
    explanation:
      "Traceroute shows each network hop between your device and a destination. It is helpful when a connection works but feels slow, unstable, or fails after leaving your local network.",
    examples: [
      {
        id: "traceroute-google",
        label: "Trace a public host",
        command: "traceroute google.com",
        notes: "Compare hop latency to find where delay starts.",
      },
    ],
    useCases: [
      "Trace the route packets take.",
      "Find where latency appears.",
      "Identify routing path failures.",
    ],
    relatedGuides: [
      {
        id: "traceroute-guide",
        title: "How to Use Traceroute to Find Network Problems",
        href: "/guides/how-to-use-traceroute-to-find-network-problems",
      },
    ],
    relatedTools: [
      {
        id: "ping-analyzer",
        title: "Ping Test Analyzer",
        href: "/tools/ping-test-analyzer",
      },
    ],
  },
  {
    slug: "arp",
    name: "arp -a",
    description: "View the ARP table.",
    platforms: ["Windows", "macOS", "Linux"],
    category: "Layer 2",
    syntax: "arp -a",
    explanation:
      "The ARP table maps local IP addresses to MAC addresses. It is useful when troubleshooting duplicate IPs, local discovery, and device identity on the same network segment.",
    examples: [
      {
        id: "arp-table",
        label: "Show local ARP entries",
        command:
          "Interface: 192.168.0.27\nInternet Address      Physical Address\n192.168.0.1           1c-61-b4-aa-bb-cc\n192.168.0.10          d8-5d-e2-11-22-33",
        notes: "Look for IP addresses and the MAC addresses associated with them.",
      },
    ],
    useCases: [
      "View the ARP cache.",
      "Match IP addresses to MAC addresses.",
      "Troubleshoot local network discovery.",
    ],
    relatedGuides: [
      {
        id: "mac-address-guide",
        title: "What Is a MAC Address?",
        href: "/guides/what-is-a-mac-address",
      },
      {
        id: "ip-address-guide",
        title: "What Is an IP Address?",
        href: "/guides/what-is-an-ip-address",
      },
    ],
    relatedTools: [
      {
        id: "mac-lookup",
        title: "MAC Address Lookup",
        href: "/tools/mac-address-lookup",
      },
    ],
  },
  {
    slug: "netstat",
    name: "netstat",
    description: "Display active network connections.",
    platforms: ["Windows", "macOS", "Linux"],
    category: "Connections",
    syntax: "netstat",
    explanation:
      "Netstat displays active network connections and listening ports. It helps reveal what a device is connected to and which local ports are open.",
    examples: [
      {
        id: "netstat-active",
        label: "Show active connections",
        command:
          "Active Connections\nProto  Local Address      Foreign Address      State\nTCP    192.168.0.27:5050  142.250.190.14:443   ESTABLISHED",
        notes: "Use this to inspect current connection activity.",
      },
    ],
    useCases: [
      "Check current network activity on a device.",
      "Identify open ports and active connections.",
      "Troubleshoot network performance issues.",
    ],
    relatedGuides: [
      {
        id: "connection-timeouts",
        title: "How to Resolve Connection Timeouts",
        href: "/guides/how-to-resolve-connection-timeouts",
      },
    ],
    relatedTools: [
      {
        id: "port-checker",
        title: "Port Checker",
        href: "/tools/port-checker",
      },
    ],
  },
  {
    slug: "netstatan",
    name: "netstat -an",
    description: "Display all active network connections with numeric addresses.",
    platforms: ["Windows", "macOS", "Linux"],
    category: "Connections",
    syntax: "netstat -an",
    explanation:
      "Netstat -an shows connections and listening ports using numeric addresses. It is useful when DNS lookups slow down output or when you need exact IP and port values.",
    examples: [
      {
        id: "netstat-numeric",
        label: "Show numeric connections",
        command:
          "TCP    0.0.0.0:80         0.0.0.0:0          LISTENING\nTCP    192.168.0.27:5050  142.250.190.14:443 ESTABLISHED",
        notes: "Look for unexpected listening services or blocked ports.",
      },
    ],
    useCases: [
      "Identify open ports and troubleshoot connectivity issues.",
      "Check for unexpected listening services.",
      "Diagnose firewall or port blocking problems.",
    ],
    relatedGuides: [
      {
        id: "port-forwarding",
        title: "How to Configure Port Forwarding",
        href: "/guides/How-to-Configure-Port-Forwarding",
      },
    ],
    relatedTools: [
      {
        id: "port-checker",
        title: "Port Checker",
        href: "/tools/port-checker",
      },
      {
        id: "port-forward-wizard",
        title: "Port Forward Wizard",
        href: "/tools/port-forward-wizard",
      },
    ],
  },
  {
    slug: "netstatr",
    name: "netstat -r",
    description: "Display the routing table.",
    platforms: ["Windows", "macOS", "Linux"],
    category: "Routing",
    syntax: "netstat -r",
    explanation:
      "Netstat -r displays the routing table, showing how traffic is directed between local and remote networks.",
    examples: [
      {
        id: "netstat-routes",
        label: "Show routes",
        command: "netstat -r",
        notes: "Use this when traffic appears to leave through the wrong gateway.",
      },
    ],
    useCases: [
      "Review default routes.",
      "Troubleshoot gateway issues.",
      "Identify unexpected routing paths.",
    ],
    relatedGuides: [
      {
        id: "subnet-guide",
        title: "What Is a Subnet?",
        href: "/guides/what-is-a-subnet",
      },
      {
        id: "traceroute-guide",
        title: "How to Use Traceroute to Find Network Problems",
        href: "/guides/how-to-use-traceroute-to-find-network-problems",
      },
    ],
    relatedTools: [],
  },
  {
    slug: "netstatb",
    name: "netstat -b",
    description: "Display the executable responsible for each connection.",
    platforms: ["Windows"],
    category: "Connections",
    syntax: "netstat -b",
    explanation:
      "Netstat -b attempts to show which executable owns each connection on Windows. It can require an elevated terminal.",
    examples: [
      {
        id: "netstat-executables",
        label: "Show owning executables",
        command:
          "[chrome.exe]\nTCP    192.168.0.27:5050  142.250.190.14:443 ESTABLISHED",
        notes: "Use this to connect network activity to a specific app.",
      },
    ],
    useCases: [
      "Find which application is using a specific network connection.",
      "Identify potential malware or unauthorized applications.",
      "Troubleshoot application-specific network issues.",
    ],
    relatedGuides: [
      {
        id: "timeouts-guide",
        title: "How to Resolve Connection Timeouts",
        href: "/guides/how-to-resolve-connection-timeouts",
      },
    ],
    relatedTools: [
      {
        id: "traffic-analyzer",
        title: "Traffic Analyzer",
        href: "/tools/traffic-analyzer",
      },
    ],
  },
  {
    slug: "ipconfigall",
    name: "ipconfig /all",
    description:
      "Display detailed information about all network interfaces.",
    platforms: ["Windows"],
    category: "DHCP",
    syntax: "ipconfig /all",
    explanation:
      "Ipconfig /all gives the full Windows adapter view, including DHCP status, DNS servers, MAC addresses, leases, and gateways.",
    examples: [
      {
        id: "ipconfig-full",
        label: "Show full adapter configuration",
        command:
          "Windows IP Configuration\nHost Name . . . . . . . . : Tys-PC\nIPv4 Address. . . . . . . : 192.168.0.27\nDefault Gateway . . . . . : 192.168.0.1\nDNS Servers . . . . . . . : 1.1.1.1",
        notes: "Use this output to verify DHCP, DNS, and gateway settings.",
      },
    ],
    useCases: [
      "Troubleshoot DHCP, DNS, MAC address, and adapter settings.",
      "View detailed information about all network interfaces.",
      "Identify misconfigurations or conflicts in network settings.",
    ],
    relatedGuides: [
      {
        id: "dhcp-troubleshooting",
        title: "DHCP Troubleshooting",
        href: "/guides/dhcp-troubleshooting",
      },
    ],
    relatedTools: [
      {
        id: "ip-lookup",
        title: "IP Address Lookup",
        href: "/tools/ip-address-lookup",
      },
    ],
  },
  {
    slug: "ipconfigrenew",
    name: "ipconfig /renew",
    description: "Request a new IP address from the DHCP server.",
    platforms: ["Windows"],
    category: "DHCP",
    syntax: "ipconfig /renew",
    explanation:
      "Ipconfig /renew asks DHCP for a lease again. It is commonly used after releasing an address or when a Windows device has stale or invalid IP settings.",
    examples: [
      {
        id: "renew-address",
        label: "Renew DHCP lease",
        command: "ipconfig /renew",
        notes: "Run this after ipconfig /release or after fixing DHCP settings.",
      },
    ],
    useCases: [
      "Fix IP address conflicts or network connectivity issues.",
      "Request a new IP address from the DHCP server.",
      "Troubleshoot DHCP-related problems.",
    ],
    relatedGuides: [
      {
        id: "dhcp-troubleshooting",
        title: "DHCP Troubleshooting",
        href: "/guides/dhcp-troubleshooting",
      },
    ],
    relatedTools: [],
  },
  {
    slug: "ipconfigrelease",
    name: "ipconfig /release",
    description: "Release the current DHCP IP address.",
    platforms: ["Windows"],
    category: "DHCP",
    syntax: "ipconfig /release",
    explanation:
      "Ipconfig /release drops the current DHCP lease. It is usually followed by ipconfig /renew to request a fresh address.",
    examples: [
      {
        id: "release-address",
        label: "Release DHCP lease",
        command: "ipconfig /release",
        notes: "Expect the adapter to temporarily lose network connectivity.",
      },
    ],
    useCases: [
      "Disconnect a device from the network before renewing an IP.",
      "Troubleshoot DHCP-related issues.",
      "Release the current IP address to allow for a new one.",
    ],
    relatedGuides: [
      {
        id: "dhcp-troubleshooting",
        title: "DHCP Troubleshooting",
        href: "/guides/dhcp-troubleshooting",
      },
    ],
    relatedTools: [],
  },
  {
    slug: "ipconfigflushdns",
    name: "ipconfig /flushdns",
    description: "Clear the Windows DNS resolver cache.",
    platforms: ["Windows"],
    category: "DNS",
    syntax: "ipconfig /flushdns",
    explanation:
      "Ipconfig /flushdns clears cached DNS answers on Windows. Use it after DNS changes or when a device keeps resolving an old or incorrect address.",
    examples: [
      {
        id: "flush-dns",
        label: "Flush DNS cache",
        command: "ipconfig /flushdns",
        notes: "Run this in Command Prompt or PowerShell.",
      },
    ],
    useCases: [
      "Troubleshoot DNS-related issues.",
      "Clear stale or incorrect DNS entries.",
      "Force Windows to request fresh DNS answers.",
    ],
    relatedGuides: [
      {
        id: "dns-troubleshooting",
        title: "DNS Troubleshooting",
        href: "/guides/dns-troubleshooting",
      },
      {
        id: "test-dns-resolution",
        title: "How to Test DNS Resolution",
        href: "/guides/how-to-test-dns-resolution",
      },
    ],
    relatedTools: [
      {
        id: "dns-lookup",
        title: "DNS Lookup",
        href: "/tools/dns-lookup",
      },
    ],
  },
  {
    slug: "ipconfiggetifaddren0",
    name: "ipconfig getifaddr en0",
    description: "Show the IP address of a macOS interface.",
    platforms: ["macOS"],
    category: "DHCP",
    syntax: "ipconfig getifaddr en0",
    explanation:
      "On macOS, ipconfig getifaddr returns the IP address assigned to a specific interface. En0 is commonly Wi-Fi, but interface names can vary.",
    examples: [
      {
        id: "mac-wifi-ip",
        label: "Show Wi-Fi IP address",
        command: "ipconfig getifaddr en0",
        notes: "If nothing returns, confirm the correct interface name.",
      },
    ],
    useCases: [
      "Quickly find your local IP address.",
      "Troubleshoot Wi-Fi connectivity issues.",
      "Verify the IP address assigned to the Wi-Fi adapter.",
    ],
    relatedGuides: [
      {
        id: "ip-address-guide",
        title: "What Is an IP Address?",
        href: "/guides/what-is-an-ip-address",
      },
    ],
    relatedTools: [
      {
        id: "ip-lookup",
        title: "IP Address Lookup",
        href: "/tools/ip-address-lookup",
      },
    ],
  },
  {
    slug: "ipconfiggetpacketen0",
    name: "ipconfig getpacket en0",
    description: "Display macOS DHCP lease information.",
    platforms: ["macOS"],
    category: "DHCP",
    syntax: "ipconfig getpacket en0",
    explanation:
      "Ipconfig getpacket shows DHCP lease details for a macOS interface, including the assigned address, subnet mask, router, and DNS servers.",
    examples: [
      {
        id: "mac-dhcp-packet",
        label: "Show DHCP lease packet",
        command:
          "yiaddr = 192.168.0.27\nsubnet_mask = 255.255.255.0\nrouter = 192.168.0.1\ndomain_name_server = { 1.1.1.1, 1.0.0.1 }",
        notes: "Use this when DHCP values look incomplete or incorrect.",
      },
    ],
    useCases: [
      "Troubleshoot DHCP and IP assignment issues.",
      "View detailed DHCP lease information.",
      "Identify problems with DHCP communication.",
    ],
    relatedGuides: [
      {
        id: "dhcp-troubleshooting",
        title: "DHCP Troubleshooting",
        href: "/guides/dhcp-troubleshooting",
      },
    ],
    relatedTools: [],
  },
  {
    slug: "networksetuplistallhardwareports",
    name: "networksetup -listallhardwareports",
    description: "List macOS network adapters and device names.",
    platforms: ["macOS"],
    category: "Connections",
    syntax: "networksetup -listallhardwareports",
    explanation:
      "This macOS command lists hardware ports and their device names, such as Wi-Fi using en0. It is useful before running interface-specific commands.",
    examples: [
      {
        id: "mac-hardware-ports",
        label: "List hardware ports",
        command:
          "Hardware Port: Wi-Fi\nDevice: en0\nHardware Port: Ethernet\nDevice: en4",
        notes: "Use the device name in commands like ifconfig or ipconfig.",
      },
    ],
    useCases: [
      "Identify which interface is Wi-Fi.",
      "Troubleshoot network adapter issues on macOS.",
      "View all network adapters and their device names.",
    ],
    relatedGuides: [
      {
        id: "mac-address-guide",
        title: "What Is a MAC Address?",
        href: "/guides/what-is-a-mac-address",
      },
    ],
    relatedTools: [
      {
        id: "mac-lookup",
        title: "MAC Address Lookup",
        href: "/tools/mac-address-lookup",
      },
    ],
  },
  {
    slug: "scutildns",
    name: "scutil --dns",
    description: "Display macOS DNS configuration.",
    platforms: ["macOS"],
    category: "DNS",
    syntax: "scutil --dns",
    explanation:
      "Scutil --dns shows the DNS resolvers macOS is using. It is useful for finding split DNS, VPN DNS, and incorrect resolver settings.",
    examples: [
      {
        id: "mac-dns",
        label: "Show DNS resolvers",
        command:
          "DNS configuration\nresolver #1\nnameserver[0] : 1.1.1.1\nnameserver[1] : 1.0.0.1",
        notes: "Look for the resolver that applies to the domain you are testing.",
      },
    ],
    useCases: [
      "Verify DNS servers and troubleshoot name resolution issues.",
      "Check DNS configuration on macOS.",
      "Identify problems with DNS settings or server responses.",
    ],
    relatedGuides: [
      {
        id: "dns-troubleshooting",
        title: "DNS Troubleshooting",
        href: "/guides/dns-troubleshooting",
      },
      {
        id: "test-dns-resolution",
        title: "How to Test DNS Resolution",
        href: "/guides/how-to-test-dns-resolution",
      },
    ],
    relatedTools: [
      {
        id: "dns-lookup",
        title: "DNS Lookup",
        href: "/tools/dns-lookup",
      },
    ],
  },
  {
    slug: "sudoflushdns",
    name: "sudo dscacheutil -flushcache",
    description: "Flush the DNS cache on macOS.",
    platforms: ["macOS"],
    category: "DNS",
    syntax: "sudo dscacheutil -flushcache",
    explanation:
      "This command clears the macOS DNS cache. It is often paired with a DNS service restart on some macOS versions.",
    examples: [
      {
        id: "mac-flush-dns",
        label: "Flush macOS DNS cache",
        command: "sudo dscacheutil -flushcache",
        notes: "You may be prompted for your Mac password.",
      },
    ],
    useCases: [
      "Flush the DNS cache to resolve stale or incorrect entries.",
      "Troubleshoot DNS-related issues on macOS.",
      "Clear the DNS cache to ensure new DNS information is used.",
    ],
    relatedGuides: [
      {
        id: "dns-troubleshooting",
        title: "DNS Troubleshooting",
        href: "/guides/dns-troubleshooting",
      },
    ],
    relatedTools: [
      {
        id: "dns-lookup",
        title: "DNS Lookup",
        href: "/tools/dns-lookup",
      },
    ],
  },
  {
    slug: "curlI",
    name: "curl -I",
    description: "Check website response headers.",
    platforms: ["macOS", "Windows", "Linux"],
    category: "Configuration",
    syntax: "curl -I <url>",
    explanation:
      "Curl -I requests only the response headers from a URL. It is useful for checking status codes, redirects, caching, server headers, and basic web reachability.",
    examples: [
      {
        id: "curl-headers",
        label: "Check response headers",
        command: "curl -I https://example.com",
        notes: "Look at the HTTP status code and redirect headers first.",
      },
    ],
    useCases: [
      "Check HTTP response headers.",
      "Verify redirects.",
      "Debug caching issues.",
      "Check HTTP status codes.",
      "Analyze server information.",
    ],
    relatedGuides: [
      {
        id: "timeouts-guide",
        title: "How to Resolve Connection Timeouts",
        href: "/guides/how-to-resolve-connection-timeouts",
      },
    ],
    relatedTools: [
      {
        id: "website-bug-checker",
        title: "Website Bug Checker",
        href: "/tools/website-bug-checker",
      },
    ],
  },
];

export function cloneCommandsContent(
  content: CommandsContent = { commands }
): CommandsContent {
  return JSON.parse(JSON.stringify(content)) as CommandsContent;
}

export function createCommandSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "network-command";
}

export function normalizeCommandsContent(value: unknown): CommandsContent {
  const source = isRecord(value) ? value : {};
  const rawCommands = Array.isArray(source.commands) ? source.commands : [];
  const normalizedCommands = rawCommands
    .map((command, index) => normalizeCommand(command, index))
    .filter(isCommandReference);

  return {
    commands:
      normalizedCommands.length > 0
        ? normalizedCommands
        : cloneCommandsContent().commands,
    updatedAt: readOptionalString(source.updatedAt),
  };
}

function normalizeCommand(
  value: unknown,
  index: number
): CommandReference | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = readString(value.name, `command-${index + 1}`);
  const slug = createCommandSlug(readString(value.slug, name));

  return {
    slug,
    name,
    description: readString(value.description, "Network command reference."),
    category: readString(value.category, "Connectivity"),
    platforms: readPlatforms(value.platforms),
    syntax: readString(value.syntax, name),
    explanation: readString(
      value.explanation,
      "Use this command while troubleshooting network behavior."
    ),
    examples: normalizeExamples(value.examples, name),
    useCases: readStringList(value.useCases, [
      "Review usage and platform support.",
    ]),
    relatedGuides: normalizeRelatedLinks(value.relatedGuides),
    relatedTools: normalizeRelatedLinks(value.relatedTools),
    createdAt: readOptionalString(value.createdAt),
    updatedAt: readOptionalString(value.updatedAt),
  } satisfies CommandReference;
}

function normalizeExamples(value: unknown, commandName: string) {
  const examples = Array.isArray(value)
    ? value
        .map((example, index) => normalizeExample(example, index))
        .filter(isCommandExample)
    : [];

  return examples.length > 0
    ? examples
    : [
        {
          id: "example",
          label: "Example",
          command: commandName,
          notes: "Run this command from your terminal.",
        },
      ];
}

function normalizeExample(value: unknown, index: number): CommandExample | null {
  if (!isRecord(value)) {
    return null;
  }

  const label = readString(value.label, `Example ${index + 1}`);

  return {
    id: createCommandSlug(readString(value.id, label)),
    label,
    command: readString(value.command, ""),
    notes: readString(value.notes, ""),
  } satisfies CommandExample;
}

function normalizeRelatedLinks(value: unknown) {
  const links = Array.isArray(value)
    ? value
        .map((link, index) => normalizeRelatedLink(link, index))
        .filter(isCommandRelatedLink)
    : [];

  return links;
}

function normalizeRelatedLink(
  value: unknown,
  index: number
): CommandRelatedLink | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = readString(value.title, `Related Link ${index + 1}`);

  return {
    id: createCommandSlug(readString(value.id, title)),
    title,
    href: readHref(value.href, "/"),
  } satisfies CommandRelatedLink;
}

function readPlatforms(value: unknown): CommandPlatform[] {
  if (!Array.isArray(value)) {
    return ["Windows"];
  }

  const platforms = value
    .map((platform) => normalizePlatform(platform))
    .filter(isCommandPlatform);

  return Array.from(new Set(platforms)).length > 0
    ? Array.from(new Set(platforms))
    : ["Windows"];
}

function normalizePlatform(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "windows") {
    return "Windows";
  }

  if (normalized === "macos" || normalized === "mac") {
    return "macOS";
  }

  if (normalized === "linux") {
    return "Linux";
  }

  return null;
}

function readStringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );

  return items.length > 0 ? items : fallback;
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readHref(value: unknown, fallback: string) {
  const href = readString(value, fallback);

  return href.startsWith("/") || href.startsWith("https://") ? href : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCommandReference(
  value: CommandReference | null
): value is CommandReference {
  return value !== null;
}

function isCommandExample(
  value: CommandExample | null
): value is CommandExample {
  return value !== null;
}

function isCommandRelatedLink(
  value: CommandRelatedLink | null
): value is CommandRelatedLink {
  return value !== null;
}

function isCommandPlatform(value: string | null): value is CommandPlatform {
  return commandPlatformOptions.includes(value as CommandPlatform);
}
