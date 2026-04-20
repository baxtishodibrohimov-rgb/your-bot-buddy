
SELECT cron.unschedule('telegram-poll-every-minute');

SELECT cron.schedule(
  'telegram-poll-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://khlliiwezcqqgvvwbkmi.supabase.co/functions/v1/telegram-poll',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
