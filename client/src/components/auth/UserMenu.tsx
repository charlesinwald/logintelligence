import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, Crown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  if (!user) return null;

  const isPro = user.subscription?.tier === 'pro';

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/70 border border-primary/30 hover:border-primary/60 transition-all transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <span className="text-sm font-semibold text-white">
            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </span>
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium">{user.name || user.email.split('@')[0]}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {isPro && <Crown className="w-3 h-3 text-warning" />}
            {isPro ? 'Pro' : 'Free'} Plan
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg glass-card border border-primary/30 shadow-lg py-1 z-50">
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-sm font-medium">{user.name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>

          {!isPro && (
            <div className="py-1 border-b border-border/50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to upgrade page
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-warning hover:bg-muted/50 transition-colors duration-200 ease-in-out rounded-md"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Pro
              </button>
            </div>
          )}

          <div className="py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors duration-200 ease-in-out rounded-md"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
