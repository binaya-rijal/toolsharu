"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Zap, Heart, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Generator Tools", href: "/generator-tools", icon: Zap },
  { name: "Donate", href: "/donate", icon: Heart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("flex flex-col h-screen bg-card border-r transition-all duration-300", isOpen ? "w-64" : "w-20")}>
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className={cn("font-bold text-xl truncate transition-all", !isOpen && "hidden")}>ToolsHaru.com</h1>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md hover:bg-accent">
          <Menu size={20} />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} />
              <span className={cn("truncate transition-all", !isOpen && "hidden")}>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
