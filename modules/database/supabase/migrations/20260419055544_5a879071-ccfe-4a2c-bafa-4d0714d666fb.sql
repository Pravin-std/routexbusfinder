INSERT INTO public.stops (id, name_en, name_ta, district) VALUES
  ('kokkarayanpettai', 'Kokkarayanpettai', 'கொக்கரையன்பேட்டை', 'Namakkal'),
  ('thindal', 'Thindal', 'திண்டல்', 'Erode'),
  ('perundurai', 'Perundurai', 'பெருந்துறை', 'Erode'),
  ('avinashi', 'Avinashi', 'அவிநாசி', 'Tiruppur')
ON CONFLICT (id) DO NOTHING;