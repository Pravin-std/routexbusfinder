
INSERT INTO public.stops (id, name_en, name_ta, district) VALUES
  ('sankari', 'Sankari', 'சங்ககிரி', 'Salem'),
  ('chithode', 'Chithode', 'சித்தோடு', 'Erode'),
  ('elampillai', 'Elampillai', 'இளம்பிள்ளை', 'Salem')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.bus_routes (id, bus_number, bus_name, from_id, to_id, departure, arrival, duration_minutes, price, route_type, status, bus_type, intermediate_stops) VALUES
  (gen_random_uuid(),'SLM-ERD-01','TNSTC Salem-Erode Ordinary','salem-new','erode','05:00','06:20',80,55,'direct','onTime','ordinary',ARRAY['kondalampatti','sankari','komarapalayam','bhavani','chithode']),
  (gen_random_uuid(),'SLM-ERD-02','TNSTC Salem-Erode Ordinary','salem-new','erode','05:40','07:00',80,55,'direct','onTime','ordinary',ARRAY['kondalampatti','sankari','bhavani','chithode']),
  (gen_random_uuid(),'SLM-ERD-03','TNSTC Salem-Erode Express','salem-new','erode','06:15','07:25',70,90,'direct','onTime','express',ARRAY['sankari','bhavani']),
  (gen_random_uuid(),'SLM-ERD-04','TNSTC Salem-Erode Ordinary','salem-new','erode','06:45','08:05',80,55,'direct','onTime','ordinary',ARRAY['kondalampatti','sankari','komarapalayam','pallipalayam','bhavani','chithode']),
  (gen_random_uuid(),'SLM-ERD-05','TNSTC Salem-Erode Express','salem-new','erode','07:30','08:40',70,90,'direct','onTime','express',ARRAY['sankari','bhavani','chithode']),
  (gen_random_uuid(),'SLM-ERD-06','TNSTC Salem-Erode Ordinary','salem-new','erode','08:15','09:35',80,60,'direct','onTime','ordinary',ARRAY['kondalampatti','elampillai','sankari','bhavani','chithode']),
  (gen_random_uuid(),'SLM-ERD-07','TNSTC Salem-Erode Express','salem-new','erode','09:00','10:10',70,95,'direct','onTime','express',ARRAY['sankari','bhavani']),
  (gen_random_uuid(),'SLM-ERD-08','TNSTC Salem-Erode Ordinary','salem-new','erode','09:45','11:05',80,60,'direct','onTime','ordinary',ARRAY['kondalampatti','sankari','komarapalayam','bhavani','chithode']),
  (gen_random_uuid(),'SLM-ERD-09','KPN Travels AC','salem-new','erode','10:30','11:35',65,180,'direct','onTime','ac',ARRAY['sankari','bhavani']),
  (gen_random_uuid(),'SLM-ERD-10','TNSTC Salem-Erode Express','salem-new','erode','11:15','12:25',70,95,'direct','onTime','express',ARRAY['sankari','bhavani','chithode']),
  (gen_random_uuid(),'SLM-ERD-11','TNSTC Salem-Erode Ordinary','salem-new','erode','12:00','13:25',85,60,'direct','onTime','ordinary',ARRAY['kondalampatti','elampillai','sankari','komarapalayam','pallipalayam','bhavani','chithode']),
  (gen_random_uuid(),'SLM-ERD-12','TNSTC Salem-Erode Express','salem-new','erode','13:00','14:10',70,95,'direct','onTime','express',ARRAY['sankari','bhavani']),
  (gen_random_uuid(),'SLM-ERD-13','TNSTC Salem-Erode Ordinary','salem-new','erode','14:30','15:55',85,60,'direct','onTime','ordinary',ARRAY['kondalampatti','sankari','bhavani','chithode']),
  (gen_random_uuid(),'SLM-ERD-14','SETC Salem-Erode Super Deluxe','salem-new','erode','15:30','16:35',65,120,'direct','onTime','superDeluxe',ARRAY['sankari','bhavani']),
  (gen_random_uuid(),'SLM-ERD-15','TNSTC Salem-Erode Ordinary','salem-new','erode','16:15','17:40',85,60,'direct','onTime','ordinary',ARRAY['kondalampatti','sankari','komarapalayam','bhavani','chithode']),
  (gen_random_uuid(),'SLM-ERD-16','TNSTC Salem-Erode Express','salem-new','erode','17:00','18:10',70,100,'direct','onTime','express',ARRAY['sankari','bhavani','chithode']),
  (gen_random_uuid(),'SLM-ERD-17','TNSTC Salem-Erode Ordinary','salem-new','erode','18:00','19:25',85,65,'direct','onTime','ordinary',ARRAY['kondalampatti','elampillai','sankari','bhavani','chithode']),
  (gen_random_uuid(),'SLM-ERD-18','KPN Travels AC','salem-new','erode','19:00','20:05',65,200,'direct','onTime','ac',ARRAY['sankari','bhavani']),
  (gen_random_uuid(),'SLM-ERD-19','TNSTC Salem-Erode Ordinary','salem-new','erode','20:00','21:25',85,65,'direct','onTime','ordinary',ARRAY['kondalampatti','sankari','komarapalayam','pallipalayam','bhavani','chithode']),
  (gen_random_uuid(),'SLM-ERD-20','TNSTC Salem-Erode Night Service','salem-new','erode','21:30','22:55',85,70,'direct','onTime','ordinary',ARRAY['sankari','bhavani','chithode']),
  (gen_random_uuid(),'SLM-ERD-21','TNSTC Salem-Erode Late Night','salem-new','erode','23:00','00:25',85,75,'direct','onTime','ordinary',ARRAY['sankari','bhavani']);
