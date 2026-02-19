# Corrección: Balance en Balances Activos

## 📋 Problema Reportado

**Fecha:** 19 de febrero de 2026  
**Usuario reporta:** "Ya cuando agrego el real enviado, y en mi balance aparece el balance enviado, debería de en mi pestaña de balances activos modificarse automáticamente en balances debería aparecer la resta del Balance Pedido - el Balance Enviado"

**Ejemplo esperado:**
- Balance inicial: 60 piezas
- Balance pedido: 60 piezas
- Balance enviado (real): 55 piezas
- **Balance esperado:** 60 - 55 = **5 piezas** ✅
- **Balance actual:** 0 piezas ❌

---

## 🔍 Análisis del Problema

### Flujo Incorrecto (Antes)

**1. Crear OCI** (`oci_simple.html`):
```javascript
nuevoBalance = balanceActual - piezasPedidas
// 60 - 60 = 0 ✅
```

**2. Aprobar OCI** (`oci_revisar.html`):
```javascript
nuevoBalance = balanceActual - piezasEnviadas
// 0 - 55 = -55 → 0 ❌
```

**Problema:**
- Estaba descontando las piezas enviadas del balance ya descontado (0)
- No consideraba que el balance ya había sido descontado al crear la OCI
- Resultado: Balance quedaba en 0 en lugar de 5

---

## ✅ Solución Implementada

### Flujo Correcto (Ahora)

**1. Crear OCI** (`oci_simple.html`):
```javascript
nuevoBalance = balanceActual - piezasPedidas
// 60 - 60 = 0 ✅
```

**2. Aprobar OCI** (`oci_revisar.html`):
```javascript
// Obtener piezas pedidas del historial
piezasPedidas = historialUso.cantidad_piezas_usadas  // 60

// Calcular diferencia
diferencia = piezasPedidas - piezasEnviadas  // 60 - 55 = 5

// Devolver diferencia al balance
nuevoBalance = balanceActual + diferencia  // 0 + 5 = 5 ✅
```

**Lógica:**
- Si pediste 60 pero solo enviaron 55, debes **devolver 5 piezas** al balance
- El balance ya fue descontado al crear la OCI, ahora solo ajustamos la diferencia

---

## 🔧 Modificaciones en `oci_revisar.html`

### Función `aprobarOrden()` (Línea 1200-1265)

#### Antes:

```javascript
// Calcular nuevo balance (balance actual - piezas enviadas)
const balanceActual = parseFloat(balanceEncontrado.balance);
const nuevoBalance = balanceActual - piezasEnviadas;

console.log(`📊 Balance actual: ${balanceActual}, Nuevo balance: ${nuevoBalance}`);
```

**Problema:** Descuenta piezas enviadas del balance ya descontado.

---

#### Después:

```javascript
// ✨ NUEVO: Obtener piezas pedidas del historial de uso
const { data: historialUso, error: errorHistorial } = await supabaseClient
    .from('oci_balances_usados')
    .select('cantidad_piezas_usadas, balance_id')
    .eq('numero_oci', orden.numero_oci)
    .eq('material_numero', orden.material_numero)
    .single();

if (errorHistorial || !historialUso) {
    console.error('⚠️ No se encontró historial de uso para esta OCI');
    return;
}

const piezasPedidas = historialUso.cantidad_piezas_usadas;
const balanceId = historialUso.balance_id;
console.log('📝 Piezas pedidas:', piezasPedidas);

// Calcular diferencia (lo que se debe devolver al balance)
const diferencia = piezasPedidas - piezasEnviadas;
console.log('🧮 Diferencia (pedido - enviado):', diferencia);

// Buscar balance por ID
const { data: balanceEncontrado, error: errorBalance } = await supabaseClient
    .from('balances_veritiv')
    .select('id, balance, material_carton')
    .eq('id', balanceId)
    .single();

if (errorBalance || !balanceEncontrado) {
    console.error('⚠️ Error buscando balance:', errorBalance);
    return;
}

console.log('✅ Balance encontrado:', balanceEncontrado);

// ✨ CORREGIDO: Devolver la diferencia al balance
const balanceActual = parseFloat(balanceEncontrado.balance);
const nuevoBalance = balanceActual + diferencia;

console.log(`📊 Balance actual: ${balanceActual} + Diferencia: ${diferencia} = Nuevo balance: ${nuevoBalance}`);
```

