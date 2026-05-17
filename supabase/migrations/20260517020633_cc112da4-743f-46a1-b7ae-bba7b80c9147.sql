-- Restrict INSERT/UPDATE/DELETE on user_roles to admins only.
-- The handle_new_user_role trigger runs as SECURITY DEFINER and bypasses RLS, so signups still work.

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated, anon
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated, anon
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated, anon
USING (has_role(auth.uid(), 'admin'::app_role));