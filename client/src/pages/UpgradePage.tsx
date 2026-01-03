"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Crown, Check, Zap, Loader2, ArrowLeft, AlertCircle, Sparkles } from "lucide-react"
import { useAuthStore } from "../stores/authStore"
import { createCheckoutSession } from "../api/subscriptions"
import { DottedSurface } from "../components/ui/dotted-surface"

export function UpgradePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, accessToken, refreshUser, verifySession } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const isPro = user?.subscription?.tier === "pro"
  const successParam = searchParams.get("success")
  const sessionId = searchParams.get("session_id")
  const canceledParam = searchParams.get("canceled")

  useEffect(() => {
    if (successParam === "true" && sessionId) {
      setSuccess(true)
      setVerifying(true)

      // Verify the checkout session with Stripe
      verifySession(sessionId)
        .then(() => {
          console.log('[UpgradePage] Session verified successfully')
          setVerifying(false)
          setTimeout(() => {
            navigate("/")
          }, 1500)
        })
        .catch((error) => {
          console.error('[UpgradePage] Failed to verify session:', error)
          setVerifying(false)
          setError('Failed to verify payment. Please contact support.')
        })
    } else if (successParam === "true") {
      // Fallback: just refresh user data if no session_id
      setSuccess(true)
      setTimeout(async () => {
        await refreshUser()
        setTimeout(() => {
          navigate("/")
        }, 1500)
      }, 1000)
    }
  }, [successParam, sessionId, verifySession, refreshUser, navigate])

  const handleUpgrade = async () => {
    if (!accessToken) {
      setError("Please log in to upgrade")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { url } = await createCheckoutSession(accessToken)
      if (url) {
        window.location.href = url
      } else {
        setError("Failed to create checkout session")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout")
    } finally {
      setIsLoading(false)
    }
  }

  const proFeatures = [
    "Unlimited error tracking",
    "Advanced AI-powered analysis",
    "Real-time pattern detection",
    "Priority support",
    "Custom alerting rules",
    "Export capabilities",
    "API access",
    "Team collaboration",
  ]

  if (isPro) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <style>{scrollbarStyles}</style>
        <DottedSurface
          theme="dark"
          variant="premium"
          animationSpeed={0.03}
          waveAmplitude={70}
          waveFrequency={0.15}
        />

        {/* Premium gradient overlay - same as main upgrade page */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Center radial gradient - warning glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[radial-gradient(ellipse_at_center,oklch(0.75_0.2_85/0.18),transparent_70%)]" />

          {/* Left accent */}
          <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,oklch(0.7_0.24_328/0.12),transparent_60%)]" />

          {/* Right accent */}
          <div className="absolute top-1/2 right-0 w-[450px] h-[450px] bg-[radial-gradient(ellipse_at_center,oklch(0.65_0.25_264/0.1),transparent_60%)]" />
        </div>

        <div className="max-w-2xl w-full relative z-10">
          <div className="glass-card rounded-3xl border-2 border-warning/30 p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,oklch(0.75_0.2_85/0.1),transparent_50%)] rounded-3xl" />
            <div className="relative z-10 text-center space-y-8">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse bg-warning/20 rounded-full blur-2xl" />
                  <div className="relative w-24 h-24 rounded-full bg-linear-to-br from-warning to-warning/80 flex items-center justify-center">
                    <Crown className="w-12 h-12 text-background" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold gradient-text">
                  You're Already on the Pro Plan!
                </h1>
                <p className="text-muted-foreground text-xl leading-relaxed max-w-md mx-auto">
                  You have an active Pro subscription. Enjoy all the premium features at your fingertips.
                </p>
              </div>
              <button
                onClick={() => navigate("/")}
                className="group relative px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 glow-primary"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <style>{scrollbarStyles}</style>
      <DottedSurface
        theme="dark"
        variant="premium"
        animationSpeed={0.03}
        waveAmplitude={50}
        waveFrequency={0.10}
      />

      {/* Premium gradient overlay - significantly different from dashboard */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Top radial gradient - purple/warning glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[800px] bg-[radial-gradient(ellipse_at_center,oklch(0.75_0.2_85/0.15),transparent_70%)]" />

        {/* Left side accent */}
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,oklch(0.7_0.24_328/0.12),transparent_65%)]" />

        {/* Right side accent */}
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,oklch(0.65_0.25_264/0.1),transparent_60%)]" />

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[400px] bg-[radial-gradient(ellipse_at_center,oklch(0.75_0.2_85/0.08),transparent_70%)]" />

        {/* Subtle grid overlay for depth */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(oklch(0.75 0.2 85 / 0.3) 1px, transparent 1px),
              linear-gradient(90deg, oklch(0.75 0.2 85 / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-12 max-w-7xl relative z-10">
        {/* Header */}
        <div className="mb-16">
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 text-muted-foreground hover:text-muted transition-all duration-300 mb-10"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-warning/30 bg-warning/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium text-warning">Limited Time Offer</span>
            </div>
            {UpgradeTitle()}
            <p className="text-muted-foreground text-xl leading-relaxed">
              Unlock the full power of LogIntelligence with advanced AI-powered error tracking and unlimited scale
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="glass-card rounded-2xl border-2 border-success/30 p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,oklch(0.7_0.2_150/0.1),transparent_50%)] rounded-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  {verifying ? (
                    <Loader2 className="w-6 h-6 text-success animate-spin" />
                  ) : (
                    <Check className="w-6 h-6 text-success" />
                  )}
                </div>
                <div>
                  <p className="text-success font-semibold text-lg">
                    {verifying ? "Verifying Payment..." : "Payment Successful!"}
                  </p>
                  <p className="text-success/70 text-sm">
                    {verifying ? "Syncing your subscription from Stripe..." : "Your subscription has been activated!"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Canceled Message */}
        {canceledParam === "true" && (
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="glass-card rounded-2xl border-2 border-border/50 p-6">
              <div className="flex items-center gap-4">
                <AlertCircle className="w-6 h-6 text-muted-foreground" />
                <p className="text-muted">Checkout was canceled. You can try again anytime.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="glass-card rounded-2xl border-2 border-destructive/30 p-6">
              <div className="flex items-center gap-4">
                <AlertCircle className="w-6 h-6 text-destructive" />
                <p className="text-destructive">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-20">
          {/* Free Plan */}
          <div className="relative group">
            <div className="glass-card rounded-3xl border-2 border-border/50 p-10 hover:border-primary/30 transition-all duration-300">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-block px-3 py-1 rounded-full bg-muted/50 border border-border/50">
                    <span className="text-xs font-semibold text-black uppercase tracking-wider">Free</span>
                  </div>
                  <div>
                    <div className="text-5xl font-bold gradient-text mb-2">$0</div>
                    <p className="text-muted-foreground">per month</p>
                  </div>
                  <p className="text-muted/80 leading-relaxed">
                    Perfect for individuals getting started with error tracking
                  </p>
                </div>

                <div className="h-px bg-linear-to-r from-transparent via-border to-transparent" />

                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-muted/80">Basic error tracking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-muted/80">Limited AI analysis</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-muted/80">Standard support</span>
                  </li>
                </ul>

                <button
                  disabled
                  className="w-full px-6 py-4 bg-muted/50 text-black rounded-xl font-semibold cursor-not-allowed border-2 border-border/50"
                >
                  Current Plan
                </button>
              </div>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="relative group">
            <div className="absolute inset-0 bg-linear-to-b from-warning/20 to-warning/10 rounded-3xl blur-2xl transition-all duration-500 group-hover:blur-3xl" />
            <div className="relative glass-card rounded-3xl border-2 border-warning/30 p-10 hover:border-warning/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(circle,oklch(0.75_0.2_85/0.15),transparent_70%)] rounded-3xl" />

              <div className="absolute top-6 right-6">
                <div className="px-4 py-1.5 rounded-full bg-linear-to-r from-warning to-warning/80 shadow-lg">
                  <span className="text-xs font-bold text-background uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Recommended
                  </span>
                </div>
              </div>

              <div className="relative space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-warning to-warning/80 flex items-center justify-center shadow-lg">
                      <Crown className="w-6 h-6 text-background" />
                    </div>
                    <div className="inline-block px-3 py-1 rounded-full bg-warning/10 border border-warning/30">
                      <span className="text-xs font-semibold text-warning uppercase tracking-wider">Pro</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-5xl font-bold gradient-text mb-2">$4.99</div>
                    <p className="text-muted-foreground">per month</p>
                  </div>
                  <p className="text-muted leading-relaxed">
                    Everything you need for professional error tracking at scale
                  </p>
                </div>

                <div className="h-px bg-linear-to-r from-transparent via-warning/30 to-transparent" />

                <ul className="space-y-4">
                  {proFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-warning/20 flex items-center justify-center mt-0.5 shrink-0">
                        <Check className="w-3 h-3 text-warning" />
                      </div>
                      <span className="text-muted">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleUpgrade}
                  disabled={isLoading || success}
                  className="group/btn relative w-full px-6 py-4 bg-linear-to-r from-warning to-warning/80 text-background rounded-xl hover:from-warning/90 hover:to-warning/70 transition-all duration-300 font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                      <span className="relative z-10">Processing...</span>
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5 relative z-10" />
                      <span className="relative z-10">Upgrade to Pro</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="max-w-6xl mx-auto">
          <div className="glass-card rounded-3xl border-2 border-border/50 p-10">
            <div className="space-y-8">
              <div className="text-center space-y-3">
                <h3 className="text-3xl font-bold gradient-text">Why Upgrade?</h3>
                <p className="text-muted-foreground text-lg">Unlock premium features designed for professional teams</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="group space-y-3 p-6 rounded-2xl bg-black border-2 border-border/30 hover:border-primary/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform glow-primary">
                    <Zap className="w-6 h-6 text-card" />
                  </div>
                  <h4 className="text-xl font-semibold text-card">Advanced Analytics</h4>
                  <p className="text-muted/80 leading-relaxed">
                    Get deeper insights with AI-powered error classification and real-time pattern detection across your
                    entire stack.
                  </p>
                </div>

                <div className="group space-y-3 p-6 rounded-2xl bg-black border-2 border-border/30 hover:border-warning/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-warning/20 to-warning/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Crown className="w-6 h-6 text-card" />
                  </div>
                  <h4 className="text-xl font-semibold text-card">Priority Support</h4>
                  <p className="text-muted/80 leading-relaxed">
                    Get faster response times and dedicated support from our expert team to keep your systems running
                    smoothly.
                  </p>
                </div>

                <div className="group space-y-3 p-6 rounded-2xl bg-black border-2 border-border/30 hover:border-accent/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-accent/20 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform glow-accent">
                    <Sparkles className="w-6 h-6 text-card" />
                  </div>
                  <h4 className="text-xl font-semibold text-card">Unlimited Scale</h4>
                  <p className="text-muted/80 leading-relaxed">
                    Track unlimited errors without restrictions or rate limits. Perfect for high-traffic applications.
                  </p>
                </div>

                    <div className="group space-y-3 p-6 rounded-2xl bg-black border-2 border-border/30 hover:border-secondary/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-secondary/20 to-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform glow-secondary">
                    <Zap className="w-6 h-6 text-card" />
                  </div>
                  <h4 className="text-xl font-semibold text-card">Custom Integrations</h4>
                  <p className="text-muted/80 leading-relaxed">
                    Connect with your existing tools via our powerful API and webhooks for seamless workflow
                    integration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
function UpgradeTitle() {
  const containerRef = useRef<HTMLHeadingElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const charRefs = useRef<(HTMLSpanElement | null)[]>([])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLHeadingElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    })
  }, [])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setMousePosition({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    if (!isHovered) {
      // Reset all characters when not hovered
      charRefs.current.forEach((charRef) => {
        if (charRef) {
          charRef.style.transform = 'translate(0, 0) rotate(0deg) scale(1)'
          charRef.style.transition = 'transform 0.3s ease-out'
          charRef.style.filter = 'blur(0px)'
        }
      })
      return
    }

    const animate = () => {
      if (!isHovered || !containerRef.current) return
      
      const containerRect = containerRef.current.getBoundingClientRect()
      const containerCenterX = containerRect.left + containerRect.width / 2
      const containerCenterY = containerRect.top + containerRect.height / 2
      
      charRefs.current.forEach((charRef) => {
        if (!charRef) return
        
        const charRect = charRef.getBoundingClientRect()
        const charCenterX = charRect.left + charRect.width / 2
        const charCenterY = charRect.top + charRect.height / 2
        
        // Distance from mouse to character center
        const dx = (containerCenterX + mousePosition.x) - charCenterX
        const dy = (containerCenterY + mousePosition.y) - charCenterY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        const maxDistance = 150
        const intensity = Math.max(0, 1 - distance / maxDistance)
        
        // Magnetic effect: characters are repelled from mouse
        const angle = Math.atan2(dy, dx)
        const repelDistance = intensity * 20
        const offsetX = -Math.cos(angle) * repelDistance
        const offsetY = -Math.sin(angle) * repelDistance
        
        // Add rotation and scale effects
        const rotation = intensity * 8 * (Math.random() > 0.5 ? 1 : -1)
        const scale = 1 + intensity * 0.15
        
        // Add subtle blur for depth
        const blur = intensity * 2
        
        charRef.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg) scale(${scale})`
        charRef.style.filter = `blur(${blur}px)`
        charRef.style.transition = 'transform 0.15s ease-out, filter 0.15s ease-out'
      })
      
      requestAnimationFrame(animate)
    }
    
    const animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [mousePosition, isHovered])

  const text = "Upgrade to Pro"
  const chars = text.split("")

  return (
    <h1
      ref={containerRef}
      className="text-6xl md:text-7xl font-bold gradient-text leading-tight cursor-none select-none"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {chars.map((char, i) => (
        <span
          key={i}
          ref={(el) => {
            charRefs.current[i] = el
          }}
          className="inline-block relative transition-all duration-300 gradient-text"
          style={{
            animationDelay: `${i * 0.05}s`,
            animation: 'slideUp 0.6s ease-out forwards',
            textShadow: isHovered 
              ? '0 0 20px oklch(0.65 0.25 264 / 0.5), 0 0 40px oklch(0.7 0.24 328 / 0.3)'
              : 'none',
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </h1>
  )
}

// Add dark modern scrollbar styles
const scrollbarStyles = `
  /* Webkit browsers (Chrome, Safari, Edge) */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: oklch(0.15 0 0);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: oklch(0.3 0 0);
    border-radius: 4px;
    transition: background 0.2s ease;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: oklch(0.4 0 0);
  }

  ::-webkit-scrollbar-thumb:active {
    background: oklch(0.45 0 0);
  }

  /* Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: oklch(0.3 0 0) oklch(0.15 0 0);
  }
`