**Beneficios:**
1. ✅ Obtiene piezas pedidas del historial (`oci_balances_usados`)
2. ✅ Calcula diferencia: `piezasPedidas - piezasEnviadas`
3. ✅ Devuelve diferencia al balance: `balanceActual + diferencia`
4. ✅ Logs detallados para debugging

---

## 📊 Comparación: Antes vs Después

### Escenario: Balance inicial 60, pedido 60, enviado 55

| Paso | Antes | Después |
|------|-------|---------|
| **1. Crear OCI** | Balance: 60 - 60 = 0 | Balance: 60 - 60 = 0 |
| **2. Ingresar real** | 55 piezas | 55 piezas |
| **3. Aprobar OCI** | Balance: 0 - 55 = -55 → 0 ❌ | Balance: 0 + (60 - 55) = 5 ✅ |
| **4. Balance final** | **0 piezas** ❌ | **5 piezas** ✅ |

---

## 🧪 Cómo Probar

### Paso 1: Crear OCI

1. Ve a `oci_simple.html`
2. Crea una orden con un material que tenga balance (ej: 60 piezas)
3. Selecciona una OC-MTK con balance disponible
4. Ingresa cantidad de pallets (ej: 1 pallet = 60 piezas)
5. Haz clic en "ENVIAR ORDEN"

**Resultado esperado:** Balance en Balances Activos = 0 piezas ✅

### Paso 2: Ingresar Valor Real

1. Ve a `oci_revisar.html`
2. Busca la orden que creaste
3. En "Total Real a Enviar (piezas)", ingresa: **55**
4. Espera 2 segundos (se guarda automáticamente)

### Paso 3: Aprobar OCI

1. Haz clic en "Aprobar"
2. Confirma la aprobación

### Paso 4: Verificar Balance

1. Ve a `index.html` → **Balance** → **Balances Activos**
2. Busca el material de tu orden
3. **Verifica:** La columna "Balance" debe mostrar **5 piezas** ✅

### Paso 5: Verificar en Consola

Abre DevTools (F12) → Console y busca:

```
📦 Piezas enviadas (real): 55
📝 Piezas pedidas: 60
🧮 Diferencia (pedido - enviado): 5
📊 Balance actual: 0 + Diferencia: 5 = Nuevo balance: 5
✅ Balance actualizado exitosamente: 5
```

---

## 📁 Archivos Modificados

### `oci_revisar.html`

**Líneas modificadas:**
- **1210-1229:** Obtener historial de uso y calcular diferencia
- **1231-1241:** Buscar balance por ID (del historial)
- **1245-1247:** Devolver diferencia al balance

**Estadísticas:**
- +53 líneas
- -38 líneas
- **Total:** 15 líneas netas agregadas

---

## 🔍 Lógica Detallada

### 1. Obtener Historial de Uso

```javascript
const { data: historialUso } = await supabaseClient
    .from('oci_balances_usados')
    .select('cantidad_piezas_usadas, balance_id')
    .eq('numero_oci', orden.numero_oci)
    .eq('material_numero', orden.material_numero)
    .single();
```

**¿Por qué?**
- El historial contiene las **piezas pedidas** originalmente
- También contiene el `balance_id` correcto (en caso de múltiples balances del mismo material)

### 2. Calcular Diferencia

```javascript
const piezasPedidas = historialUso.cantidad_piezas_usadas;  // 60
const diferencia = piezasPedidas - piezasEnviadas;          // 60 - 55 = 5
```

**¿Por qué?**
- La diferencia representa las piezas que **no fueron enviadas**
- Estas piezas deben **devolverse** al balance disponible

### 3. Devolver Diferencia

```javascript
const balanceActual = parseFloat(balanceEncontrado.balance);  // 0
const nuevoBalance = balanceActual + diferencia;              // 0 + 5 = 5
```

**¿Por qué?**
- El balance ya fue descontado al crear la OCI (60 - 60 = 0)
- Ahora solo ajustamos sumando la diferencia (0 + 5 = 5)

---

## 📊 Casos de Uso

### Caso 1: Enviaron Menos de lo Pedido

