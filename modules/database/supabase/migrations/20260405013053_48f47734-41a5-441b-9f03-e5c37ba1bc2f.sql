
-- Add new intermediate stop entries
INSERT INTO public.stops (id, name_en, name_ta, district) VALUES
  ('palmadai', 'Palmadai', 'பால்மடை', 'Namakkal'),
  ('pullipalayam', 'Pullipalayam', 'புல்லிபாளையம்', 'Namakkal'),
  ('narappanchavadi', 'Narappanchavadi', 'நரப்பன்சாவடி', 'Namakkal'),
  ('rs-junction', 'RS Junction', 'ஆர்எஸ் சந்திப்பு', 'Salem'),
  ('kuppanur', 'Kuppanur', 'குப்பனூர்', 'Salem'),
  ('manjakalpatti', 'Manjakalpatti', 'மஞ்சக்கல்பட்டி', 'Salem'),
  ('parayankattanur', 'Parayankattanur', 'பரையன்கட்டனூர்', 'Salem'),
  ('sunnambukuttai', 'Sunnambukuttai', 'சுண்ணாம்புக்குட்டை', 'Salem'),
  ('malaiyanur', 'Malaiyanur', 'மலையனூர்', 'Salem'),
  ('arts-college', 'Arts College', 'கலைக்கல்லூரி', 'Salem'),
  ('gate-kadai', 'Gate Kadai', 'கேட் கடை', 'Salem'),
  ('boys-school', 'Boys School', 'பாய்ஸ் ஸ்கூல்', 'Salem')
ON CONFLICT (id) DO NOTHING;

-- Update all Tiruchengode→Edappadi routes with full intermediate stops
UPDATE public.bus_routes
SET intermediate_stops = '{"palmadai","pullipalayam","narappanchavadi","rs-junction","sankagiri","kuppanur","manjakalpatti","parayankattanur","sunnambukuttai","malaiyanur","arts-college","gate-kadai","boys-school"}'
WHERE from_id = 'tiruchengode' AND to_id = 'edappadi';
