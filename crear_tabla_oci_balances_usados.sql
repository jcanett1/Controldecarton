-- Tabla para registrar el uso de balances por OCIs
-- Esta tabla mantiene un historial de qué OCIs usaron qué balances

CREATE TABLE IF NOT EXISTS oci_balances_usados (
  id SERIAL PRIMARY KEY,
  numero_oci VARCHAR(50) NOT NULL,
  balance_id INTEGER NOT NULL,
  material_numero VARCHAR(50) NOT NULL,
  material_descripcion TEXT,
  cantidad_piezas_usadas INTEGER NOT NULL,
  fecha_uso TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key a balances_veritiv
  CONSTRAINT fk_balance
    FOREIGN KEY (balance_id) 
    REFERENCES balances_veritiv(id)
    ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_oci_balances_numero_oci ON oci_balances_usados(numero_oci);
CREATE INDEX IF NOT EXISTS idx_oci_balances_balance_id ON oci_balances_usados(balance_id);
CREATE INDEX IF NOT EXISTS idx_oci_balances_fecha_uso ON oci_balances_usados(fecha_uso DESC);

-- Comentarios para documentación
COMMENT ON TABLE oci_balances_usados IS 'Registra el historial de uso de balances por órdenes de compra internas (OCI)';
COMMENT ON COLUMN oci_balances_usados.numero_oci IS 'Número de la orden de compra interna que usó el balance';
COMMENT ON COLUMN oci_balances_usados.balance_id IS 'ID del balance de Veritiv que fue usado';
COMMENT ON COLUMN oci_balances_usados.material_numero IS 'Número de parte del material';
COMMENT ON COLUMN oci_balances_usados.material_descripcion IS 'Descripción del material para referencia rápida';
COMMENT ON COLUMN oci_balances_usados.cantidad_piezas_usadas IS 'Cantidad de piezas que se descontaron del balance';
COMMENT ON COLUMN oci_balances_usados.fecha_uso IS 'Fecha y hora en que se usó el balance';
