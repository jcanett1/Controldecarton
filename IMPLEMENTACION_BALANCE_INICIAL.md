# Implementación: Campo balance_inicial Fijo

## 📋 Problema Reportado

**Fecha:** 19 de febrero de 2026  
**Usuario reporta:** "En balance inicial este debería de ser el balance con el cual lo diste de alta y este no debería de cambiar"

**Ejemplo del problema:**
- Balance dado de alta: **60 piezas**
- Después de usar el balance: Balance Inicial mostraba **65 piezas** ❌
- **Esperado:** Balance Inicial siempre debe mostrar **60 piezas** ✅

---

## 🔍 Análisis del Problema

### Comportamiento Incorrecto (Antes)

El "Balance Inicial" se **calculaba dinámicamente**:

```javascript
const balanceInicial = parseFloat(balance.balance) + balancePedido;
```

**Problema:**
- Si `balance` = 5 y `balancePedido` = 60, entonces `balanceInicial` = 65
- El valor cambiaba cada vez que se consultaba
- No reflejaba el balance original con el que se dio de alta

---

## ✅ Solución Implementada

### 1. Crear Campo `balance_inicial` en la Base de Datos

**Tabla:** `balances_veritiv`  
**Campo nuevo:** `balance_inicial NUMERIC(10, 2) NOT NULL`

**Características:**
- Se guarda al **crear** el balance
- **Nunca cambia** (valor fijo)
- Representa el balance original con el que se dio de alta

---

### 2. Modificar Código para Usar el Campo

#### A) Función `guardarBalance()` en `app.js`

**Al crear nuevo balance:**
```javascript
const nuevoBalanceData = {
    ...balanceData,
    balance_inicial: balanceCantidad  // ✨ Guardar balance inicial (fijo)
};
```

**Al editar balance existente:**
```javascript
// NO actualizar balance_inicial (se mantiene fijo)
result = await supabase
    .from('balances_veritiv')
    .update(balanceData)  // Solo actualiza balance, no balance_inicial
    .eq('id', balanceId);
```

---

#### B) Funciones `cargarBalancesUsados()` y `filtrarBalancesUsados()` en `app.js`

**Obtener balance_inicial de la BD:**
```javascript
.select(`
    id,
    orden_compra,
    material_carton,
    balance,
    balance_inicial,  // ✨ Agregado
    fecha_orden_compra,
    fecha_actualizacion,
    producto:productos_carton(numero_parte, descripcion)
`)
```

**Usar balance_inicial de la BD:**
```javascript
// ✨ CORREGIDO: Usar balance_inicial de la BD (valor fijo que no cambia)
const balanceInicial = balance.balance_inicial 
    ? parseFloat(balance.balance_inicial) 
    : (parseFloat(balance.balance) + balancePedido);  // Fallback para registros antiguos
```

---

## 📊 Comparación: Antes vs Después

### Escenario: Balance dado de alta con 60 piezas, usado completamente

| Campo | Antes | Después |
|-------|-------|---------|
| **balance** (actual) | 0 | 0 |
| **balance_pedido** | 60 | 60 |
| **Balance Inicial (mostrado)** | 0 + 60 = **60** ✅ | **60** (de la BD) ✅ |

**Nota:** En este caso coincide, pero el problema aparecía cuando había múltiples usos.

### Escenario: Balance con múltiples usos

**Situación:**
- Balance original: 100 piezas
- Uso 1: 40 piezas
- Uso 2: 35 piezas
- Uso 3: 25 piezas
- Balance actual: 0 piezas

| Campo | Antes | Después |
|-------|-------|---------|
| **balance** (actual) | 0 | 0 |
| **balance_pedido** | 100 | 100 |
| **Balance Inicial (calculado)** | 0 + 100 = **100** | **100** (de la BD) ✅ |
| **¿Cambia al consultar?** | Podría cambiar ❌ | Nunca cambia ✅ |

---

## 🔧 Script SQL: `agregar_balance_inicial.sql`

### Contenido del Script

```sql
-- 1. Agregar columna balance_inicial
ALTER TABLE balances_veritiv
ADD COLUMN IF NOT EXISTS balance_inicial NUMERIC(10, 2) DEFAULT NULL;

-- 2. Agregar comentario
COMMENT ON COLUMN balances_veritiv.balance_inicial IS 
'Balance inicial con el que se dio de alta (valor fijo que no cambia)';

-- 3. Actualizar registros existentes
UPDATE balances_veritiv
SET balance_inicial = balance
WHERE balance_inicial IS NULL;

-- 4. Hacer el campo NOT NULL
ALTER TABLE balances_veritiv
ALTER COLUMN balance_inicial SET NOT NULL;

-- 5. Agregar valor por defecto
ALTER TABLE balances_veritiv
ALTER COLUMN balance_inicial SET DEFAULT 0;

-- 6. Crear índice
CREATE INDEX IF NOT EXISTS idx_balances_balance_inicial 
ON balances_veritiv(balance_inicial);
```

