-- ============================================================================
-- Ridgeford Capital Bank — 0006
-- Coin logos on the cached market data.
--
-- The keyless CoinGecko markets response already carries a CDN-hosted logo per
-- asset. Persisting it means the desk still shows logos on a cold start, when
-- the in-memory cache is empty and the upstream feed is rate-limited.
-- ============================================================================

alter table public.crypto_price_cache add column if not exists image text;
