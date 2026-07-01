export type GuideImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type Guide = {
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  readTime: string;
  description: string;
  image?: GuideImage;
  content: string;
  createdAt?: string;
  updatedAt?: string;
};

export const guides: Guide[] = [
  {
    slug: "dhcp-troubleshooting",
    title: "DHCP Troubleshooting",
    category: "Troubleshooting",
    difficulty: "Intermediate",
    readTime: "15 min",
    description:
      "Fix IP address issues, DHCP conflicts, and random disconnects.",
      image: {
        src: "/images/dhcp.png",
        alt: "DHCP diagram showing how devices receive IP addresses from a DHCP server.",
        caption: "DHCP automatically assigns IP addresses and network settings to devices.",
      },

    content: `
What is DHCP?

DHCP (Dynamic Host Configuration Protocol) automatically assigns network settings to devices when they connect to a network.
These settings include:
• IP Address
• Subnet Mask
• Default Gateway
• DNS Servers
Without DHCP, devices would need to be configured manually before they could communicate on a network.

Common Symptoms

• Frequent network disconnects
• Devices failing to obtain an IP address
• Connected without internet access
• New devices unable to join
• IP addresses changing unexpectedly
• Some devices working while others cannot connect

Common Causes

Multiple DHCP Servers:
If more than one device on the network is assigning IP addresses, devices may receive conflicting network information.
Example:
Internet -> ISP Gateway -> Router -> Devices
If both the gateway and router have DHCP enabled, connectivity problems may occur.
DHCP Pool Exhaustion:
The DHCP server has a limited pool of addresses available for assignment. If all available addresses are in use, new devices may be unable to connect.
Lease Renewal Issues:
Devices periodically renew their DHCP leases. If the renewal process fails, connectivity interruptions may occur.

Commands to Run

Windows:
ipconfig /all
Displays:
• IP Address
• Default Gateway
• DHCP Enabled Status
• DHCP Server
Windows / macOS / Linux:
arp -a
Displays the ARP table and can help identify potential duplicate IP address issues.

How to Fix

Verify Only One DHCP Server Exists:
If you have both an ISP gateway and a separate router, ensure only one device is handling DHCP assignments.
Check DHCP Scope Availability:
Verify that the DHCP address pool has enough available IP addresses for all devices on the network.
Renew the DHCP Lease:
Windows:
ipconfig /release
ipconfig /renew
Review Lease Time Settings:
Verify that DHCP lease durations are appropriate for your environment and that devices are successfully renewing their leases.
Reboot Network Equipment:
Restart the modem/gateway first, then restart the router and affected devices.


`,
  },

  // DNS Troubleshooting
  {
    slug: "dns-troubleshooting",
    title: "DNS Troubleshooting",
    category: "Troubleshooting",
    difficulty: "Beginner",
    readTime: "10 min",
    description:
      "Learn how to troubleshoot DNS issues and website resolution failures.",
      image: {
        src: "/images/dns.png",
        alt: "Network map with connected nodes behind a terminal window.",
        caption: "DNS helps devices find the correct destination across a network.",
      },

    content: `
What Is DNS?

Have you ever visited a website only to see a message saying:
• "This site can't be reached"
• "Server not found"
If so, DNS may be the reason.
DNS (Domain Name System) works like the internet's phone book. When you type a website address such as google.com into your browser, your device doesn't actually know where that website is located. Instead, it sends a request to a DNS server to find the website's IP address.
Once the IP address is found, your device can connect to the correct server and load the website.
If the DNS server is down, unreachable, or returning incorrect information, your device may be unable to find the website, resulting in errors such as:
• This site can't be reached
• DNS_PROBE_FINISHED_NXDOMAIN
• Server not found
• DNS server not responding
In this guide, you'll learn how DNS works, common causes of DNS failures, commands to run during troubleshooting, and how to restore connectivity when DNS issues occur.

Common Symptoms

DNS issues can appear in several ways. Some of the most common symptoms include:
• Websites fail to load even though Wi-Fi is connected
• "This site can't be reached" errors
• "DNS Server Not Responding" messages
• Some websites work while others do not
• Slow website loading times
• Applications that require internet access fail to connect
• New devices can connect to the network but cannot browse the internet

Common Causes

DNS Server Outage:
The DNS server being used may be temporarily unavailable or experiencing issues.
Incorrect DNS Settings:
A device may be configured with an incorrect DNS server address.
ISP DNS Problems:
Internet Service Providers often provide their own DNS servers. If those servers experience issues, websites may become unreachable.
Corrupted DNS Cache:
Your device stores recently visited DNS records in a cache. If that cache becomes outdated or corrupted, it may prevent websites from loading correctly.
Firewall or Security Software:
Certain security applications may block DNS traffic or interfere with DNS lookups.

Commands to Run

Verify DNS Resolution:
Windows, macOS, and Linux:
nslookup google.com
If DNS is working correctly, the command should return an IP address.
Test Internet Connectivity:
ping 8.8.8.8
If the ping succeeds but websites still won't load, DNS may be the issue.
Test Website Resolution:
ping google.com
If the hostname cannot be resolved, DNS is likely failing.
View DNS Configuration:
Windows:
ipconfig /all
Look for:
• DNS Servers
• Default Gateway
• IP Address
Flush DNS Cache:
Windows:
ipconfig /flushdns
macOS:
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
This clears cached DNS records and forces the device to request fresh information.

How to Fix

Restart Your Router:
Many DNS issues can be resolved by restarting the router and modem.
Change DNS Servers:
Try using a public DNS provider:
Cloudflare:
Primary: 1.1.1.1
Secondary: 1.0.0.1
Google:
Primary: 8.8.8.8
Secondary: 8.8.4.4
Flush the DNS Cache:
Clear any outdated records using the commands above.
Verify DNS Settings:
Ensure the device is receiving valid DNS server addresses from the router or DHCP server.
Test Again:
Run:
nslookup google.com
If an IP address is returned, DNS is functioning properly.

Quick Troubleshooting Checklist

☐ Verify internet connection
☐ Run nslookup google.com
☐ Run ping 8.8.8.8
☐ Check DNS server settings
☐ Flush DNS cache
☐ Restart router and modem
☐ Try a different DNS provider
☐ Test website access again

`,
  },

// What is DNS?

  {
    slug: "what-is-dns",
    title: "What is DNS?",
    category: "Networking Basics",
    difficulty: "Beginner",
    readTime: "10 min",
    description:
      "Learn what DNS is, how it works, and common issues that can arise with DNS resolution.",
    image: {
      src: "/images/dns.png",
      alt: "Network map with connected nodes behind a terminal window.",
      caption: "DNS helps devices find the correct destination across a network.",
    },

    content: `
What Is DNS?

DNS stands for Domain Name System. It is often called the phone book of the internet because it helps devices find websites using easy-to-remember names instead of numerical IP addresses.
Think about making a phone call. You usually search for a person's name in your contacts rather than memorizing their phone number. Behind the scenes, your phone matches that name to the correct number and routes the call. DNS works in a very similar way.
When you type a website address such as google.com into your browser, your device sends a request to a DNS server. The DNS server looks up the corresponding IP address for that website and returns it to your device. Once the IP address is found, your browser can connect to the correct web server and display the website.
Without DNS, users would need to remember IP addresses like 142.250.190.78 instead of simple domain names such as google.com.

DNS is used every day by:

• Browsing websites
• Online gaming
• Streaming movies and music
• Mobile apps
• Smart TVs and IoT devices
• Cloud services
In simple terms, DNS translates human-readable domain names into IP addresses that computers and network devices can understand.


Example

Domain Name | IP Address
google.com  | 142.250.x.x
youtube.com | 142.251.x.x
amazon.com  |  54.x.x.x
When you enter a domain name, DNS performs the lookup so you don't have to remember the IP address.


Why DNS Is Important

• Makes the internet easy to use
• Allows websites to be reached using names instead of numbers
• Helps route traffic to the correct web server
• Supports virtually every internet-connected device



Key Takeaway

DNS acts as a translator between humans and computers. Humans use domain names, while computers communicate using IP addresses. DNS bridges the gap by converting website names into the IP addresses needed to locate and load online resources.

Sources:

https://aws.amazon.com/route53/what-is-dns/


`,
  }, // end of guide

  {
    slug: "what-is-dhcp",
    title: "What is DHCP?",
    category: "Networking Basics",
    difficulty: "Beginner",
    readTime: "10 min",
    description:
      "Learn what DHCP is, how it works, and common issues that can arise with DHCP.",
      image: {
        src: "/images/dhcp.png",
        alt: "DHCP diagram showing how devices receive IP addresses from a DHCP server.",
        caption: "DHCP automatically assigns IP addresses and network settings to devices.",
      },

    content: `
What Is DHCP?

DHCP stands for Dynamic Host Configuration Protocol. It is a network protocol that automatically assigns IP addresses and other network settings to devices when they connect to a network. 
Without DHCP, network administrators would have to manually assign an IP address, subnet mask, default gateway, and DNS servers to every device. DHCP automates this process, making network management much easier and reducing the chance of configuration errors.
When a device such as a computer, smartphone, gaming console, or smart TV connects to a network, it sends a request for network information. The DHCP server responds by providing:
• An IP address
• Subnet mask
• Default gateway
• DNS server addresses
• Lease duration
This allows the device to communicate on the network and access the internet without any manual configuration.


Why DHCP Is Important?

DHCP helps:
• Automatically configure devices
• Prevent IP address conflicts
• Simplify network management
• Reduce manual configuration errors
• Improve scalability in home and business networks
In simple terms, DNS translates human-readable domain names into IP addresses that computers and network devices can understand.


DHCP and Multiple Routers


In most home networks, there should only be one active DHCP server managing IP address assignments. If multiple devices are assigning IP addresses on the same network, it can create network issues.
For example, if an ISP modem/router is providing DHCP services while a second router is also configured as a DHCP server, devices may receive conflicting network settings. This can lead to:
• Internet connectivity issues
• Devices randomly disconnecting
• IP address conflicts
• Difficulty communicating across the network
This situation is often referred to as a double-router or double-DHCP configuration.
Note: Multiple DHCP servers can exist in larger enterprise networks when they are properly configured to serve different VLANs or IP address scopes. However, in a typical home network, only one DHCP server should be active.




Example

1. You connect your laptop to Wi-Fi.
2. Your laptop requests an IP address. 
3. The DHCP server assigns:
• IP Address: 192.168.1.100
• Subnet Mask: 255.255.255.0
• Default Gateway: 192.168.1.1
• DNS Server: 1.1.1.1
4. Your laptop can now communicate on the network and access the internet.




Key Takeaway

DHCP is the service that automatically provides devices with the network settings they need to communicate. It simplifies networking by dynamically assigning IP addresses and ensuring devices can connect to local resources and the internet without manual configuration.





`,
  }, // end of guide



  {
    slug: "what-is-an-ip-address",
    title: "What is an IP Address?",
    category: "Networking Basics",
    difficulty: "Beginner",
    readTime: "5 min",
    description:
      "Learn what an IP address is, how it works, and common issues that can arise with IP addressing.",
      image: {
        src: "/images/ipaddress.png",
        alt: "IP address diagram",
        caption: "An IP address is a unique numerical address assigned to a device on a network.",
      },

    content: `
What is an IP Address?

An Internet Protocol (IP) Address is a unique numerical address assigned to a device on a network. Think of it like a home address. Just as a mailing address helps deliver packages to the correct house, an IP address helps data find the correct device on a network or the internet.
Every device connected to a network—such as a computer, smartphone, gaming console, or smart TV—uses an IP address to send and receive information.
There are several common types of IP addresses:
• Public IP Address: Used to identify your network on the internet.
• Private IP Address: Used by devices within your home or business network.
• Dynamic IP Address:  Automatically assigned and can change over time.
• Static IP Address: Manually assigned and remains the same unless changed.
Without IP addresses, devices would not know where to send or receive data, making internet communication impossible.


Fun Fact

When websites or apps estimate your location, they can often use your public IP address to determine your general area, such as your city or region. However, more precise location information usually comes from GPS, Wi-Fi, or cellular location services.


Key Takeaway

An IP address acts like a digital address for devices, allowing information to be routed to the correct destination across networks and the internet.

`,
  }, // end of network guide



  {
    slug: "what-is-a-mac-address",
    title: "What is a MAC Address?",
    category: "Networking Basics",
    difficulty: "Beginner",
    readTime: "10 min",
    description:
      "Learn what a MAC address is, how it works, and common issues that can arise with MAC addressing.",
      image: {
        src: "/images/mac.png",
        alt: "MAC address diagram",
        caption: "A MAC address is a unique hardware identifier assigned to a network device.",
      },

    content: `
What is a MAC Address?

A MAC (Media Access Control) address is a unique hardware identifier assigned to a network interface by the manufacturer. It is used to identify devices on a local network.
Think of a MAC address as a device's permanent name tag. While an IP address can change, a MAC address is typically assigned when the device is manufactured and remains associated with that network adapter.
A MAC address consists of 12 hexadecimal characters and is commonly displayed as six pairs separated by colons or hyphens.


Example

00:1A:2B:3C:4D:5E
Every network-enabled device has a MAC address, including:
• Computers
• Smartphones
• Gaming consoles
• Printers
• Smart TVs
• Routers


Why MAC Addresses Matter

MAC addresses help devices communicate on a local network and allow network equipment such as routers and switches to identify connected devices.
Network administrators often use MAC addresses to:
• Identify devices on the network
• Reserve DHCP addresses
• Apply access controls
• Troubleshoot connectivity issues


Finding MAC Addresses on Your Network

One useful command is:
arp -a
This command displays the ARP table, which shows IP addresses and their associated MAC addresses for devices your computer has recently communicated with on the local network.

Key Takeaway

A MAC address is a unique hardware identifier assigned to a network device. It helps network equipment recognize and communicate with devices on a local network.

`,
  }, // end of network guide

  {
    slug: "what-is-a-subnet",
    title: "What is a Subnet?",
    category: "Networking Basics",
    difficulty: "Beginner",
    readTime: "10 min",
    description:
      "Learn what a subnet is, how it works, and common issues that can arise with subnetting.",
      image: {
        src: "/images/subnet.png",
        alt: "Subnet diagram showing how a larger network is divided into smaller subnets.",
        caption: "Subnets help organize devices and improve network performance.",
      },

    content: `
    What Is a Subnet?

A subnet (short for subnetwork) is a smaller network created from a larger network. Think of it as dividing a large neighborhood into smaller streets or sections to make traffic easier to manage.
Subnets help organize devices, improve network performance, and reduce unnecessary network traffic. They are commonly used in homes, businesses, schools, and data centers.
When a device wants to communicate with another device, it uses the subnet information to determine whether the destination is on the same network or if the traffic needs to be sent to a router.


What Is a Subnet Mask?

A subnet mask is a value used to identify which portion of an IP address represents the network and which portion represents the device (host).
A common subnet mask looks like this:
255.255.255.0
While a subnet mask looks similar to an IP address, it serves a different purpose. Instead of identifying a device, it helps devices understand the boundaries of the network.


Example

Suppose a computer has the following settings:
IP Address:   192.168.1.25
Subnet Mask:  255.255.255.0
This tells the device that other addresses beginning with 192.168.1 are on the same local network.
If the destination is outside that network, the traffic is sent to the router, which forwards it toward its final destination.



Why Subnets Matter

Subnets help:
• Organize devices into smaller networks
• Improve network performance
• Reduce network congestion
• Increase security
• Simplify network management


Key Takeaway

A subnet is a smaller network within a larger network. Devices use the subnet mask to determine whether another device is on the same network or if traffic must be sent through a router.

`,
  }, // end of network guide

  {
    slug: "what-is-NAT",
    title: "What is Network Address Translation(NAT)?",
    category: "Networking Basics",
    difficulty: "Beginner",
    readTime: "10 min",
    description:
      "Learn what NAT is, how it works, and common issues that can arise with NAT.",
      image: {
        src: "/images/NAT.png",
        alt: "NAT diagram showing how private IP addresses are translated to a public IP address.",
        caption: "NAT allows multiple devices to share a single public IP address.",
      },

    content: `
     What Is NAT?

NAT (Network Address Translation) is a networking process that translates private IP addresses into a public IP address while data is traveling between a local network and the internet.
NAT allows multiple devices on a network to share a single public IP address. This helps conserve IPv4 addresses and adds a layer of separation between internal devices and the public internet.
Think of NAT like mail forwarding. A mail carrier knows the public address of an apartment building, but once the mail arrives, it must be delivered to the correct apartment inside. Similarly, NAT receives internet traffic sent to a public IP address and forwards it to the correct device on the local network.
For example, your network may contain:
Laptop      → 192.168.1.10
Xbox        → 192.168.1.20
Smart TV    → 192.168.1.30
All of these devices can access the internet using the same public IP address assigned by your Internet Service Provider (ISP).



Why NAT Is Important?

NAT helps:
Conserve public IPv4 addresses
Allow multiple devices to share one internet connection
Hide private IP addresses from the public internet
Simplify home and business networking


Key Takeaway

NAT translates private IP addresses into a public IP address, allowing multiple devices on a network to communicate with the internet while sharing the same public-facing address.

`,
  }, // end of network guide

  {
    slug: "how-to-use-traceroute-to-find-network-problems",
    title: "How to Use Traceroute to Find Network Problems",
    category: "Connectivity",
    difficulty: "Intermediate",
    readTime: "12 min",
    description:
      "Learn how to use traceroute to find where network slowdowns, routing delays, and connection failures begin.",
    image: {
      src: "/images/Traceroute.png",
      alt: "Traceroute diagram showing traffic moving through multiple network hops.",
      caption: "Traceroute shows each hop traffic takes between your device and a destination.",
    },

    content: `
How to Use Traceroute to Find Network Problems

Traceroute is a network diagnostic tool that shows the path your data takes from your device to a destination on the internet. It displays each router, also called a hop, between your computer and the destination along with the response time for each hop.
Traceroute is useful for identifying where a network connection is slowing down or failing.

When Should You Use Traceroute?

Use traceroute when:
• A website loads slowly
• You cannot reach a specific website or server
• Online games experience lag
• VPN connections are slow
• You suspect packet routing issues
• A ping test succeeds but performance is still poor

Traceroute Commands

Windows:
tracert google.com
macOS / Linux:
traceroute google.com
If traceroute is not installed on Linux:
sudo apt install traceroute

Example Output

\`\`\`text
Tracing route to google.com [142.250.190.14]

  1    <1 ms    <1 ms    <1 ms   192.168.0.1
  2    12 ms    11 ms    13 ms   10.1.1.1
  3    18 ms    17 ms    19 ms   72.14.215.1
  4    22 ms    21 ms    23 ms   142.250.190.14

Trace complete.
\`\`\`

Understanding the Results

Hop Number:
Each line represents a hop. A hop is a router or networking device that forwards traffic toward the destination.
Examples:
• Hop 1 is often your home router
• Hop 2 may be your ISP gateway
• Later hops may be ISP, regional, backbone, or destination networks
Response Time:
These values show how long it took each hop to respond.
General latency guidelines:
• 1-30 ms: Excellent
• 30-60 ms: Good
• 60-100 ms: Acceptable
• 100-150 ms: High
• 150+ ms: Poor
IP Address or Hostname:
This identifies the device responding at that hop.
Examples:
• Home router
• ISP router
• Regional ISP network
• Destination server

Example of a Network Problem

\`\`\`text
  1     1 ms     1 ms     1 ms   192.168.0.1
  2    10 ms    11 ms    10 ms   10.1.1.1
  3   220 ms   245 ms   231 ms   72.14.215.1
  4   225 ms   240 ms   236 ms   142.250.190.14
\`\`\`

Analysis:
Notice how latency jumps dramatically at Hop 3:
10 ms -> 220 ms
This suggests the issue may be:
• ISP congestion
• Overloaded router
• Routing problem
• Long-distance network path
Because the high latency continues on all following hops, the issue likely begins at Hop 3.

What Do Asterisks Mean?

You may see output like this:
\`\`\`text
  4     *     *     *
\`\`\`
This means the router did not respond within the timeout period.
Possible causes:
• Router blocks traceroute requests
• Firewall filtering
• Network congestion
• Device not configured to respond
A single timeout is usually not a problem. However, repeated timeouts for multiple hops may indicate a routing issue.

Traceroute vs Ping

Ping:
Tests if a device is reachable and measures latency.
Traceroute:
Shows the route traffic takes and where delays occur.
A common troubleshooting process is:
• Run ping
• If latency is high, run traceroute
• Identify which hop introduces delays

Troubleshooting Tips

High Latency at Hop 1:
\`\`\`text
1   150 ms
\`\`\`
Possible causes:
• Wi-Fi interference
• Weak signal
• Router issues
• Network congestion
High Latency After ISP Hops:
\`\`\`text
2    10 ms
3   180 ms
4   190 ms
\`\`\`
Possible causes:
• ISP routing issue
• Regional network congestion
• Internet backbone problems
Destination Unreachable:
\`\`\`text
Request timed out.
\`\`\`
Possible causes:
• Server offline
• Firewall blocking traffic
• Incorrect IP address
• Routing failure

Quick Summary

Traceroute helps you:
• View every hop between you and a destination
• Identify where delays occur
• Troubleshoot slow internet connections
• Detect ISP routing issues
• Investigate packet loss and latency problems

Common Commands

Windows:
tracert google.com
macOS/Linux:
traceroute google.com

`,
  }, // end of network guide


  {
    slug: "How-to-Use-Ping-to-Test-Connectivity",
    title: "How to Use Ping to Test Connectivity?",
    category: "Connectivity",
    difficulty: "Intermediate",
    readTime: "15 min",
    description:
      "Learn how to use the ping command to test network connectivity, diagnose issues, and interpret results.",
      image: {
        src: "/images/Pingtest.png",
        alt: "Ping test diagram showing how devices send ICMP echo requests and receive replies.",
        caption: "The ping command helps test connectivity between devices on a network.",
      },

    content: `
     How to Use Ping to Test Connectivity?

The ping command is one of the most common network troubleshooting tools. It sends small packets of data to a destination and measures how long it takes to receive a response.




Running a Ping Test

Open Terminal (macOS/Linux) or Command Prompt (Windows) and enter:
ping <IP address or domain>

Example:
ping 8.8.8.8

In this example, 8.8.8.8 is Google's public DNS server.
[image:/images/pingex.png|Alt text for the image|]


Understanding the Results

When you run a ping test, you'll see several lines of information.
Destination Host:
PING 8.8.8.8 (8.8.8.8): 56 data bytes

This confirms the destination address that is being tested and the size of the packet being sent.
Response Information
64 bytes from 8.8.8.8: icmp_seq=0 ttl=112 time=24.376 ms

Each response contains several important values:
• 64 bytes: Amount of data received back from the destination.
• icmp_seq: Packet sequence number used to track requests.
• ttl (Time To Live): Limits how many network hops a packet can travel before being discarded.
• time: The round-trip latency between your device and the destination.
Ping Statistics: 
8 packets transmitted, 8 packets received, 0.0% packet loss

This section summarizes the test results.
Packets transmitted – Total requests sent.
Packets received – Total responses received.
Packet loss – Percentage of packets that never returned.
A healthy connection typically shows:
• 0% packet loss
• Consistent response times
• No timeout errors

Latency Summary
round-trip min/avg/max/stddev =
21.176/24.258/28.197/1.845 ms

These values represent:
• Min – Fastest response time
• Avg – Average response time
• Max – Slowest response time
• Stddev – Variation between responses
In this example, the average latency is approximately 24 ms, which indicates a fast and stable connection.




Common Issues:

Request Timed Out
A timeout usually indicates:
• The destination is unreachable
• A firewall is blocking ICMP traffic
• Network connectivity problems

High Latency
High latency may be caused by:
• Network congestion
• Weak Wi-Fi signal
• Long-distance connections
• ISP issues
General guidelines:
• 0–50 ms: Excellent
• 50–100 ms: Good
• 100–150 ms: Noticeable delay
• 150+ ms: High latency, especially for gaming


Packet Loss
Packet loss occurs when data packets fail to reach their destination or return to the sender.
Common causes include:
• Wi-Fi interference
• Faulty network equipment
• ISP outages
• Congested networks

Key Takeaway:
Ping is a simple but powerful tool for testing connectivity, measuring latency, and detecting packet loss. It is often the first command used when troubleshooting network performance or internet connection issues.



`,
  }, // end of network guide


  {
    slug: "how-to-fix-no-internet-connection",
    title: "How to Fix No Internet Connection?",
    category: "Connectivity",
    difficulty: "Beginner",
    readTime: "10 min",
    description:
      "Learn how to troubleshoot and fix common causes of no internet connection issues.",
      image: {
        src: "/images/nointernet.png",
        alt: "No internet connection diagram showing a device with a red X between it and the internet.",
        caption: "No internet connection can be caused by various issues, but most can be resolved with basic troubleshooting steps.",
      },

    content: `
Overview

A "No Internet Connection" error can happen for many reasons, including router issues, ISP outages, faulty cables, weak Wi-Fi, or incorrect device settings.
Before assuming your internet service is down, work through the steps below to isolate whether the issue is with one device, your router, or your provider.

Restart Your Router and Modem

Power cycle your modem and router before changing advanced settings.
Steps:
• Unplug the modem and router from power.
• Wait at least 30 seconds.
• Plug the modem back in and wait for it to fully reconnect.
• Plug the router back in.
• Test your internet connection again.
A simple restart often clears temporary connection issues.

Test Other Devices

Check whether other devices can connect to the internet.
Examples:
• Smartphone
• Laptop
• Tablet
• Gaming console
If only one device is affected, the issue is probably with that device. If every device is offline, focus on the modem, router, cables, or ISP.

Check for ISP Outages

Sometimes the problem is outside your home network.
You can:
• Visit your ISP's website
• Check your ISP's outage page
• Contact customer support
• Check outage reporting services
If an outage exists, you may need to wait until service is restored.

Check Network Cables

Inspect all cables connected to your modem and router.
Look for:
• Loose power cables
• Loose coax or fiber connections
• Damaged Ethernet cables
• Bent connectors
• Router or modem lights that are off or red
Reseat each cable firmly and replace damaged cables if needed.

Check Wi-Fi Connection

If wired devices work but Wi-Fi devices do not, the issue may be wireless.
Check for:
• Weak Wi-Fi signal
• Airplane mode enabled
• Device connected to the wrong network
• Router Wi-Fi disabled
• Too much distance from the router
Move closer to the router and reconnect to the correct Wi-Fi network.

Restart the Device

If only one device has no internet, restart that device.
This can clear:
• Stale network settings
• Temporary adapter issues
• Failed DHCP leases
• DNS cache problems
After restarting, reconnect to the network and test again.

Check IP and DNS Settings

Invalid IP or DNS settings can prevent internet access even when the device is connected to Wi-Fi.
Windows:
ipconfig /all
Look for:
• A valid IP address
• A default gateway
• DNS servers
• DHCP enabled status
If the IP address begins with 169.254, the device did not receive a valid address from DHCP.

Run Basic Network Commands

Use these commands to narrow down the issue.
Test internet reachability:
ping 8.8.8.8
Test DNS resolution:
ping google.com
Check DNS lookup:
nslookup google.com
Renew the DHCP lease on Windows:
ipconfig /release
ipconfig /renew
If ping 8.8.8.8 works but ping google.com fails, DNS is likely the problem.

When to Contact Your ISP

Contact your ISP if:
• All devices are offline
• The modem shows warning or offline lights
• Cables are connected correctly
• Restarting equipment does not help
• Your ISP reports an outage
• The issue started suddenly without changes to your network
Your ISP can check signal levels, outages, modem status, and account provisioning.

Quick Troubleshooting Checklist

☐ Restart modem and router
☐ Test more than one device
☐ Check ISP outage status
☐ Inspect modem and router cables
☐ Reconnect to the correct Wi-Fi network
☐ Restart the affected device
☐ Check IP and DNS settings
☐ Run ping 8.8.8.8
☐ Run ping google.com
☐ Contact ISP if all devices are offline

Key Takeaway

Most "No Internet Connection" issues can be resolved by restarting network equipment, checking cables, testing other devices, verifying ISP status, and reviewing IP or DNS settings.
Work from the simplest causes first, then move toward device settings or ISP support.
`,
  }, // end of network guide


  {
    slug: "how-to-troubleshoot-packet-loss",
    title: "How to Troubleshoot Packet Loss",
    category: "Connectivity",
    difficulty: "Beginner",
    readTime: "10 min",
    description:
      "Learn how to identify and troubleshoot packet loss issues that can cause slow internet, lag, and connection problems.",
    image: {
      src: "/images/packetloss.png",
      alt: "Packet loss diagram showing data packets being dropped between a device and the internet.",
      caption: "Packet loss occurs when data packets fail to reach their destination.",
    },

    content: `
What Is Packet Loss?

Packet loss occurs when data packets traveling across a network fail to reach their destination. When packets are lost, applications may experience delays, interruptions, or poor performance.

Symptoms of Packet Loss

Common signs of packet loss include:
• Choppy audio during calls
• Video buffering or freezing
• Online gaming lag
• Slow-loading websites
• Random disconnections
• Voice chat cutting in and out

Step 1: Identify the Source

The first step is determining where the packet loss is occurring.
Start by testing your local network, then test an external destination.

Test Your Local Network

Find your router's gateway IP address and run a ping test.
Example:
ping 192.168.1.1
If packet loss occurs when pinging the gateway, the issue is likely within your home network.
Possible causes:
• Weak Wi-Fi signal
• Wireless interference
• Faulty network cables
• Router problems
• Network congestion

Test an External Host

Next, test connectivity to an internet destination.
ping google.com
Alternative test:
ping 8.8.8.8
If packet loss appears only when testing external destinations, the issue may exist outside your local network.
Possible causes:
• ISP issues
• Internet congestion
• Routing problems
• Problems with the destination server

Step 2: Isolate the Problem

Determine whether the issue affects:
• One device
• Multiple devices
• Wi-Fi only
• Wired connections
Questions to ask:
• Does the problem occur on every device?
• Does Ethernet experience packet loss?
• Does Wi-Fi experience packet loss?
• Does the issue occur all the time or only during peak hours?
The more specific you can be, the easier it becomes to locate the source.

Step 3: Check Hardware

Inspect your network equipment.
Check:
• Ethernet cables
• Router connections
• Modem status lights
• Network adapters
• Switches and access points
Replace any damaged cables and ensure all connections are secure.

Step 4: Optimize Network Traffic

Heavy network usage can contribute to packet loss.
Common causes include:
• Large downloads
• Cloud backups
• Streaming on multiple devices
• Network congestion
Try pausing high-bandwidth activities and test again.

Step 5: Run a Traceroute

If packet loss persists, use traceroute to identify where the problem begins.
macOS/Linux:
traceroute google.com
Windows:
tracert google.com
Traceroute can help determine whether packet loss is occurring inside the home network, at the ISP, or farther along the internet path.

Quick Packet Loss Checklist

☐ Ping your router gateway
☐ Ping google.com
☐ Ping 8.8.8.8
☐ Test another device
☐ Compare Wi-Fi and Ethernet
☐ Inspect Ethernet cables and router connections
☐ Pause high-bandwidth activity
☐ Run traceroute or tracert
☐ Contact your ISP if packet loss starts outside your network

Key Takeaway

Packet loss can occur anywhere between your device and the destination. Start by testing your local gateway, then test external hosts, isolate affected devices, inspect hardware, and use traceroute to identify where the problem occurs.
`,
  }, // end of network guide

  {
    slug: "how-to-test-dns-resolution",
    title: "How to Test DNS Resolution",
    category: "Troubleshooting",
    difficulty: "Beginner",
    readTime: "10 min",
    description:
      "Learn how to test DNS resolution with nslookup, ping, and public DNS servers.",
    image: {
      src: "/images/dnsresolution.png",
      alt: "DNS resolution diagram showing a domain name resolving to an IP address.",
      caption: "DNS resolution translates website names into IP addresses devices can reach.",
    },

    content: `
What Is DNS Resolution?

DNS (Domain Name System) resolution is the process of translating a website name, such as google.com, into an IP address that computers use to communicate.
For example:
google.com -> 142.250.190.14
If DNS resolution fails, websites may not load even when your internet connection is working.

Symptoms of DNS Issues

Common symptoms include:
• Websites will not load
• "DNS Server Not Responding" errors
• "Server Not Found" messages
• Some websites work while others do not
• Slow website loading times

Method 1: Test DNS with nslookup

Open Terminal or Command Prompt and run:
nslookup google.com
Successful result:
\`\`\`text
Server:  192.168.0.1
Address: 192.168.0.1#53

Non-authoritative answer:
Name:    google.com
Address: 142.250.190.14
\`\`\`
This confirms DNS is resolving the domain name correctly.
Failed result:
\`\`\`text
DNS request timed out.
timeout was 2 seconds.
\`\`\`
Another failed result may look like this:
\`\`\`text
*** Can't find google.com: Server failed
\`\`\`
This indicates a DNS problem.

Method 2: Test with Ping

Run:
ping google.com
Successful result:
\`\`\`text
Pinging google.com [142.250.190.14] with 32 bytes of data:
Reply from 142.250.190.14
\`\`\`
Notice that the hostname was converted into an IP address.
Failed result:
\`\`\`text
Ping request could not find host google.com.
\`\`\`
This usually means DNS resolution is failing.

Method 3: Compare DNS Servers

Test using a public DNS server.
Google DNS:
nslookup google.com 8.8.8.8
Cloudflare DNS:
nslookup google.com 1.1.1.1
If these work but your router's DNS server does not, the issue is likely with your ISP or local DNS server.

Method 4: Check Current DNS Servers

Windows:
ipconfig /all
Look for DNS server entries like:
\`\`\`text
DNS Servers . . . . . . . . . : 8.8.8.8
                                1.1.1.1
\`\`\`
macOS:
scutil --dns
Alternative macOS command:
networksetup -getdnsservers Wi-Fi
Linux:
cat /etc/resolv.conf

Troubleshooting DNS Problems

Flush DNS Cache:
Windows:
ipconfig /flushdns
macOS:
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
Change DNS Servers:
Try switching to:
• Cloudflare: 1.1.1.1 and 1.0.0.1
• Google DNS: 8.8.8.8 and 8.8.4.4
Restart Network Equipment:
• Power off the modem and router
• Wait 30 seconds
• Power them back on
• Test DNS again

Quick DNS Troubleshooting Checklist

☐ Run nslookup google.com
☐ Run ping google.com
☐ Test with 8.8.8.8
☐ Test with 1.1.1.1
☐ Check configured DNS servers
☐ Flush DNS cache
☐ Restart router and modem
☐ Try Cloudflare or Google DNS

Key Takeaway

If nslookup successfully returns an IP address, DNS resolution is working correctly. If it fails, focus on your DNS server settings, router configuration, or ISP DNS service.
`,
  }, // end of network guide

  {
    slug: "how-to-resolve-connection-timeouts",
    title: "How to Resolve Connection Timeouts",
    category: "Troubleshooting",
    difficulty: "Beginner",
    readTime: "10 min",
    description:
      "Learn how to troubleshoot connection timeout errors caused by network, DNS, firewall, VPN, or server problems.",
    image: {
      src: "/images/resolvetimeouts.png",
      alt: "Connection timeout diagram showing a client unable to reach a remote server.",
      caption: "Connection timeouts happen when a device does not receive a response in time.",
    },

    content: `
What Is a Connection Timeout?

A connection timeout occurs when a client device, such as a computer, phone, or tablet, attempts to connect to a website, server, or application but does not receive a response within the expected amount of time.
Connection timeouts can occur due to network issues, server outages, firewall restrictions, VPN interference, DNS problems, or high network congestion.

Symptoms of a Connection Timeout

Common symptoms include:
• Web pages take a long time to load
• Browser displays "Connection Timed Out" or "Request Timed Out"
• Applications fail to connect to online services
• Downloads stall or never begin
• Online games fail to connect to servers

Common Causes

Connection timeouts may be caused by:
• Server overload or outage
• Slow or unstable internet connection
• Firewall or security software blocking traffic
• VPN interference
• DNS resolution issues
• Network congestion
• Incorrect network configuration

Check Your Internet Connection

Verify that your device is connected to the internet.
Run a speed test or try visiting multiple websites to determine whether the issue affects only one service or your entire connection.

Test from Another Device

Attempt to access the same website or application from another device connected to the same network.
If the second device works, the issue is likely isolated to the original device.

Restart Network Equipment

Power cycle your modem and router.
Steps:
• Turn off the modem and router
• Wait 30 seconds
• Turn them back on
• Test the connection again

Disable VPN or Proxy Services

VPNs and proxy servers can sometimes block or slow connections to certain websites and services.
Temporarily disable them and test the connection again.

Check Firewall Settings

Firewalls may block traffic required for a website or application.
Temporarily disable the firewall for testing purposes. If the issue is resolved, review firewall rules and exceptions.
Note: Re-enable the firewall after testing.

Flush DNS Cache

A corrupted DNS cache may prevent your device from reaching the correct server.
Windows:
ipconfig /flushdns
macOS:
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

Test Connectivity with Ping

Use the ping command to verify that the destination is reachable.
Windows:
ping google.com
macOS:
ping google.com
If requests time out, the issue may be network-related or the destination server may be unavailable.

Check the Website or Service Status

The issue may be on the server side rather than your network.
Check whether the website or application is experiencing outages or maintenance.

Useful Commands

Use these commands during timeout troubleshooting:
ping google.com
ipconfig /flushdns
sudo dscacheutil -flushcache
tracert google.com
traceroute google.com
Command purposes:
• ping google.com: Test connectivity to a host
• ipconfig /flushdns: Clear DNS cache on Windows
• sudo dscacheutil -flushcache: Clear DNS cache on macOS
• tracert google.com: Identify where a connection is failing on Windows
• traceroute google.com: Identify where a connection is failing on macOS or Linux

Quick Troubleshooting Checklist

☐ Verify internet connection
☐ Test another device
☐ Restart modem and router
☐ Disable VPN or proxy
☐ Check firewall settings
☐ Flush DNS cache
☐ Run a ping test
☐ Check server status

Key Takeaway

If connection timeouts continue after these steps, the issue may be caused by your ISP, network equipment, or the remote server itself.
`,
  }, // end of network guide


  {
    slug: "how-to-configure-a-static-IP-address",
    title: "How to Configure a Static IP Address?",
    category: "Configuration",
    difficulty: "Intermediate",
    readTime: "10 min",
    description:
      "Learn how to set a static IP address on your device and understand when it is necessary to use one.",
      image: {
        src: "/images/staticIP.png",
        alt: "Static IP address diagram showing a device with a fixed IP address on a network.",
        caption: "A static IP address is a fixed address assigned to a device on a network.",
      },

    content: `
     How to Configure a Static IP Address?

A static IP address is a manually assigned IP address that remains the same over time instead of being automatically assigned by DHCP.
This guide provides step-by-step demonstrations on how to configure a static IP address on Windows, macOS, and through your router using DHCP Reservation.
[image:/images/configurestaticIP4.png|Windows Configuration|Windows Settings diagram showing how to set a static IP address.]
[image:/images/configurestaticIP3.png|MacOS Configuration|MacOS Settings diagram showing how to set a static IP address.]






Benefits of Using a Static IP Address

🖨️ Easier Access to Printers:
Network printers are easier to locate because their IP address remains the same. This prevents devices from losing connection to shared printers.
📂 Reliable File Sharing:
Shared folders, NAS devices, and media servers remain accessible at a consistent IP address, making network resources easier to find.
🎮 Better Port Forwarding:
Gaming consoles, security cameras, and self-hosted services work more reliably when port forwarding rules are assigned to a fixed IP address.
🌐 Simplified Remote Access:
Remote Desktop, SSH, VPN connections, and web servers are easier to configure when the destination device always uses the same IP address.
🔧 Easier Troubleshooting:
Static IP addresses make it easier to identify devices on a network, helping administrators diagnose connectivity issues more efficiently.
🏠 Improved Smart Home Reliability:
Security cameras, smart home hubs, IoT devices, and home automation systems often perform better when assigned a reserved IP address.


When Should You Use a Static IP Address?

A static IP address is recommended for:
• Routers
• Network Printers
• NAS Devices
• Security Cameras
• Web Servers
• Gaming Consoles (for port forwarding)
• Home Lab Equipment
• Smart Home Hubs


When You Should Use DHCP Instead?

DHCP is usually the better option for:
• Smartphones
• Tablets
• Guest Devices
• Laptops that move between networks
• Devices that do not require remote access or port forwarding

Pro Tip

Instead of manually configuring a static IP on every device, many home networks use DHCP Reservation on the router. This allows the router to automatically assign the same IP address to a specific device every time it connects, providing the benefits of a static IP while keeping DHCP enabled.


`,
  }, // end of network guide


  {
    slug: "How-to-Set-Up-a-DHCP-Server",
    title: "How to Set Up a DHCP Server?",
    category: "Configuration",
    difficulty: "Intermediate",
    readTime: "5 min",
    description:
      "Learn how to set up a DHCP server on your network to automatically assign IP addresses to devices.",
      image: {
        src: "/images/DHCPserver.png",
        alt: "DHCP server diagram showing a central server assigning IP addresses to devices on a network.",
        caption: "A DHCP server automatically assigns IP addresses to devices on a network, simplifying network management.",
      },

    content: `
     How to Set Up a DHCP Server?

[image:/images/configDHCPserver.png|Windows Configuration|Windows Settings diagram showing how to configure DHCP server settings.|portrait]

`,
  }, // end of network guide

  {
    slug: "How-to-Configure-Port-Forwarding",
    title: "How to Configure Port Forwarding?",
    category: "Configuration",
    difficulty: "Intermediate",
    readTime: "5 min",
    description:
      "Learn how to set up port forwarding on your router to allow external access to services running on your local network.",

    content: `
     How to Configure Port Forwarding?

[image:/images/PortForwarding.png|Port Forwarding|Configure Port Forwarding|portrait]

`,
  }, // end of network guide



]; // end of guides array
