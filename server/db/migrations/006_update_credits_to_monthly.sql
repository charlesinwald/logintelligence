-- Migration: Update credits system from daily to monthly limits
-- Converts existing credits records to use monthly reset dates (YYYY-MM format)
-- Resets credits for all users to their monthly limit based on subscription tier

-- Update last_reset_date format from YYYY-MM-DD to YYYY-MM for all credits records
UPDATE credits
SET last_reset_date = strftime('%Y-%m', 'now')
WHERE length(last_reset_date) = 10; -- Only update if it's in YYYY-MM-DD format

-- Reset credits to monthly limits based on subscription tier
-- Free tier: 100 credits/month
-- Pro tier: 9999 credits/month (effectively unlimited)
UPDATE credits
SET remaining_credits = CASE
  WHEN EXISTS (
    SELECT 1 FROM subscriptions s 
    WHERE s.user_id = credits.user_id 
    AND s.tier = 'pro' 
    AND (s.status = 'active' OR s.status = 'trialing')
  ) THEN 9999
  ELSE 100
END,
last_reset_date = strftime('%Y-%m', 'now'),
updated_at = strftime('%s', 'now') * 1000
WHERE last_reset_date != strftime('%Y-%m', 'now');
