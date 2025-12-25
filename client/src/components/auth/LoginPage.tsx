import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { DottedSurface } from '../ui/dotted-surface';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { googleLogin, isLoading, error, clearError } = useAuthStore();

  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      return;
    }

    clearError();
    try {
      await googleLogin(credentialResponse.credential);
      navigate(from, { replace: true });
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <DottedSurface theme="dark" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-gradient-to-br from-glow-primary/30 to-glow-secondary/30 glow-primary mb-4">
            <Zap className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">LogIntelligence</h1>
          <p className="text-muted-foreground">Sign in to your dashboard</p>
        </div>

        <div className="glass-card rounded-2xl border border-primary/30 p-8">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/20 border border-destructive/40 text-destructive mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground mb-2">
              Continue with your Google account
            </p>

            <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  useAuthStore.setState({ error: 'Google sign-in failed' });
                }}
                type="icon"
                shape="circle"
              />
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
