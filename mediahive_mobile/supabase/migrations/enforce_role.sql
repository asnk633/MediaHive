CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
 NEW.role := 'member';
 RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_role_on_signup ON auth.users;

CREATE TRIGGER enforce_role_on_signup
AFTER INSERT ON auth.users FOR EACH ROW
EXECUTE FUNCTION public.handle_new_profile();
