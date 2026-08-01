create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Секретный ключ для вызова функции хранится в Vault под именем
-- 'funding_rates_service_role_key' (создаётся отдельно, см. README-шаг настройки).
select cron.schedule(
  'collect-funding-rates-every-15-min',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://qlsbpphvsxetnkwuhawe.supabase.co/functions/v1/collect-funding-rates',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'funding_rates_service_role_key'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
