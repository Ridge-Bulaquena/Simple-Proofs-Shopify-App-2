"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Layout, FileText, Package, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

interface MobileNavProps {
  storeName: string
}

export function MobileNav({ storeName }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  const navItems = [
    {
      name: "Orders",
      href: "/dashboard/orders",
      icon: Package,
    },
    {
      name: "Run Sheet",
      href: "/dashboard/run-sheet",
      icon: FileText,
    },
    {
      name: "Proof History",
      href: "/dashboard/proof-history",
      icon: Layout,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <Link href="/dashboard" className="font-bold text-xl">
          {storeName}
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={toggleMenu}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {isOpen && (
        <div className="fixed inset-0 top-[65px] z-50 bg-background border-t">
          <nav className="flex flex-col p-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-md",
                  pathname.startsWith(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}