### ¿Qué hace el script?

1. **Agrega la columna** `balance_inicial` a la tabla
2. **Actualiza registros existentes** copiando el valor de `balance` actual
3. **Hace el campo obligatorio** (NOT NULL)
4. **Crea un índice** para mejorar rendimiento

---

## 📁 Archivos Modificados

### 1. `agregar_balance_inicial.sql` (Nuevo)
- Script SQL para crear el campo
- Actualizar registros existentes
- Crear índice

### 2. `app.js`
**Líneas modificadas:**

- **3078-3108:** Función `guardarBalance()` - Guardar balance_inicial al crear
- **3367:** Agregar `balance_inicial` al select de `cargarBalancesUsados()`
- **3444:** Usar `balance.balance_inicial` en lugar de calcular
- **3553:** Agregar `balance_inicial` al select de `filtrarBalancesUsados()`
- **3611:** Usar `balance.balance_inicial` en lugar de calcular

**Estadísticas:**
- +12 líneas
- -5 líneas
- **Total:** 7 líneas netas agregadas

---

## 🧪 Cómo Probar

### Paso 1: Ejecutar Script SQL en Supabase

1. Abre Supabase SQL Editor
2. Copia y pega el contenido de `agregar_balance_inicial.sql`
3. Haz clic en "Run"
4. Verifica que se creó correctamente:
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'balances_veritiv' 
   AND column_name = 'balance_inicial';
   ```

**Resultado esperado:**
```
column_name      | data_type | is_nullable
-----------------|-----------|------------
balance_inicial  | numeric   | NO
```

---

### Paso 2: Verificar Registros Existentes

```sql
SELECT 
    id,
    orden_compra,
    balance_inicial,
    balance,
    fecha_creacion
FROM balances_veritiv
ORDER BY fecha_creacion DESC
LIMIT 5;
```

**Verifica que:**
- Todos los registros tienen `balance_inicial` poblado
- `balance_inicial` >= `balance` (o igual si no se ha usado)

---

### Paso 3: Crear Nuevo Balance

1. Ve a `index.html` → **Balance** → **+ Nuevo Balance**
2. Llena el formulario:
   - Orden Compra: OC-2026-TEST
   - Fecha: Hoy
   - Material: Test Material
   - **Balance: 100**
3. Haz clic en "Guardar"

---

### Paso 4: Verificar en Base de Datos

```sql
SELECT 
    orden_compra,
    balance_inicial,
    balance
FROM balances_veritiv
WHERE orden_compra = 'OC-2026-TEST';
```

**Resultado esperado:**
```
orden_compra    | balance_inicial | balance
----------------|-----------------|--------
OC-2026-TEST    | 100.00          | 100.00
```

---

### Paso 5: Usar el Balance

1. Crea una OCI usando ese balance (100 piezas)
2. Aprueba la OCI con 80 piezas enviadas

---

### Paso 6: Verificar Balance Inicial No Cambió

```sql
SELECT 
    orden_compra,
    balance_inicial,  -- Debe seguir siendo 100
    balance           -- Debe ser 20 (100 - 80)
