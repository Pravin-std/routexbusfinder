INSERT INTO public.stops (id, name_en, name_ta, district) VALUES
('kootapalli', 'Kootapalli', 'கூத்தப்பள்ளி', 'Namakkal'),
('varagurampatti', 'Varagurampatti', 'வரகுராம்பட்டி', 'Namakkal'),
('pallipalayam-agraharam', 'Pallipalayam Agraharam', 'பள்ளிபாளையம் அக்ரஹாரம்', 'Namakkal'),
('pallipalayam', 'Pallipalayam', 'பள்ளிபாளையம்', 'Namakkal'),
('cauvery-bridge', 'Cauvery Bridge', 'காவேரி பாலம்', 'Erode'),
('veerappampalayam', 'Veerappampalayam', 'வீரப்பம்பாளையம்', 'Erode'),
('ashokapuram', 'Ashokapuram', 'அசோகபுரம்', 'Erode'),
('solar', 'Solar', 'சோலார்', 'Erode')
ON CONFLICT (id) DO NOTHING;