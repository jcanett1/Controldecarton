-- Script SQL para crear la tabla balances_veritiv en Supabase
-- Ejecutar este script en el SQL Editor de Supabase Dashboard

-- Crear la tabla balances_veritiv
CREATE TABLE IF NOT EXISTS balances_veritiv (
    id SERIAL PRIMARY KEY,
    orden_compra VARCHAR(100) NOT NULL,
    fecha_orden_compra DATE NOT NULL,
    producto_id INTEGER REFERENCES productos_carton(id) ON DELETE CASCADE,
    material_carton VARCHAR(255) NOT NULL,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_balances_orden_compra ON balances_veritiv(orden_compra);
CREATE INDEX IF NOT EXISTS idx_balances_producto_id ON balances_veritiv(producto_id);
CREATE INDEX IF NOT EXISTS idx_balances_fecha_orden ON balances_veritiv(fecha_orden_compra);

-- Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_balances_veritiv_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualización automática
DROP TRIGGER IF EXISTS trigger_update_balances_timestamp ON balances_veritiv;
CREATE TRIGGER trigger_update_balances_timestamp
BEFORE UPDATE ON balances_veritiv
FOR EACH ROW
EXECUTE FUNCTION update_balances_veritiv_timestamp();

-- Habilitar Row Level Security (RLS)
ALTER TABLE balances_veritiv ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso (ajustar según necesidades)
CREATE POLICY "Permitir lectura pública de balances" ON balances_veritiv
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserción autenticada de balances" ON balances_veritiv
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización autenticada de balances" ON balances_veritiv
    FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación autenticada de balances" ON balances_veritiv
    FOR DELETE USING (true);

-- Comentarios para documentación
COMMENT ON TABLE balances_veritiv IS 'Tabla para registrar balances de Veritiv asociados a órdenes de compra y materiales de cartón';
COMMENT ON COLUMN balances_veritiv.orden_compra IS 'Número de orden de compra';
COMMENT ON COLUMN balances_veritiv.fecha_orden_compra IS 'Fecha de la orden de compra';
COMMENT ON COLUMN balances_veritiv.producto_id IS 'ID del producto de cartón (FK a productos_carton)';
COMMENT ON COLUMN balances_veritiv.material_carton IS 'Descripción del material de cartón';
COMMENT ON COLUMN balances_veritiv.balance IS 'Balance o cantidad asociada a la orden';
