"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { useAuth } from "./providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Moon, Sun, Menu, LogOut, UserIcon } from "lucide-react"
import { useTheme } from "next-themes"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/lost", label: "Lost" },
  { href: "/found", label: "Found" },
  { href: "/dashboard", label: "Dashboard" },
]

export function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const linkCls = (href: string) =>
    `text-sm font-medium hover:text-primary transition ${pathname === href ? "text-primary" : "text-muted-foreground"}`

  function handleLogoClick() {
    if (!user) {
      if (typeof window !== "undefined") {
        window.alert("Please login or register first")
      }
      router.push("/login")
      return
    }
    router.push("/dashboard")
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={handleLogoClick}
          className="font-semibold text-xl text-balance text-left hover:opacity-90"
          aria-label="Lost and Found - go to dashboard if logged in, otherwise to login"
        >
          Lost&Found🔎
        </button>

        <nav className="hidden gap-6 md:flex">
          {navItems.map((n) => (
            <Link key={n.href} href={n.href} className={linkCls(n.href)}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              // simple client-side admin gate
              const id = typeof window !== "undefined" ? window.prompt("Enter Admin ID:") : null
              if (!id) return
              const num = typeof window !== "undefined" ? window.prompt("Enter Admin Number:") : null
              if (!num) return
              if (id === "0235BCA019" && num === "230812010158") {
                router.push("/admin")
              } else {
                if (typeof window !== "undefined") window.alert("Access denied: invalid admin credentials")
              }
            }}
          >
            Admin
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle dark mode"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {!user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="outline" onClick={() => router.push("/login")}>
                Login
              </Button>
              <Button onClick={() => router.push("/register")}>Register</Button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                <UserIcon className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button variant="destructive" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden bg-transparent" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-4">
                {navItems.map((n) => (
                  <Link key={n.href} href={n.href} className={linkCls(n.href)} onClick={() => setOpen(false)}>
                    {n.label}
                  </Link>
                ))}
                <Separator />
                {!user ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOpen(false)
                        router.push("/login")
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      onClick={() => {
                        setOpen(false)
                        router.push("/register")
                      }}
                    >
                      Register
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOpen(false)
                        router.push("/dashboard")
                      }}
                    >
                      <UserIcon className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setOpen(false)
                        logout()
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
