UPDATE public.landing_content
SET content = jsonb_set(
  content,
  '{stats,items}',
  '[
    {"id":"s1","label":"IA própria","value":"100%"},
    {"id":"s2","label":"Motor semi-automático","value":"Smart"},
    {"id":"s3","label":"Bases alimentares","value":"TACO · USDA · IBGE · TBCA"},
    {"id":"s5","label":"Trial sem cartão","value":"3 dias"}
  ]'::jsonb
)
WHERE singleton = true;