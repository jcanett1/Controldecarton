-- Script para corregir el trigger de notificaciones
-- El trigger actual se ejecuta en INSERT, UPDATE y DELETE
-- Solo debe ejecutarse en INSERT (cuando se crea una nueva OCI)

-- 1. Eliminar el trigger actual
DROP TRIGGER IF EXISTS notificar_nueva_oci ON public.ordenes_compra;

-- 2. Crear el trigger correcto (solo INSERT)
CREATE TRIGGER notificar_nueva_oci
  AFTER INSERT ON public.ordenes_compra
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://bdrxcilsuxbkpmolfbgu.supabase.co/functions/v1/notificar-nueva-oci',
    'POST',
    '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcnhjaWxzdXhia3Btb2xmYmd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI1NDQ1NywiZXhwIjoyMDY5ODMwNDU3fQ.K98GcfmxohDRFd06XpUzIkDl-H_YwYuNnLpkk3NaOcw"}',
    '{}',
    '5000'
  );

-- NOTA: Este trigger ahora solo se ejecutará cuando se INSERTE una nueva orden
-- NO se ejecutará en UPDATE (ediciones) ni DELETE (eliminaciones)
