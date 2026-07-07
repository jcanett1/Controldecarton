-- ============================================
-- Script: Agregar columna folio_mtk
-- Fecha: 07 de julio de 2026
-- Descripción: Agregar columna dedicada para guardar el Folio MTK
--              en la tabla folios_pago_carton
-- ============================================

-- 1. Agregar columna folio_mtk a la tabla folios_pago_carton
ALTER TABLE public.folios_pago_carton
ADD COLUMN IF NOT EXISTS folio_mtk text NULL;

-- 2. Agregar comentario descriptivo a la columna
COMMENT ON COLUMN public.folios_pago_carton.folio_mtk IS 'Número de Folio MTK asignado por el usuario para el pago de cartón (campo dedicado)';

-- 3. Migrar datos existentes: copiar el valor limpio de acciones a folio_mtk
--    (solo para registros que ya tienen un folio en la columna acciones)
UPDATE public.folios_pago_carton
SET folio_mtk = REGEXP_REPLACE(acciones, '\s*\[NOTIFICADO:.*?\]', '', 'g')
WHERE acciones IS NOT NULL
  AND acciones != ''
  AND folio_mtk IS NULL;

-- ============================================
-- NOTAS:
-- - acciones: Se mantiene para compatibilidad y para guardar el estado
--             de notificación (ej: "F-2026-001 [NOTIFICADO: ...]")
-- - folio_mtk: Nuevo campo dedicado que guarda únicamente el número
--              de folio limpio, sin el sufijo de notificación
-- - Los registros existentes se migran automáticamente en el paso 3
-- ============================================

-- Verificar que se creó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'folios_pago_carton'
  AND column_name = 'folio_mtk';
