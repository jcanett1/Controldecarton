-- ============================================
-- Script: Agregar campo qty_a_enviar_piezas
-- Fecha: 19 de febrero de 2026
-- Descripción: Agregar columna para guardar el valor manual de piezas a enviar
-- ============================================

-- 1. Agregar columna qty_a_enviar_piezas a la tabla ordenes_compra
ALTER TABLE ordenes_compra
ADD COLUMN IF NOT EXISTS qty_a_enviar_piezas INTEGER DEFAULT NULL;

-- 2. Agregar comentario a la columna
COMMENT ON COLUMN ordenes_compra.qty_a_enviar_piezas IS 'Cantidad manual de piezas a enviar (valor real ingresado por el usuario)';

-- 3. Crear índice para mejorar rendimiento en consultas
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_qty_piezas 
ON ordenes_compra(qty_a_enviar_piezas) 
WHERE qty_a_enviar_piezas IS NOT NULL;

-- ============================================
-- NOTAS:
-- - qty_a_enviar: Se mantiene para guardar pallets (compatibilidad)
-- - qty_a_enviar_piezas: Nuevo campo para guardar piezas manuales
-- - El campo es NULL por defecto para órdenes antiguas
-- ============================================

-- Verificar que se creó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'ordenes_compra' 
AND column_name = 'qty_a_enviar_piezas';
