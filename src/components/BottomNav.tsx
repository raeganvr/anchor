"use client";

import { Home, History, MessageCircle, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: History, label: "History", path: "/log" },
  { icon: Settings, label: "Settings", path: "/settings" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-6 py-4">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? pathname === "/"
              : pathname === item.path || pathname.startsWith(`${item.path}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex min-w-[80px] flex-col items-center gap-1 py-2"
            >
              <Icon
                size={28}
                strokeWidth={1.5}
                className={isActive ? "text-[#1F6B66]" : "text-gray-400"}
              />
              <span
                className={`text-xs ${
                  isActive ? "text-[#1F6B66]" : "text-gray-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
