-- Replace handle_new_user function to NOT assign candidate role by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  -- No longer assign candidate role by default
  -- Roles will be assigned manually by admins
  
  RETURN NEW;
END;
$function$;