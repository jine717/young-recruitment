INSERT INTO public.user_roles (user_id, role)
VALUES ('fe258125-1951-40a4-bb07-d2474635d2ee', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;