do $$
declare k text; b text;
begin
  select decrypted_secret into k from vault.decrypted_secrets where name='refresh_events_shared_secret' limit 1;
  foreach b in array array[
   '{"delayMs":200,"cities":[{"slug":"paris","name":"Paris"},{"slug":"lyon","name":"Lyon"},{"slug":"marseille","name":"Marseille"},{"slug":"toulouse","name":"Toulouse"},{"slug":"nice","name":"Nice"}]}',
   '{"delayMs":200,"cities":[{"slug":"nantes","name":"Nantes"},{"slug":"bordeaux","name":"Bordeaux"},{"slug":"grenoble","name":"Grenoble"},{"slug":"lille","name":"Lille"},{"slug":"strasbourg","name":"Strasbourg"}]}',
   '{"delayMs":200,"cities":[{"slug":"montpellier","name":"Montpellier"},{"slug":"rennes","name":"Rennes"},{"slug":"reims","name":"Reims"},{"slug":"toulon","name":"Toulon"},{"slug":"angers","name":"Angers"}]}'
  ] loop
    perform net.http_post(
      url:='https://rhzojoyxldrllxroyyqt.supabase.co/functions/v1/generate-city-intro',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||k),
      body:=b::jsonb,
      timeout_milliseconds:=300000);
  end loop;
end $$;