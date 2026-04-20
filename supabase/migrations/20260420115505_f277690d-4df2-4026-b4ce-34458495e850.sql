
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Har daqiqada telegram-poll'ni chaqirish
SELECT cron.schedule(
  'telegram-poll-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://' || (SELECT split_part(current_setting('app.settings.supabase_url', true), '://', 2)) || '/functions/v1/telegram-poll',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
