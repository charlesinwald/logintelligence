import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Crown, Check, Zap, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { createCheckoutSession } from "../api/subscriptions";
import { DottedSurface } from "../components/ui/dotted-surface";

export function UpgradePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, accessToken, refreshUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isPro = user?.subscription?.tier === "pro";
  const successParam = searchParams.get("success");
  const canceledParam = searchParams.get("canceled");

  useEffect(() => {
    if (successParam === "true") {
      setSuccess(true);
      // Refresh user data to get updated subscription
      setTimeout(async () => {
        await refreshUser();
        // Small delay to show success message, then redirect
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }, 1000);
    }
  }, [successParam, refreshUser, navigate]);

  const handleUpgrade = async () => {
    if (!accessToken) {
      setError("Please log in to upgrade");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { url } = await createCheckoutSession(accessToken);
      if (url) {
        window.location.href = url;
      } else {
        setError("Failed to create checkout session");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setIsLoading(false);
    }
  };

  const proFeatures = [
    "Unlimited error tracking",
    "Advanced AI-powered analysis",
    "Real-time pattern detection",
    "Priority support",
    "Custom alerting rules",
    "Export capabilities",
    "API access",
    "Team collaboration",
  ];

  if (isPro) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <DottedSurface className="max-w-2xl w-full glass-card rounded-3xl p-8 md:p-12 border-2 border-primary/30">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-warning/20 to-warning/10 border-2 border-warning/40 flex items-center justify-center">
                <Crown className="w-10 h-10 text-warning" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">
              You're Already Pro!
            </h1>
            <p className="text-muted-foreground text-lg">
              You have an active Pro subscription. Enjoy all the premium features!
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </DottedSurface>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">
            Upgrade to Pro
          </h1>
          <p className="text-muted-foreground text-lg">
            Unlock the full power of LogIntelligence
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-success/20 border-2 border-success/40 rounded-lg flex items-center gap-3">
            <Check className="w-5 h-5 text-success" />
            <p className="text-success font-medium">
              Payment successful! Your subscription is being activated...
            </p>
          </div>
        )}

        {/* Canceled Message */}
        {canceledParam === "true" && (
          <div className="mb-6 p-4 bg-muted/50 border-2 border-border/50 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
            <p className="text-muted-foreground">
              Checkout was canceled. You can try again anytime.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/20 border-2 border-destructive/40 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-destructive">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <DottedSurface className="glass-card rounded-2xl p-8 border-2 border-border/50">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Free Plan</h2>
                <div className="text-4xl font-bold mb-1">$0</div>
                <p className="text-muted-foreground">per month</p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Basic error tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Limited AI analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Standard support</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/")}
                className="w-full px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                disabled
              >
                Current Plan
              </button>
            </div>
          </DottedSurface>

          {/* Pro Plan */}
          <DottedSurface className="glass-card rounded-2xl p-8 border-2 border-warning/40 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <div className="px-3 py-1 bg-warning/20 border border-warning/40 rounded-full">
                <span className="text-xs font-medium text-warning flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  RECOMMENDED
                </span>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-6 h-6 text-warning" />
                  <h2 className="text-2xl font-bold">Pro Plan</h2>
                </div>
                <div className="text-4xl font-bold mb-1">$29</div>
                <p className="text-muted-foreground">per month</p>
              </div>
              <ul className="space-y-3">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-warning" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleUpgrade}
                disabled={isLoading || success}
                className="w-full px-6 py-3 bg-warning text-background rounded-lg hover:bg-warning/90 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed pulse-glow"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    <span>Upgrade to Pro</span>
                  </>
                )}
              </button>
            </div>
          </DottedSurface>
        </div>

        {/* Additional Info */}
        <div className="mt-12 max-w-3xl mx-auto">
          <DottedSurface className="glass-card rounded-2xl p-6 border-2 border-border/50">
            <h3 className="text-xl font-bold mb-4">Why Upgrade?</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning" />
                  Advanced Analytics
                </h4>
                <p className="text-sm text-muted-foreground">
                  Get deeper insights with AI-powered error classification and pattern detection.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-warning" />
                  Priority Support
                </h4>
                <p className="text-sm text-muted-foreground">
                  Get faster response times and dedicated support for your team.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning" />
                  Unlimited Scale
                </h4>
                <p className="text-sm text-muted-foreground">
                  Track unlimited errors without restrictions or rate limits.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-warning" />
                  Custom Integrations
                </h4>
                <p className="text-sm text-muted-foreground">
                  Connect with your existing tools via API and webhooks.
                </p>
              </div>
            </div>
          </DottedSurface>
        </div>
      </div>
    </div>
  );
}

