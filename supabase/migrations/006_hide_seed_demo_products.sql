-- Hide only the two exact catalog rows inserted by the old demo seed.
-- Soft-deactivation preserves transaction and stock-movement history.
update public.products
set is_active = false, updated_at = now()
where (code = 'OLI-001' and name = 'Oli Mesin MPX 1 0.8L')
   or (code = 'REM-014' and name = 'Kampas Rem Depan Vario');
