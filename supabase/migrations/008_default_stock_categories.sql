-- Ensure common motorcycle workshop categories are available in the catalog.
insert into public.categories (name)
values
  ('Aki'),
  ('Aksesoris'),
  ('Ban dan Velg'),
  ('Baut dan Mur'),
  ('Busi'),
  ('Filter'),
  ('Kampas Rem'),
  ('Kelistrikan'),
  ('Oli'),
  ('Rantai dan Gear'),
  ('Suku Cadang Mesin')
on conflict (name) do nothing;
