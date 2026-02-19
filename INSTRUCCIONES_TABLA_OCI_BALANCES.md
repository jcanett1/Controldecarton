# Instrucciones para crear la tabla `oci_balances_usados` en Supabase

## Paso 1: Acceder al Editor SQL de Supabase

1. Inicia sesión en tu cuenta de Supabase: https://supabase.com
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **SQL Editor**
4. Haz clic en **New Query**

## Paso 2: Ejecutar el script SQL

Copia y pega el siguiente script SQL en el editor:

```sql
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
```

## Paso 3: Ejecutar el script

1. Haz clic en el botón **Run** (o presiona Ctrl+Enter / Cmd+Enter)
2. Verifica que aparezca el mensaje "Success. No rows returned"
3. Si hay algún error, revisa el mensaje y corrige el script

## Paso 4: Configurar permisos (RLS - Row Level Security)

Para que la aplicación pueda acceder a esta tabla, ejecuta el siguiente script:

```sql
-- Habilitar RLS (Row Level Security)
ALTER TABLE oci_balances_usados ENABLE ROW LEVEL SECURITY;

-- Política para permitir SELECT a usuarios autenticados
CREATE POLICY "Permitir SELECT a usuarios autenticados" 
ON oci_balances_usados 
FOR SELECT 
TO authenticated 
USING (true);

-- Política para permitir INSERT a usuarios autenticados
CREATE POLICY "Permitir INSERT a usuarios autenticados" 
ON oci_balances_usados 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política para permitir acceso anónimo (si usas anon key)
CREATE POLICY "Permitir SELECT público" 
ON oci_balances_usados 
FOR SELECT 
TO anon 
USING (true);

CREATE POLICY "Permitir INSERT público" 
ON oci_balances_usados 
FOR INSERT 
TO anon 
WITH CHECK (true);
```

## Paso 5: Verificar la tabla

Ejecuta esta consulta para verificar que la tabla se creó correctamente:

```sql
SELECT * FROM oci_balances_usados LIMIT 10;
```

Debería devolver 0 filas (ya que la tabla está vacía) sin errores.

## Paso 6: Verificar la relación con balances_veritiv

Ejecuta esta consulta para verificar la foreign key:

```sql
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='oci_balances_usados';
```

Debería mostrar que `balance_id` está relacionado con `balances_veritiv(id)`.

## Notas importantes

- **No elimines manualmente registros de `balances_veritiv`** si tienen OCIs asociadas, ya que esto eliminará también los registros de `oci_balances_usados` (CASCADE).
- La tabla se llenará automáticamente cada vez que se cree una nueva OCI con materiales asignados a balances.
- Puedes consultar el historial de uso en cualquier momento desde la pestaña "Balances Usados" en la aplicación.

## Solución de problemas

### Error: "relation balances_veritiv does not exist"
- Verifica que la tabla `balances_veritiv` existe en tu base de datos
- Ejecuta: `SELECT * FROM balances_veritiv LIMIT 1;`

### Error: "foreign key constraint cannot be implemented"
- Verifica que el tipo de dato de `balance_id` en `oci_balances_usados` coincida con el tipo de `id` en `balances_veritiv`
- Ambos deben ser `INTEGER` o `BIGINT`

### Error de permisos
- Verifica que las políticas RLS estén configuradas correctamente
- Puedes desactivar temporalmente RLS para pruebas: `ALTER TABLE oci_balances_usados DISABLE ROW LEVEL SECURITY;`
