"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Library" },
  { href: "/map", label: "Map" },
];

export function NavSegment() {
  const pathname = usePathname();

  return (
    <div
      className="inline-flex rounded-[10px] border p-1"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      {ITEMS.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="rounded-[7px] px-3.5 py-1.5 text-[13px] font-medium no-underline transition-colors"
            style={{
              background: active ? "var(--accent)" : "transparent",
              color: active ? "#fff" : "var(--muted)",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
