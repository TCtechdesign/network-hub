import { guides as defaultGuides, type Guide } from "@/data/guides";

export const guideCategoryNames = [
  "Networking Basics",
  "Connectivity",
  "Troubleshooting",
  "Security",
  "Performance",
  "Configuration",
  "Wireless",
  "Protocols",
  "Monitoring",
] as const;

const categoryDetails: Record<
  string,
  {
    description: string;
    command: string;
  }
> = {
  "Networking Basics": {
    description: "Learn fundamental networking concepts and terminology.",
    command: "ipconfig /all",
  },
  Connectivity: {
    description: "Understand how devices connect and communicate.",
    command: "traceroute google.com",
  },
  Troubleshooting: {
    description: "Step-by-step solutions for common network issues.",
    command: "ping 8.8.8.8",
  },
  Security: {
    description: "Secure your network and protect against threats.",
    command: "nmap -sV 192.168.1.1",
  },
  Performance: {
    description: "Optimize and monitor your network performance.",
    command: "iperf3 -c 192.168.1.1",
  },
  Configuration: {
    description: "Configure devices and services like a pro.",
    command: "show running-config",
  },
  Wireless: {
    description: "Set up and troubleshoot wireless networks.",
    command: "iwconfig",
  },
  Protocols: {
    description: "Deep dive into network protocols and how they work.",
    command: "tcpdump -i eth0",
  },
  Monitoring: {
    description: "Monitor network state, traffic, and device health.",
    command: "netstat -an",
  },
};

export function slugifyGuideCategory(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sortCategories(a: string, b: string) {
  const categoryOrder = [...guideCategoryNames];
  const aIndex = categoryOrder.indexOf(a as (typeof guideCategoryNames)[number]);
  const bIndex = categoryOrder.indexOf(b as (typeof guideCategoryNames)[number]);

  if (aIndex === -1 && bIndex === -1) {
    return a.localeCompare(b);
  }

  if (aIndex === -1) {
    return 1;
  }

  if (bIndex === -1) {
    return -1;
  }

  return aIndex - bIndex;
}

export function getGuideCategories(guides: Guide[] = defaultGuides) {
  const categoryMap = guides.reduce<Map<string, Guide[]>>((map, guide) => {
    const categoryGuides = map.get(guide.category) ?? [];
    categoryGuides.push(guide);
    map.set(guide.category, categoryGuides);

    return map;
  }, new Map());

  return Array.from(categoryMap.entries())
    .sort(([a], [b]) => sortCategories(a, b))
    .map(([name, categoryGuides]) => {
      const details = categoryDetails[name] ?? {
        description: `Browse ${name.toLowerCase()} guides.`,
        command: categoryGuides[0]?.title ?? "View guide",
      };
      const slug = slugifyGuideCategory(name);

      return {
        name,
        slug,
        href: `/guides/category/${slug}`,
        count: categoryGuides.length,
        guides: categoryGuides,
        ...details,
      };
    });
}

export function getGuideCategoryBySlug(
  categorySlug: string,
  guides: Guide[] = defaultGuides
) {
  return getGuideCategories(guides).find(
    (category) => category.slug === categorySlug
  );
}

export function getGuidesByCategorySlug(
  categorySlug: string,
  guides: Guide[] = defaultGuides
) {
  const category = getGuideCategoryBySlug(categorySlug, guides);

  return category?.guides ?? [];
}
