CREATE TABLE IF NOT EXISTS public.zm_auth_push_subscription (
  endpoint text PRIMARY KEY CHECK (octet_length(endpoint) <= 2048),
  user_id text NOT NULL REFERENCES public.zm_auth_admin(user_id) ON DELETE CASCADE,
  p256dh text NOT NULL,
  auth_secret text NOT NULL
);

CREATE INDEX IF NOT EXISTS zm_auth_push_subscription_user_idx
  ON public.zm_auth_push_subscription (user_id);

REVOKE ALL ON public.zm_auth_push_subscription FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zm_auth_push_subscription TO zm_auth_app;
