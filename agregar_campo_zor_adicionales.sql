-- ============================================
-- AGREGAR CAMPO ZOR_ADICIONALES A ORDENES_COMPRA
-- Sistema: Control de Cartón
-- ============================================

-- 1. Agregar nueva columna para guardar uno o más ZOR adicionales
-- Se guarda como texto serializado en JSON, por ejemplo:
-- ["ZOR-1001","ZOR-1002","ZOR-1003"]
ALTER TABLE ordenes_compra
ADD COLUMN IF NOT EXISTS zor_adicionales TEXT DEFAULT NULL;

-- 2. Comentario descriptivo de la columna
COMMENT ON COLUMN ordenes_compra.zor_adicionales IS
'Listado de ZOR adicionales asociado a la OCI, almacenado como JSON en texto';

-- 3. Verificación rápida
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'ordenes_compra'
  AND column_name = 'zor_adicionales';
