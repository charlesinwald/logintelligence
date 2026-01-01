# Subscription Hooks Usage Guide

This guide shows you how to use the subscription hooks throughout your application to check and sync subscription status from Stripe.

## Available Hooks

### 1. `useSubscription()`
Get the current user's subscription data.

```typescript
import { useSubscription } from '@/stores/authStore';

function MyComponent() {
  const subscription = useSubscription();

  return (
    <div>
      <p>Tier: {subscription?.tier}</p>
      <p>Status: {subscription?.status}</p>
    </div>
  );
}
```

### 2. `useIsPro()`
Check if the user has an active Pro subscription.

```typescript
import { useIsPro } from '@/stores/authStore';

function ProFeature() {
  const isPro = useIsPro();

  if (!isPro) {
    return <UpgradePrompt />;
  }

  return <PremiumFeature />;
}
```

### 3. `useSyncSubscription()`
Manually sync subscription status from Stripe.

```typescript
import { useSyncSubscription } from '@/stores/authStore';

function SettingsPage() {
  const syncSubscription = useSyncSubscription();

  const handleSync = async () => {
    try {
      await syncSubscription();
      alert('Subscription synced!');
    } catch (error) {
      alert('Failed to sync subscription');
    }
  };

  return (
    <button onClick={handleSync}>
      Sync Subscription from Stripe
    </button>
  );
}
```

### 4. `useVerifySession()`
Verify a Stripe checkout session (used after payment).

```typescript
import { useVerifySession } from '@/stores/authStore';

function PaymentSuccessPage() {
  const verifySession = useVerifySession();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      verifySession(sessionId)
        .then(() => console.log('Payment verified!'))
        .catch(err => console.error('Verification failed:', err));
    }
  }, []);

  return <div>Processing payment...</div>;
}
```

## Common Use Cases

### Protecting Pro Features

```typescript
import { useIsPro } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';

function ProOnlyRoute({ children }) {
  const isPro = useIsPro();

  if (!isPro) {
    return <Navigate to="/upgrade" />;
  }

  return children;
}
```

### Conditional Rendering

```typescript
import { useSubscription } from '@/stores/authStore';

function FeatureList() {
  const subscription = useSubscription();
  const isPro = subscription?.tier === 'pro';

  return (
    <div>
      <Feature name="Basic Tracking" available={true} />
      <Feature name="Advanced Analytics" available={isPro} />
      <Feature name="API Access" available={isPro} />
    </div>
  );
}
```

### Subscription Badge

```typescript
import { useSubscription } from '@/stores/authStore';

function UserMenu() {
  const subscription = useSubscription();

  return (
    <div>
      <span>
        {subscription?.tier === 'pro' ? '👑 Pro' : '🆓 Free'}
      </span>
    </div>
  );
}
```

### Manual Sync Button

```typescript
import { useSyncSubscription } from '@/stores/authStore';

function SubscriptionSettings() {
  const syncSubscription = useSyncSubscription();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncSubscription();
      toast.success('Subscription synced!');
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button onClick={handleSync} disabled={syncing}>
      {syncing ? 'Syncing...' : 'Sync from Stripe'}
    </button>
  );
}
```

## Automatic Sync After Payment

The UpgradePage automatically:
1. Detects the `session_id` parameter after Stripe redirect
2. Calls `verifySession()` to verify the payment
3. Updates the subscription in the database
4. Refreshes the user data
5. Redirects to the dashboard

No manual intervention needed!

## API Endpoints Used

- `POST /api/subscriptions/sync` - Syncs subscription from Stripe
- `POST /api/subscriptions/verify-session` - Verifies checkout session
- `GET /api/auth/me` - Gets current user with subscription

## Notes

- All hooks automatically handle authentication
- Subscription data is cached in Zustand store
- `refreshUser()` is called automatically after sync/verify
- Hooks return `undefined` if user is not authenticated
