export type PortProtocol = "TCP" | "UDP" | "TCP / UDP" | "UDP/TCP";

export type PortReference = {
  port: number;
  protocol: PortProtocol;
  service: string;
  category: string;
  description: string;
  purpose: string;
  commonUses: string[];
  symptoms: string[];
  troubleshooting: string[];
  relatedCommands: string[];
  common?: boolean;
};

export const ports: PortReference[] = [
        {
          port: 20,
          protocol: "TCP",
          service: "FTP",
          category: "File Transfer",
      
          description:
            "Used by FTP to transfer files between a client and server.",
      
          purpose:
            "Handles the actual data transfer portion of an FTP session.",
      
          commonUses: [
            "Uploading files to an FTP server",
            "Downloading files from an FTP server",
            "Transferring large files between systems",
          ],
      
          symptoms: [
            "FTP transfers fail",
            "File uploads stop unexpectedly",
            "FTP connection works but files won't transfer",
          ],
      
          troubleshooting: [
            "Verify port 20 is not blocked by a firewall",
            "Confirm the FTP server is running",
            "Check firewall rules on the client and server",
            "Verify active/passive FTP configuration",
          ],
      
          relatedCommands: [
            "netstat -an",
            "ping",
            "tracert",
          ],
        },


        {
            port: 21,
            protocol: "TCP",
            service: "FTP Control",
            category: "File Transfer",
        
            description:
              "Used by FTP for control commands to establish and manage the FTP session.",
        
            purpose:
              "Handles the control connection for FTP, allowing clients to send commands to the server and receive responses.",
        
            commonUses: [
              "Uploading files to an FTP server",
              "Downloading files from an FTP server",
              "Managing FTP sessions and commands",
            ],
        
            symptoms: [
              "FTP control connection fails",
              "FTP commands do not execute",
              "FTP connection established but no response to commands",
            ],
        
            troubleshooting: [
              "Verify port 21 is not blocked by a firewall",
              "Confirm the FTP server is running",
              "Check firewall rules on the client and server",
              "Verify active/passive FTP configuration",
            ],
        
            relatedCommands: [
              "netstat -an",
              "ping",
              "tracert",
            ],
          },


          {
            port: 22,
            protocol: "TCP",
            service: "SSH (Secure Shell)",
            category: "Remote Access",
        
            description:
              "Used for secure remote login and command execution over an encrypted connection.",
        
            purpose:
              "Provides a secure channel for remote administration and file transfers, replacing older protocols like Telnet and FTP for secure communication.",
        
            commonUses: [
              "Remote server administration",
              "Secure file transfers using SCP or SFTP",
              "Tunneling other protocols securely",
            ],
        
            symptoms: [
              "SSH connection fails",
              "Unable to authenticate to SSH server",
              "SSH session drops unexpectedly",
            ],
        
            troubleshooting: [
              "Verify port 22 is not blocked by a firewall",
              "Confirm the SSH server is running",
              "Check firewall rules on the client and server",
              "Verify SSH configuration and authentication settings",
            ],
        
            relatedCommands: [
              "netstat -an",
              "ping",
              "tracert",
            ],
          },

          {
            port: 23,
            protocol: "TCP",
            service: "Telnet",
            category: "Remote Login",
        
            description:
              "Used for unencrypted remote login and command execution over a network.",
        
            purpose:
                "Provides a way to remotely access and manage devices, but is considered insecure due to lack of encryption, and has largely been replaced by SSH.",

            commonUses: [
              "Remote server administration",
              "Accessing network devices like routers and switches",
              "Testing network connectivity and services",
            ],
        
            symptoms: [
              "Telnet connection fails",
              "Unable to authenticate to Telnet server",
              "Telnet session drops unexpectedly",
            ],
        
            troubleshooting: [
              "Verify port 23 is not blocked by a firewall",
              "Confirm the Telnet server is running",
              "Check firewall rules on the client and server",
              "Verify Telnet configuration and authentication settings",
            ],
        
            relatedCommands: [
              "netstat -an",
              "ping",
              "tracert",
            ],
          },


          {
            port: 55,
            protocol: "UDP/TCP",
            service: "DNS (Domain Resolution)",
            category: "Domain Name System",
        
            description:
              "Used for resolving domain names to IP addresses and vice versa, allowing users to access websites and services using human-readable names instead of numeric IP addresses.",
        
            purpose:
                "Provides a critical service for the functioning of the internet by translating domain names into IP addresses, enabling users to access websites and services using human-readable names instead of numeric IP addresses.",

            commonUses: [
              "Resolving domain names to IP addresses",
              "Resolving IP addresses to domain names",
              "DNS queries for email delivery and other services",
            ],
        
            symptoms: [
              "DNS resolution fails",
              "Unable to access websites using domain names",
              "DNS queries time out",
            ],
        
            troubleshooting: [
              "Verify port 55 is not blocked by a firewall",
              "Confirm the DNS server is running",
              "Check firewall rules on the client and server",
              "Verify DNS configuration and settings on the client and server",
            ],
        
            relatedCommands: [
              "netstat -an",
              "ping",
              "tracert",
            ],
          },

          {
            port: 67,
            protocol: "UDP",
            service: "DHCP (Server to Client)",
            category: "Dynamic Host Configuration Protocol",
        
            description:
              "Used by DHCP servers to assign IP addresses and network configuration to clients on a network.",
        
            purpose:
                "Allows DHCP servers to provide IP addresses and network configuration to clients, enabling devices to connect to the network without manual configuration.",

            commonUses: [
              "Resolving domain names to IP addresses",
              "Resolving IP addresses to domain names",
              "DNS queries for email delivery and other services",
            ],
        
            symptoms: [
              "DNS resolution fails",
              "Unable to access websites using domain names",
              "DNS queries time out",
            ],
        
            troubleshooting: [
              "Verify port 67 is not blocked by a firewall",
              "Confirm the DHCP server is running",
              "Check firewall rules on the client and server",
              "Verify DHCP configuration and settings on the client and server",
            ],
        
            relatedCommands: [
              "netstat -an",
              "ping",
              "tracert",
            ],
          },

          {
            port: 68,
            protocol: "UDP",
            service: "DHCP (Client to Server)",
            category: "Dynamic Host Configuration Protocol",
        
            description:
              "Used by DHCP clients to request IP addresses and network configuration from DHCP servers on a network.",
        
            purpose:
                "Allows DHCP clients to request IP addresses and network configuration from DHCP servers, enabling devices to connect to the network without manual configuration.",

            commonUses: [
              "Resolving domain names to IP addresses",
              "Resolving IP addresses to domain names",
              "DNS queries for email delivery and other services",
            ],
        
            symptoms: [
              "DNS resolution fails",
              "Unable to access websites using domain names",
              "DNS queries time out",
            ],
        
            troubleshooting: [
              "Verify port 68 is not blocked by a firewall",
              "Confirm the DHCP client is running",
              "Check firewall rules on the client and server",
              "Verify DHCP configuration and settings on the client and server",
            ],
        
            relatedCommands: [
              "netstat -an",
              "ping",
              "tracert",
            ],
          },


          {
            port: 69,
            protocol: "UDP",
            service: "TFTP (Trivial File Transfer Protocol)",
            category: "File Transfer",
        
            description:
              "Used for simple file transfers without authentication, often in network booting scenarios.",
        
            purpose:
                "Provides a simple protocol for transferring files without authentication, commonly used in network booting scenarios and for transferring small files between devices.",

            commonUses: [
              "Resolving domain names to IP addresses",
              "Resolving IP addresses to domain names",
              "DNS queries for email delivery and other services",
            ],
        
            symptoms: [
              "DNS resolution fails",
              "Unable to access websites using domain names",
              "DNS queries time out",
            ],
        
            troubleshooting: [
              "Verify port 69 is not blocked by a firewall",
              "Confirm the TFTP server is running",
              "Check firewall rules on the client and server",
              "Verify TFTP configuration and settings on the client and server",
            ],
        
            relatedCommands: [
              "netstat -an",
              "ping",
              "tracert",
            ],
          },


          {
            port: 80,
            protocol: "TCP",
            service: "HTTP (Hypertext Transfer Protocol)",
            category: "Web Services",
        
            description:
              "Used for unencrypted web traffic, allowing users to access websites and web applications using a web browser.",
        
            purpose:
                "Provides a protocol for transmitting web pages and web application data over the internet, enabling users to access websites and web applications using a web browser.",

            commonUses: [
              "Unencrypted web browsing",
              "Accessing web applications",
              "Testing web server connectivity and functionality",
            ],
        
            symptoms: [
              "HTTP connection fails",
              "Unable to access websites using HTTP",
              "HTTP requests time out",
            ],
        
            troubleshooting: [
              "Verify port 80 is not blocked by a firewall",
              "Confirm the HTTP server is running",
              "Check firewall rules on the client and server",
              "Verify HTTP configuration and settings on the client and server",
            ],
        
            relatedCommands: [
              "netstat -an",
              "ping",
              "tracert",
            ],
          },

          {
            port: 110,
            protocol: "TCP",
            service: "POP3 (Email Receiving)",
            category: "Email Services",
        
            description:
              "Used for receiving email from a mail server, allowing users to download their email messages to their local device.",
        
            purpose:
                "Provides a protocol for receiving email from a mail server, enabling users to download their email messages to their local device for offline access.",

            commonUses: [
              "Email retrieval from a mail server",
              "Email client configuration for receiving email",
              "Testing email server connectivity and functionality",
            ],
        
            symptoms: [
              "Email retrieval fails",
              "Unable to connect to the mail server",
              "Email client configuration issues",
            ],
        
            troubleshooting: [
              "Verify port 110 is not blocked by a firewall",
              "Confirm the POP3 server is running",
              "Check firewall rules on the client and server",
              "Verify POP3 configuration and settings on the client and server",
            ],
        
            relatedCommands: [
              "netstat -an",
              "ping",
              "tracert",
            ],
          },


          {
            port: 123,
            protocol: "UDP",
            service: "NTP (Network Time Protocol)",
            category: "Time Synchronization",
        
            description:
              "Used for synchronizing the clocks of computers over a network, ensuring accurate timekeeping across devices.",
        
            purpose:
                "Provides a protocol for synchronizing the clocks of computers over a network, ensuring accurate timekeeping across devices, which is critical for various applications and services that rely on accurate timestamps.",

            commonUses: [
              "Time synchronization across devices",
              "Ensuring accurate timestamps for logging and security",
              "Maintaining consistent time across networked systems",
            ],
              
            symptoms: [
              "Time synchronization fails",
              "Inaccurate time on devices",
              "NTP requests time out",
            ],
        
            troubleshooting: [
              "Verify port 123 is not blocked by a firewall",
              "Confirm the NTP server is running",
              "Check firewall rules on the client and server",
              "Verify NTP configuration and settings on the client and server",
            ],
        
            relatedCommands: [
              "netstat -an",
              "ping",
              "tracert",
            ],
          },

          {
            port: 138,
            protocol: "UDP",
            service: "NetBIOS Datagram Service",
            category: "Network Services",
          
            description:
              "Provides connectionless communication between NetBIOS devices on a local network. It allows devices to send datagrams, browse network resources, and exchange information without establishing a session.",
          
            purpose:
              "Used for NetBIOS name services, network browsing, and connectionless data transfer between devices on a local network. Commonly used by older Windows networking services for file and printer sharing.",
          
            commonUses: [
              "Windows network browsing",
              "File and printer sharing",
              "NetBIOS name announcements",
              "Connectionless communication between hosts",
            ],
          
            symptoms: [
              "Network computers do not appear in Network Neighborhood",
              "File sharing discovery issues",
              "Unable to browse shared folders",
              "NetBIOS name resolution failures",
            ],
          
            troubleshooting: [
              "Verify NetBIOS over TCP/IP is enabled",
              "Check firewall rules allowing UDP 138",
              "Confirm devices are on the same network segment",
              "Run 'nbtstat -n' to verify NetBIOS names",
              "Check Windows File and Printer Sharing settings",
            ],
          
            relatedCommands: [
              "nbtstat -n",
              "nbtstat -a",
              "arp -a",
              "netstat -an",
            ],
          },

          {
            port: 143,
            protocol: "TCP",
            service: "IMAP",
            category: "Email Services",
          
            description:
              "Internet Message Access Protocol (IMAP) allows email clients to access and manage messages stored on a mail server without downloading them permanently to a device.",
          
            purpose:
              "Enables users to view, organize, and synchronize email across multiple devices while keeping messages stored on the mail server.",
          
            commonUses: [
              "Receiving email from a mail server",
              "Synchronizing email across multiple devices",
              "Managing folders and mailboxes",
              "Accessing email remotely",
            ],
          
            symptoms: [
              "Unable to receive emails",
              "Email client cannot connect to the mail server",
              "Mailbox synchronization issues",
              "Email folders not updating",
            ],
          
            troubleshooting: [
              "Verify the mail server address is correct",
              "Confirm port 143 is open and not blocked by a firewall",
              "Check username and password credentials",
              "Verify IMAP is enabled on the email account",
              "Test connectivity using telnet or PowerShell",
            ],
          
            relatedCommands: [
              "telnet",
              "Test-NetConnection",
              "ping",
              "netstat -an",
            ],
          },

          {
            port: 161,
            protocol: "UDP",
            service: "SNMP",
            category: "Network Management",
          
            description:
              "Simple Network Management Protocol (SNMP) is used to monitor, manage, and collect information from network devices such as routers, switches, servers, printers, and access points.",
          
            purpose:
              "Allows network administrators and monitoring systems to collect performance data, monitor device health, and manage network equipment remotely.",
          
            commonUses: [
              "Monitoring network devices",
              "Collecting performance statistics",
              "Monitoring bandwidth utilization",
              "Tracking device uptime and health",
              "Managing routers, switches, and printers",
            ],
          
            symptoms: [
              "Network monitoring tools cannot detect devices",
              "SNMP queries time out",
              "Missing performance statistics",
              "Device status information unavailable",
            ],
          
            troubleshooting: [
              "Verify SNMP is enabled on the device",
              "Check firewall rules allowing UDP 161",
              "Confirm SNMP community strings are correct",
              "Verify the monitoring server can reach the device",
              "Test connectivity using ping",
            ],
          
            relatedCommands: [
              "ping",
              "tracert",
              "snmpwalk",
              "snmpget",
              "netstat -an",
            ],
          },

          {
            port: 443,
            protocol: "TCP",
            service: "HTTPS",
            category: "Web Services",
          
            description:
              "HTTPS (Hypertext Transfer Protocol Secure) provides encrypted communication between a web browser and a web server using SSL/TLS encryption.",
          
            purpose:
              "Protects sensitive data transmitted between users and websites, including passwords, payment information, personal data, and login credentials.",
          
            commonUses: [
              "Secure website browsing",
              "Online banking",
              "E-commerce transactions",
              "Web applications",
              "API communications",
            ],
          
            symptoms: [
              "Website cannot be reached",
              "SSL/TLS certificate errors",
              "Secure connection failed",
              "HTTPS website loads slowly or not at all",
            ],
          
            troubleshooting: [
              "Verify port 443 is open on the server",
              "Check firewall rules allowing HTTPS traffic",
              "Confirm the SSL/TLS certificate is valid",
              "Verify DNS records point to the correct server",
              "Test connectivity using a web browser or curl",
            ],
          
            relatedCommands: [
              "ping",
              "tracert",
              "curl",
              "nslookup",
              "netstat -an",
            ],
          },

          {
            port: 445,
            protocol: "TCP",
            service: "SMB",
            category: "File Sharing",
          
            description:
              "Server Message Block (SMB) is a network protocol used for sharing files, folders, printers, and other resources between computers on a network.",
          
            purpose:
              "Allows users and applications to access shared files, printers, and network resources on remote computers and servers.",
          
            commonUses: [
              "Windows file sharing",
              "Network shared folders",
              "Printer sharing",
              "Network Attached Storage (NAS)",
              "Active Directory environments"
            ],
          
            symptoms: [
              "Unable to access shared folders",
              "Network drive cannot be mapped",
              "File sharing unavailable",
              "Access denied errors",
              "Cannot connect to NAS devices"
            ],
          
            troubleshooting: [
              "Verify port 445 is not blocked by a firewall",
              "Ensure File and Printer Sharing is enabled",
              "Check SMB services are running",
              "Verify share permissions and NTFS permissions",
              "Test connectivity to the remote host",
              "Confirm the device is online and reachable"
            ],
          
            relatedCommands: [
              "ping",
              "net use",
              "net share",
              "netstat -an",
              "Test-NetConnection"
            ],
          },
      ];

export function getPortSlug(port: PortReference) {
  return `${port.port}-${slugify(port.service)}`;
}

export function getPortBySlug(slug: string) {
  return ports.find((port) => getPortSlug(port) === slug);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
