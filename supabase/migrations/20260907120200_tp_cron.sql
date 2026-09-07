-- Schedule the Treatment Plan Manager background jobs, mirroring the
-- existing telegram-poll / telegram-reminders cron pattern in this project.

SELECT cron.schedule(
  'tp-cliniccards-sync-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://khlliiwezcqqgvvwbkmi.supabase.co/functions/v1/cliniccards-sync',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'tp-notifications-dispatch-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://khlliiwezcqqgvvwbkmi.supabase.co/functions/v1/treatment-plan-notifications-dispatch',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'tp-reminders-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://khlliiwezcqqgvvwbkmi.supabase.co/functions/v1/treatment-plan-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
