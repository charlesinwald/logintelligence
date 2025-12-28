"use client"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { LogOut, ChevronDown, Crown, Settings, Zap } from "lucide-react"
import { useAuthStore } from "../../stores/authStore"

export function UserMenu() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuItemsRef = useRef<(HTMLButtonElement | null)[]>([])

  const isPro = user?.subscription?.tier === "pro"

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      const menuItems = menuItemsRef.current.filter(Boolean) as HTMLButtonElement[]
      if (menuItems.length === 0) return

      const currentIndex = menuItems.findIndex((item) => item === document.activeElement)
      let nextIndex = currentIndex

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault()
          nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0
          menuItems[nextIndex]?.focus()
          break
        case "ArrowUp":
          event.preventDefault()
          nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1
          menuItems[nextIndex]?.focus()
          break
        case "Home":
          event.preventDefault()
          menuItems[0]?.focus()
          break
        case "End":
          event.preventDefault()
          menuItems[menuItems.length - 1]?.focus()
          break
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && menuItemsRef.current[0]) {
      // Small delay to ensure menu is rendered
      setTimeout(() => {
        menuItemsRef.current[0]?.focus()
      }, 0)
    }
  }, [isOpen])

  if (!user) return null

  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
    navigate("/login")
  }

  const handleUpgrade = () => {
    setIsOpen(false)
    navigate("/upgrade")
  }

  const handleSettings = () => {
    setIsOpen(false)
    // TODO: Navigate to settings
  }

  const userInitials = user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()
  const userName = user.name || user.email.split("@")[0]

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted/70 border-2 border-primary/40 hover:border-primary/70 hover:bg-muted/90 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`User menu for ${userName}`}
      >
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
            <span className="text-sm font-bold text-primary-foreground">
              {userInitials}
            </span>
          </div>
          {isPro && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-warning flex items-center justify-center shadow-md ring-2 ring-background">
              <Crown className="w-2.5 h-2.5 text-background" />
            </div>
          )}
        </div>

        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
            {userName}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            {isPro ? (
              <>
                <Crown className="w-3 h-3 text-warning" />
                <span className="text-warning font-medium">Pro Plan</span>
              </>
            ) : (
              <span>Free Plan</span>
            )}
          </p>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-muted-foreground group-hover:text-primary transition-all duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          <div
            className="absolute right-0 mt-3 w-72 rounded-2xl glass-card border border-primary/30 shadow-2xl shadow-primary/20 py-2 z-50 animate-in fade-in slide-in-from-top-2"
            role="menu"
            aria-label="User menu"
          >
            {/* User Info Header */}
            <div className="px-4 py-4 border-b border-border/50 bg-linear-to-r from-primary/10 to-secondary/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                    <span className="text-base font-bold text-primary-foreground">
                      {userInitials}
                    </span>
                  </div>
                  {isPro && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-warning flex items-center justify-center shadow-md ring-2 ring-background">
                      <Crown className="w-2.5 h-2.5 text-background" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-md font-semibold text-white truncate">{userName}</p>
                  <p className="text-sm text-white/50 truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Plan Badge */}
            <div className="px-4 py-3 border-b border-border/50">
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                isPro 
                  ? "bg-linear-to-r from-warning/20 to-warning/10 border-2 border-warning/40" 
                  : "bg-muted/50 border-2 border-border/50"
              }`}>
                <div className="flex items-center gap-2.5">
                  <Crown className={`w-4 h-4 ${isPro ? "text-warning" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${isPro ? "text-warning" : "text-foreground"}`}>
                    {isPro ? "Pro Plan" : "Free Plan"}
                  </span>
                </div>
                {isPro && (
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-warning" />
                    <span className="text-xs px-2 py-0.5 rounded-full bg-warning/30 text-warning font-medium border border-warning/40">
                      Active
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2 space-y-0.5 cursor-pointer" role="group">
              {!isPro && (
                <button
                  ref={(el) => (menuItemsRef.current[0] = el)}
                  onClick={handleUpgrade}
                  className="w-full cursor-pointer flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-warning hover:bg-warning/10 focus-visible:bg-warning/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/60 transition-all duration-200 group rounded-lg mx-1"
                  role="menuitem"
                  aria-label="Upgrade to Pro plan"
                >
                  <Crown className="w-4 h-4 group-hover:scale-110 group-focus-visible:scale-110 transition-transform duration-200" />
                  <span>Upgrade to Pro</span>
                  <div className="ml-auto text-xs opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200">
                    →
                  </div>
                </button>
              )}

              {/* <button
                ref={(el) => (menuItemsRef.current[!isPro ? 1 : 0] = el)}
                onClick={handleSettings}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-all duration-200 group rounded-lg mx-1"
                role="menuitem"
                aria-label="Open settings"
              >
                <Settings className="w-4 h-4 group-hover:rotate-90 group-focus-visible:rotate-90 transition-transform duration-300" />
                <span>Settings</span>
              </button> */}

              <button
                ref={(el) => (menuItemsRef.current[!isPro ? 2 : 1] = el)}
                onClick={handleLogout}
                className="w-full cursor-pointer flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/60 transition-all duration-200 group rounded-lg mx-1"
                role="menuitem"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 transition-transform duration-200" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
