-- Persistent rate limiting for AI vision and other expensive endpoints
-- Used by server-side API routes via service role key
CREATE TABLE api_rate_limits (
  ip      text        NOT NULL,
  endpoint text       NOT NULL,
  count   integer     NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL,
  PRIMARY KEY (ip, endpoint)
);

-- No public read/write — service role only via backend routes
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Auto-clean stale rows older than 1 hour to prevent table bloat
CREATE INDEX idx_api_rate_limits_reset_at ON api_rate_limits (reset_at);