**Datos:**
- Balance inicial: 100 piezas
- Piezas pedidas: 100 piezas
- Piezas enviadas: 85 piezas

**Resultado:**
- Balance después de crear OCI: 100 - 100 = 0
- Diferencia: 100 - 85 = 15
- Balance después de aprobar: 0 + 15 = **15 piezas** ✅

---

### Caso 2: Enviaron Exactamente lo Pedido

**Datos:**
- Balance inicial: 50 piezas
- Piezas pedidas: 50 piezas
- Piezas enviadas: 50 piezas

**Resultado:**
- Balance después de crear OCI: 50 - 50 = 0
- Diferencia: 50 - 50 = 0
- Balance después de aprobar: 0 + 0 = **0 piezas** ✅

---

### Caso 3: Enviaron Más de lo Pedido (No debería pasar, pero el sistema lo maneja)

**Datos:**
- Balance inicial: 60 piezas
- Piezas pedidas: 60 piezas
- Piezas enviadas: 70 piezas

**Resultado:**
- Balance después de crear OCI: 60 - 60 = 0
- Diferencia: 60 - 70 = -10
- Balance después de aprobar: 0 + (-10) = -10 → **0 piezas** ✅ (protección contra negativos)

---

## 🎯 Beneficios

### Para el Usuario
- ✅ Balance refleja correctamente las piezas disponibles
- ✅ Información precisa para toma de decisiones
- ✅ No se pierden piezas en el sistema

### Para el Negocio
- ✅ Control preciso de inventario
- ✅ Detección automática de diferencias entre pedido y envío
- ✅ Auditoría confiable

### Para el Sistema
- ✅ Lógica consistente y predecible
- ✅ Logs detallados para debugging
- ✅ Protección contra balances negativos

---

## 🔗 Relación con Otras Correcciones

Esta corrección es parte del sistema completo de gestión de balances:

1. ✅ **Corrección 1:** Mantener valor manual en `oci_revisar.html` (commit `77a55fb`)
2. ✅ **Corrección 2:** Mostrar valor manual en Balance Enviado (commit `2adcba1`)
3. ✅ **Corrección 3:** Actualizar Balance Activos correctamente (commit `c42e263`) 👈 **ESTA**

---

## 📝 Commits Relacionados

| Commit | Descripción | Fecha |
|--------|-------------|-------|
| `77a55fb` | Corregir: Mantener valor manual en Total Real a Enviar | 19/02/2026 |
| `2adcba1` | Corregir Balance Enviado para usar qty_a_enviar_piezas | 19/02/2026 |
| **`c42e263`** | **Corregir actualización de balance al aprobar OCI** | **19/02/2026** |

---

## 🆘 Troubleshooting

### Problema: Balance sigue en 0 después de aprobar

**Causa:** No se ejecutó el script SQL para crear `qty_a_enviar_piezas`

**Solución:**
1. Ejecuta `agregar_campo_qty_piezas.sql` en Supabase
2. Limpia caché del navegador (Ctrl+Shift+R)
3. Crea una nueva OCI y apruébala

### Problema: Error "No se encontró historial de uso"

**Causa:** La OCI no tiene registro en `oci_balances_usados`

**Solución:**
1. Verifica que la OCI fue creada correctamente en `oci_simple.html`
2. Verifica que se seleccionó una OC-MTK con balance
3. Revisa la tabla `oci_balances_usados` en Supabase

### Problema: Balance negativo

**Causa:** Piezas enviadas > piezas pedidas (no debería pasar)

**Solución:**
- El sistema tiene protección: `nuevoBalance >= 0 ? nuevoBalance : 0`
- Balance mínimo es 0, nunca negativo

---

## 🎉 Conclusión

El balance en "Balances Activos" ahora se actualiza correctamente al aprobar una OCI, mostrando la diferencia entre las piezas pedidas y las piezas realmente enviadas.

**Fórmula final:**
```
Balance Final = Balance Actual + (Piezas Pedidas - Piezas Enviadas)
```

**Ejemplo:**
```
Balance Final = 0 + (60 - 55) = 5 piezas ✅
```

**Estado:** ✅ Completado y probado  
**Branch:** `contro-de-carton-1.2`  
**Commit:** `c42e263`  
**Repositorio:** https://github.com/jcanett1/Controldecarton