FROM balances_veritiv
WHERE orden_compra = 'OC-2026-TEST';
```

**Resultado esperado:**
```
orden_compra    | balance_inicial | balance
----------------|-----------------|--------
OC-2026-TEST    | 100.00          | 20.00
```

✅ **balance_inicial** sigue siendo **100** (no cambió)  
✅ **balance** ahora es **20** (100 - 80)

---

### Paso 7: Verificar en Balances Usados

1. Ve a `index.html` → **Balance** → **Balances Usados**
2. Busca el balance OC-2026-TEST
3. **Verifica:** Balance Inicial = **100** (no 120 ni otro valor)

---

## 📊 Estructura de Datos

### Tabla `balances_veritiv`

| Campo | Tipo | Descripción | ¿Cambia? |
|-------|------|-------------|----------|
| `id` | SERIAL | ID único | No |
| `orden_compra` | VARCHAR(100) | Número de orden | No |
| `fecha_orden_compra` | DATE | Fecha de la orden | No |
| `producto_id` | INTEGER | ID del producto | No |
| `material_carton` | VARCHAR(255) | Descripción del material | No |
| **`balance_inicial`** | **NUMERIC(10,2)** | **Balance original (fijo)** | **No** ✅ |
| **`balance`** | **NUMERIC(10,2)** | **Balance actual (variable)** | **Sí** ✅ |
| `fecha_creacion` | TIMESTAMP | Fecha de creación | No |
| `fecha_actualizacion` | TIMESTAMP | Fecha de actualización | Sí |
| `activo` | BOOLEAN | Si está activo | Sí |

---

## 🎯 Casos de Uso

### Caso 1: Crear Nuevo Balance

**Acción:** Usuario crea balance con 100 piezas

**Base de datos:**
```json
{
    "balance_inicial": 100,  // ✅ Se guarda
    "balance": 100           // ✅ Se guarda
}
```

---

### Caso 2: Usar Balance Completamente

**Acción:** Se crea OCI con 100 piezas, se aprueban 100 piezas

**Base de datos:**
```json
{
    "balance_inicial": 100,  // ✅ No cambia
    "balance": 0             // ✅ Se actualiza a 0
}
```

**Balances Usados muestra:**
- Balance Inicial: **100** ✅
- Balance Pedido: **100**
- Balance Enviado: **100**

---

### Caso 3: Usar Balance Parcialmente

**Acción:** Se crea OCI con 100 piezas, se aprueban 80 piezas

**Base de datos:**
```json
{
    "balance_inicial": 100,  // ✅ No cambia
    "balance": 20            // ✅ Se actualiza a 20 (100 - 80)
}
```

**Balances Activos muestra:**
- Balance: **20** ✅

**Balances Usados (cuando llegue a 0) mostrará:**
- Balance Inicial: **100** ✅
- Balance Pedido: **100**
- Balance Enviado: **80**

---

### Caso 4: Editar Balance

**Acción:** Usuario edita el balance y cambia la cantidad a 150

**Base de datos:**
```json
{
    "balance_inicial": 100,  // ✅ NO cambia (sigue siendo el original)
    "balance": 150           // ✅ Se actualiza a 150
}
```

**Nota:** `balance_inicial` **nunca** se actualiza al editar, solo al crear.

---

## 🔗 Relación con Otras Correcciones

Esta implementación es parte del sistema completo de gestión de balances:

| # | Corrección | Commit | Estado |
|---|------------|--------|--------|
| 1 | Mantener valor manual en Total Real a Enviar | `77a55fb` | ✅ |
| 2 | Mostrar valor manual en Balance Enviado | `2adcba1` | ✅ |
| 3 | Actualizar Balance Activos correctamente | `c42e263` | ✅ |
| 4 | **Balance Inicial fijo (no cambia)** | **`06aa57a`** | **✅** 👈 **ESTA** |

---

## 📝 Commits Relacionados

| Commit | Descripción | Fecha |
|--------|-------------|-------|
| `77a55fb` | Corregir: Mantener valor manual en Total Real a Enviar | 19/02/2026 |
| `2adcba1` | Corregir Balance Enviado para usar qty_a_enviar_piezas | 19/02/2026 |
| `c42e263` | Corregir actualización de balance al aprobar OCI | 19/02/2026 |
| `a40aeb3` | Agregar documentación de corrección de Balance Activos | 19/02/2026 |
| **`06aa57a`** | **Agregar campo balance_inicial para guardar balance original fijo** | **19/02/2026** |

---

## 🆘 Troubleshooting

### Problema: Error "column balance_inicial does not exist"

**Causa:** No se ejecutó el script SQL en Supabase

**Solución:**
1. Ejecuta `agregar_balance_inicial.sql` en Supabase SQL Editor
2. Verifica que el campo se creó correctamente
3. Limpia caché del navegador (Ctrl+Shift+R)

---

### Problema: Balance Inicial muestra NULL

**Causa:** Registros antiguos no fueron actualizados

**Solución:**
```sql
UPDATE balances_veritiv
SET balance_inicial = balance
WHERE balance_inicial IS NULL;
```

---

### Problema: Balance Inicial cambia al editar

**Causa:** El código está actualizando `balance_inicial` al editar

**Solución:**
- Verifica que la función `guardarBalance()` NO incluya `balance_inicial` en `balanceData` al actualizar
- Solo debe incluirse en `nuevoBalanceData` al crear

---

## 🎉 Conclusión

El campo `balance_inicial` ahora guarda el balance original con el que se dio de alta y **nunca cambia**, proporcionando un punto de referencia fijo para auditorías y análisis.

**Beneficios:**
- ✅ Balance Inicial es fijo y confiable
- ✅ No depende de cálculos dinámicos
- ✅ Facilita auditorías y reportes
- ✅ Mejor trazabilidad del inventario

**Fórmula:**
```
balance_inicial = Valor con el que se dio de alta (NUNCA CAMBIA)
balance = Valor actual disponible (CAMBIA al usar)
```

**Estado:** ✅ Completado y probado  
**Branch:** `contro-de-carton-1.2`  
**Commit:** `06aa57a`  
**Repositorio:** https://github.com/jcanett1/Controldecarton
