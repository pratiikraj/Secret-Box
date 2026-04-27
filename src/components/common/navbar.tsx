"use client"

import React, { useId, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { User } from "next-auth"
import UserMenu from "@/components/user-menu"
import NotificationMenu from "@//components/notification-menu"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler"

const navigationLinks = [
  { href: "#home", label: "Home" },
  { href: "#confession", label: "Confession" },
  { href: "#features", label: "Features" },
  { href: "#get-started", label: "Get Started" },
]

export default function Navbar() {
  const { data: session, status } = useSession()
  const user: User = session?.user
  const id = useId()
  const pathname = usePathname()
  const router = useRouter()

  const scrollToSection = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const sectionId = href.replace("#", "")

    // If we're not on the home page, navigate there first with the hash
    if (pathname !== "/") {
      router.push("/" + href)
      return
    }

    if (sectionId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    const element = document.getElementById(sectionId)
    if (element) {
      const navbarHeight = 64 // h-16 = 4rem = 64px
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      window.scrollTo({
        top: elementPosition - navbarHeight,
        behavior: "smooth",
      })
    }
  }, [pathname, router])

  const scrollToTopHandler = () => {
    if (pathname !== "/") {
      router.push("/")
      return
    }
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur border-b ">
      <div className="flex h-16 items-center justify-between gap-4 mx-auto max-w-6xl px-4 md:px-6">
        {/* Left side */}
        <div className="flex items-center gap-8">
          {/* Mobile menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button className="group size-8 md:hidden" variant="ghost" size="icon">
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12H20" />
                  <path d="M4 6H20" />
                  <path d="M4 18H20" />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-36 p-1 md:hidden">
              <NavigationMenu className="max-w-none *:w-full">
                <NavigationMenuList className="flex-col items-start gap-2">
                  {navigationLinks.map((link, idx) => (
                    <NavigationMenuItem key={idx} className="w-full">
                      <NavigationMenuLink
                        href={link.href}
                        className="py-1.5"
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => scrollToSection(e, link.href)}
                      >
                        {link.label}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </PopoverContent>
          </Popover>

          {/* Logo */}
          <Link href="/" className="text-primary hover:text-primary/90 " onClick={(e) => { e.preventDefault(); scrollToTopHandler(); }}>
            <span
            className="font-semibold text-xl text-primary"
            >
              SECRET BOX
            </span>
          </Link>

          {/* Desktop navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="gap-4">
              {navigationLinks.map((link, idx) => (
                <NavigationMenuItem key={idx}>
                  <NavigationMenuLink
                    href={link.href}
                    className="text-muted-foreground hover:text-primary font-medium py-1.5"
                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => scrollToSection(e, link.href)}
                  >
                    {link.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
            <div className="flex items-center gap-2 ">
            <AnimatedThemeToggler />
            </div>
          {/* Notification */}
          <div className="flex items-center gap-2 cursor-pointer">
            <NotificationMenu />
          </div>

          {/* User / Login */}
            { status !== "loading"?  (!user ? (
                <Button asChild><Link href="/auth/signin-signup">Sign In</Link></Button>
            ) : (
              <>
              <div className="">
                <UserMenu user={user}/>
              </div>
              </>
            )) : (<></>)}
        </div>
      </div>
    </header>
  )
}

