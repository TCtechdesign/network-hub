"use client";

import { useEffect, useState } from "react";

const terminalScreens = [
`C:\\Users\\Admin> ping 8.8.8.8

Reply from 8.8.8.8:
bytes=32 time=12ms TTL=118
bytes=32 time=10ms TTL=118
bytes=32 time=11ms TTL=118
bytes=32 time=13ms TTL=118

Ping statistics:
Packets: Sent = 4, Received = 4, Lost = 0`,

`C:\\Users\\Admin> nslookup google.com

Server: 1.1.1.1
Address: 1.1.1.1

Name: google.com
Address: 142.250.191.14`,

`C:\\Users\\Admin> tracert google.com

Tracing route to google.com

1   192.168.0.1
2   104.x.x.x
3   172.x.x.x
4   142.250.191.14

Trace complete.`,

`C:\\Users\\Admin> arp -a

Interface: 192.168.0.25

Internet Address      Physical Address
192.168.0.1          34-ab-95-11-22-33
192.168.0.100        5c-62-8b-aa-bb-cc`
];

export default function Terminal() {
  const [screenIndex, setScreenIndex] = useState(0);
  const [text, setText] = useState("");

  useEffect(() => {
    let charIndex = 0;

    const currentScreen =
      terminalScreens[screenIndex];

    const typingInterval = setInterval(() => {
      setText(currentScreen.slice(0, charIndex));

      charIndex++;

      if (charIndex > currentScreen.length) {
        clearInterval(typingInterval);

        setTimeout(() => {
          setText("");

          setScreenIndex((prev) =>
            prev === terminalScreens.length - 1
              ? 0
              : prev + 1
          );
        }, 2500);
      }
    }, 25);

    return () => clearInterval(typingInterval);
  }, [screenIndex]);

  return (
    <div className="whitespace-pre-wrap font-mono text-[11px] leading-5 text-green-400">
      {text}

      <span className="animate-pulse">
        █
      </span>
    </div>
  );
}
