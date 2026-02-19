-- ============================================
-- Script: Agregar campo balance_inicial a balances_veritiv
-- Fecha: 19 de febrero de 2026
-- Descripción: Agregar columna para guardar el balance inicial fijo (no cambia)
-- ============================================

-- 1. Agregar columna balance_inicial a la tabla balances_veritiv
ALTER TABLE balances_veritiv
ADD COLUMN IF NOT EXISTS balance_inicial NUMERIC(10, 2) DEFAULT NULL;

-- 2. Agregar comentario a la columna
COMMENT ON COLUMN balances_veritiv.balance_inicial IS 'Balance inicial con el que se dio de alta (valor fijo que no cambia)';

-- 3. Actualizar registros existentes: copiar balance actual como balance_inicial
-- (Solo para registros que no tienen balance_inicial)
UPDATE balances_veritiv
SET balance_inicial = balance
WHERE balance_inicial IS NULL;

-- 4. Hacer el campo NOT NULL después de poblar los datos existentes
ALTER TABLE balances_veritiv
ALTER COLUMN balance_inicial SET NOT NULL;

-- 5. Agregar valor por defecto para nuevos registros
ALTER TABLE balances_veritiv
ALTER COLUMN balance_inicial SET DEFAULT 0;

-- 6. Crear índice para mejorar rendimiento en consultas
CREATE INDEX IF NOT EXISTS idx_balances_balance_inicial 
ON balances_veritiv(balance_inicial);

-- ============================================
-- NOTAS:
-- - balance: Se actualiza cada vez que se usa (valor actual disponible)
-- - balance_inicial: Se guarda al crear y NUNCA cambia (valor original)
-- - Los registros existentes se actualizan con su balance actual como inicial
-- ============================================

-- Verificar que se creó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'balances_veritiv' 
AND column_name = 'balance_inicial';

-- Ver algunos registros de ejemplo
SELECT 
    id,
    orden_compra,
    material_carton,
    balance_inicial,
    balance,
    fecha_creacion
FROM balances_veritiv
ORDER BY fecha_creacion DESC
LIMIT 5;
