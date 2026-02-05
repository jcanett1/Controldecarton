# Instrucciones para Implementar el Módulo Balance Veritiv

## 📋 Resumen de Cambios

Se ha añadido un nuevo módulo **Balance Veritiv** al sistema de Control de Cartón que permite:

- Registrar órdenes de compra con sus balances
- Asociar materiales de cartón a órdenes de compra
- Vincular balances con productos existentes
- Filtrar y buscar balances por orden de compra o fecha
- Editar y eliminar balances

## 🗄️ Paso 1: Crear la Tabla en Supabase

Debes ejecutar el siguiente SQL en el **SQL Editor** de tu proyecto Supabase:

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/bdrxcilsuxbkpmolfbgu
2. Haz clic en **SQL Editor** en el menú lateral
3. Copia y pega el contenido del archivo `crear_tabla_sql.sql`
4. Haz clic en **Run** para ejecutar el script

### Contenido del SQL (también disponible en `crear_tabla_sql.sql`):

```sql
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

-- Crear políticas de acceso
CREATE POLICY "Permitir lectura pública de balances" ON balances_veritiv
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserción autenticada de balances" ON balances_veritiv
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización autenticada de balances" ON balances_veritiv
    FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación autenticada de balances" ON balances_veritiv
    FOR DELETE USING (true);
```

## 📁 Paso 2: Subir los Cambios a GitHub

Los siguientes archivos han sido modificados o creados:

### Archivos Nuevos:
- `src/models/balance.py` - Modelo de datos para balances
- `src/routes/balances.py` - Endpoints del API para balances
- `crear_tabla_sql.sql` - Script SQL para crear la tabla
- `crear_tabla_balances.py` - Script Python auxiliar
- `crear_tabla_balances_psycopg.py` - Script Python con psycopg2
- `INSTRUCCIONES_BALANCE.md` - Este archivo

### Archivos Modificados:
- `index.html` - Añadida sección Balance y modal
- `app.js` - Añadidas funciones JavaScript para manejar balances
- `src/main_supabase.py` - Registrado el blueprint de balances

### Comandos para subir los cambios:

```bash
cd /home/ubuntu/Controldecarton

# Añadir todos los archivos modificados
git add .

# Crear commit
git commit -m "Añadir módulo Balance Veritiv con gestión de órdenes de compra"

# Subir cambios
git push origin main
```

## 🚀 Paso 3: Desplegar en GitHub Pages

Si tu aplicación está desplegada en GitHub Pages, los cambios se aplicarán automáticamente después del push.

Si usas otro método de despliegue, sigue los pasos específicos de tu plataforma.

## 🧪 Paso 4: Probar la Funcionalidad

Una vez que hayas ejecutado el SQL y subido los cambios:

1. **Accede a tu aplicación** en el navegador
2. **Inicia sesión** con tus credenciales
3. **Haz clic en "Balance"** en el menú lateral
4. **Prueba crear un nuevo balance**:
   - Haz clic en "Nuevo Balance"
   - Llena el formulario:
     - Orden de Compra: Ej. "OC-2026-001"
     - Fecha de Orden: Selecciona una fecha
     - Producto de Cartón: Selecciona de la lista (opcional)
     - Material de Cartón: Ej. "Cartón corrugado 3mm"
     - Balance: Ej. "1500.50"
   - Haz clic en "Guardar"

5. **Verifica que aparezca en la tabla**
6. **Prueba editar** haciendo clic en el ícono de lápiz
7. **Prueba filtrar** usando los campos de búsqueda
8. **Prueba eliminar** haciendo clic en el ícono de basura

## 📊 Estructura de la Tabla

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER | ID único (auto-incremental) |
| `orden_compra` | VARCHAR(100) | Número de orden de compra |
| `fecha_orden_compra` | DATE | Fecha de la orden |
| `producto_id` | INTEGER | ID del producto (FK a productos_carton) |
| `material_carton` | VARCHAR(255) | Descripción del material |
| `balance` | DECIMAL(10,2) | Cantidad/balance |
| `fecha_creacion` | TIMESTAMP | Fecha de creación del registro |
| `fecha_actualizacion` | TIMESTAMP | Última actualización |
| `activo` | BOOLEAN | Estado del registro (soft delete) |

## 🔌 Endpoints del API

### GET `/api/balances`
Obtener todos los balances activos

**Query Parameters:**
- `orden_compra` - Filtrar por orden de compra
- `fecha_desde` - Filtrar por fecha desde
- `fecha_hasta` - Filtrar por fecha hasta
- `producto_id` - Filtrar por producto

**Respuesta:**
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

### GET `/api/balances/:id`
Obtener un balance específico

### POST `/api/balances`
Crear un nuevo balance

**Body:**
```json
{
  "orden_compra": "OC-2026-001",
  "fecha_orden_compra": "2026-02-05",
  "producto_id": 1,
  "material_carton": "Cartón corrugado 3mm",
  "balance": 1500.50
}
```

### PUT `/api/balances/:id`
Actualizar un balance existente

### DELETE `/api/balances/:id`
Eliminar un balance (soft delete)

### GET `/api/balances/estadisticas`
Obtener estadísticas de balances

## ⚠️ Notas Importantes

1. **Prerequisito**: La tabla `productos_carton` debe existir en la base de datos
2. **Relación**: Los balances pueden estar vinculados a productos existentes (opcional)
3. **Soft Delete**: Los registros no se eliminan físicamente, solo se marcan como inactivos
4. **Permisos**: Asegúrate de que las políticas RLS permitan el acceso según tus necesidades
5. **Validación**: El frontend valida que todos los campos requeridos estén llenos

## 🐛 Solución de Problemas

### Error: "relation balances_veritiv does not exist"
**Solución**: Ejecuta el script SQL en Supabase SQL Editor

### Error: "foreign key constraint cannot be implemented"
**Solución**: Verifica que la tabla `productos_carton` exista y tenga una columna `id` de tipo INTEGER

### Los balances no aparecen en la tabla
**Solución**: 
1. Abre la consola del navegador (F12)
2. Busca errores en la pestaña Console
3. Verifica que las políticas RLS permitan lectura

### No puedo crear balances
**Solución**:
1. Verifica que las políticas RLS permitan inserción
2. Revisa que todos los campos requeridos estén llenos
3. Verifica la conexión a Supabase

## 📞 Soporte

Si encuentras problemas, revisa:
1. La consola del navegador (F12 → Console)
2. Los logs del servidor (si aplica)
3. Las políticas RLS en Supabase
4. La configuración de CORS en el backend

---

**Fecha de creación**: 05 de Febrero de 2026  
**Versión**: 1.0  
**Autor**: Sistema de Control de Cartón
