# Corrección: Balance Enviado en Balances Usados

## 📋 Problema Reportado

**Fecha:** 19 de febrero de 2026  
**Usuario reporta:** "En mi página de balances en la pestaña de balances usados en la columna de balances enviado no aparece lo que enviaron realmente, el cual debería de jalar de: Total Real a Enviar (piezas) de la página de oci_revisar"

---

## 🔍 Análisis del Problema

### Comportamiento Incorrecto

La columna **"Balance Enviado"** en la pestaña **"Balances Usados"** estaba calculando:

```javascript
const piezasEnviadas = (orden.qty_a_enviar || 0) * (orden.piezas_por_pallet || 1);
```

**Problema:**
- Usaba `qty_a_enviar` (pallets) multiplicado por `piezas_por_pallet`
- **NO** usaba `qty_a_enviar_piezas` (valor manual ingresado por el usuario)
- Mostraba un valor calculado en lugar del valor real enviado

### Ejemplo del Error

**Escenario:**
- Usuario ingresa en `oci_revisar.html`: **55 piezas** (valor real enviado)
- Sistema guarda:
  - `qty_a_enviar`: 1 pallet (55 ÷ 60 = 0.91 → ceil = 1)
  - `qty_a_enviar_piezas`: **55 piezas** (valor manual)
- Balance Enviado mostraba: **60 piezas** ❌ (1 pallet × 60 pzs/pallet)
- **Debería mostrar:** **55 piezas** ✅ (valor manual)

---

## ✅ Solución Implementada

### Modificaciones en `app.js`

#### 1. Función `cargarBalancesUsados()` (Línea 3425-3440)

**Antes:**
```javascript
const { data: ordenesAprobadas } = await supabase
    .from('ordenes_compra')
    .select('numero_oci, material_numero, qty_a_enviar, piezas_por_pallet, estado')
    .eq('material_numero', balance.producto ? balance.producto.numero_parte : balance.material_carton)
    .eq('estado', 'APROBADA');

const balanceEnviado = ordenesAprobadas ? ordenesAprobadas.reduce((sum, orden) => {
    const piezasEnviadas = (orden.qty_a_enviar || 0) * (orden.piezas_por_pallet || 1);
    return sum + piezasEnviadas;
}, 0) : 0;
```

**Después:**
```javascript
const { data: ordenesAprobadas } = await supabase
    .from('ordenes_compra')
    .select('numero_oci, material_numero, qty_a_enviar, qty_a_enviar_piezas, piezas_por_pallet, estado')
    //                                                    ^^^^^^^^^^^^^^^^^^^^^ AGREGADO
    .eq('material_numero', balance.producto ? balance.producto.numero_parte : balance.material_carton)
    .eq('estado', 'APROBADA');

// ✨ CORREGIDO: Calcular balance enviado usando qty_a_enviar_piezas (valor manual) si existe
const balanceEnviado = ordenesAprobadas ? ordenesAprobadas.reduce((sum, orden) => {
    // Priorizar qty_a_enviar_piezas (valor manual), si no existe usar cálculo
    const piezasEnviadas = orden.qty_a_enviar_piezas 
        ? orden.qty_a_enviar_piezas 
        : ((orden.qty_a_enviar || 0) * (orden.piezas_por_pallet || 1));
    return sum + piezasEnviadas;
}, 0) : 0;
```

**Cambios:**
1. ✅ Agregado `qty_a_enviar_piezas` al `select()`
2. ✅ Prioriza `qty_a_enviar_piezas` (valor manual)
3. ✅ Fallback a cálculo si no existe (compatibilidad)

---

#### 2. Función `filtrarBalancesUsados()` (Línea 3594-3607)

**Mismos cambios aplicados** para que el filtro también use el valor manual.

**Antes:**
```javascript
const { data: ordenesAprobadas } = await supabase
    .from('ordenes_compra')
    .select('numero_oci, material_numero, qty_a_enviar, piezas_por_pallet, estado')
    .eq('material_numero', balance.producto ? balance.producto.numero_parte : balance.material_carton)
    .eq('estado', 'APROBADA');

const balanceEnviado = ordenesAprobadas ? ordenesAprobadas.reduce((sum, orden) => {
    const piezasEnviadas = (orden.qty_a_enviar || 0) * (orden.piezas_por_pallet || 1);
    return sum + piezasEnviadas;
}, 0) : 0;
```

**Después:**
```javascript
const { data: ordenesAprobadas } = await supabase
    .from('ordenes_compra')
    .select('numero_oci, material_numero, qty_a_enviar, qty_a_enviar_piezas, piezas_por_pallet, estado')
    //                                                    ^^^^^^^^^^^^^^^^^^^^^ AGREGADO
    .eq('material_numero', balance.producto ? balance.producto.numero_parte : balance.material_carton)
    .eq('estado', 'APROBADA');

// ✨ CORREGIDO: Usar qty_a_enviar_piezas (valor manual) si existe
const balanceEnviado = ordenesAprobadas ? ordenesAprobadas.reduce((sum, orden) => {
    const piezasEnviadas = orden.qty_a_enviar_piezas 
        ? orden.qty_a_enviar_piezas 
        : ((orden.qty_a_enviar || 0) * (orden.piezas_por_pallet || 1));
    return sum + piezasEnviadas;
}, 0) : 0;
```

---

## 📊 Comparación: Antes vs Después

### Escenario: Usuario ingresa 55 piezas en oci_revisar

| Campo | Antes | Después |
|-------|-------|---------|
| **Total Real a Enviar** | 55 piezas (ingresado) | 55 piezas (ingresado) |
| **qty_a_enviar** (BD) | 1 pallet | 1 pallet |
| **qty_a_enviar_piezas** (BD) | - | **55 piezas** ✅ |
| **Balance Enviado (mostrado)** | 60 piezas ❌ | **55 piezas** ✅ |
| **Diferencia** | +5 piezas (error) | 0 piezas (correcto) |

---

## 🔍 Lógica de Priorización

El sistema ahora usa esta lógica para calcular "Balance Enviado":

```javascript
const piezasEnviadas = orden.qty_a_enviar_piezas 
    ? orden.qty_a_enviar_piezas              // 1️⃣ Prioridad: Valor manual
    : ((orden.qty_a_enviar || 0) * (orden.piezas_por_pallet || 1));  // 2️⃣ Fallback: Cálculo
```

**Casos:**

1. **Orden nueva con valor manual:**
   - `qty_a_enviar_piezas` = 55
   - **Resultado:** 55 piezas ✅

2. **Orden antigua sin valor manual:**
   - `qty_a_enviar_piezas` = NULL
   - `qty_a_enviar` = 1 pallet
   - `piezas_por_pallet` = 60
   - **Resultado:** 60 piezas (calculado) ✅

3. **Orden sin aprobar:**
   - `qty_a_enviar_piezas` = NULL
   - `qty_a_enviar` = NULL
   - **Resultado:** 0 piezas ✅

---

## 🧪 Cómo Probar

### Paso 1: Limpiar Caché
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### Paso 2: Crear Orden de Prueba

1. Ve a `oci_simple.html`
2. Crea una nueva orden con un material
3. Haz clic en "ENVIAR ORDEN"

### Paso 3: Ingresar Valor Manual

1. Ve a `oci_revisar.html`
2. Busca la orden que creaste
3. En "Total Real a Enviar (piezas)", ingresa: **55**
4. Espera 2 segundos (se guarda automáticamente)

### Paso 4: Aprobar Orden

1. Haz clic en "Aprobar"
2. Confirma la aprobación

### Paso 5: Verificar Balance Enviado

1. Ve a `index.html` → **Balance** → **Balances Usados**
2. Busca el material de tu orden
3. **Verifica:** La columna "Balance Enviado" debe mostrar **55 piezas** ✅

### Paso 6: Verificar en Consola

Abre DevTools (F12) → Console y busca:
```
✅ Datos completos de balances usados: 1
```

---

## 📁 Archivos Modificados

### `app.js`

**Líneas modificadas:**
- **3429:** Agregado `qty_a_enviar_piezas` al select de `cargarBalancesUsados()`
- **3434-3440:** Lógica de priorización de valor manual
- **3597:** Agregado `qty_a_enviar_piezas` al select de `filtrarBalancesUsados()`
- **3602-3607:** Lógica de priorización de valor manual (filtro)

**Estadísticas:**
- +11 líneas
- -5 líneas
- **Total:** 6 líneas netas agregadas

---

## 🔗 Relación con Otras Correcciones

Esta corrección es parte de la implementación del sistema de valor manual en "Total Real a Enviar":

1. ✅ **Corrección 1:** Mantener valor manual en `oci_revisar.html` (commit `77a55fb`)
2. ✅ **Corrección 2:** Mostrar valor manual en modal "Ver" (commit `77a55fb`)
3. ✅ **Corrección 3:** Usar valor manual al aprobar OCI (commit `77a55fb`)
4. ✅ **Corrección 4:** Mostrar valor manual en Balance Enviado (commit `2adcba1`) 👈 **ESTA**

---

## ✅ Resultado Final

### Columnas en "Balances Usados"

| Columna | Origen | Descripción |
|---------|--------|-------------|
| **Orden Compra** | `balances_veritiv.orden_compra` | Número de orden de compra |
| **Material** | `balances_veritiv.material_carton` | Descripción del material |
| **Balance Inicial** | Calculado: `balance actual + balance pedido` | Balance con el que se dio de alta |
| **Balance Pedido** | `oci_balances_usados.cantidad_piezas_usadas` | Suma de piezas pedidas en OCIs |
| **Balance Enviado** | **`ordenes_compra.qty_a_enviar_piezas`** ✅ | **Valor manual real enviado** |
| **OCIs Ligadas** | `oci_balances_usados.numero_oci` | Números de OCI que usaron el balance |
| **Fecha Agotamiento** | `oci_balances_usados.fecha_uso` | Fecha del último uso |

---

## 🎯 Beneficios

### Para el Usuario
- ✅ Ve el valor **real** enviado, no un cálculo
- ✅ Información precisa para auditorías
- ✅ Confianza en los datos del sistema

### Para el Negocio
- ✅ Datos precisos de piezas enviadas vs pedidas
- ✅ Detección de diferencias entre pedido y envío
- ✅ Mejor control de inventario

### Para el Sistema
- ✅ Consistencia en toda la aplicación
- ✅ Compatibilidad con órdenes antiguas
- ✅ Código más robusto y mantenible

---

## 📝 Commits Relacionados

| Commit | Descripción | Fecha |
|--------|-------------|-------|
| `77a55fb` | Corregir: Mantener valor manual en Total Real a Enviar | 19/02/2026 |
| `5a5fb56` | Agregar guía rápida de implementación | 19/02/2026 |
| **`2adcba1`** | **Corregir Balance Enviado para usar qty_a_enviar_piezas** | **19/02/2026** |

---

## 🆘 Troubleshooting

### Problema: Balance Enviado sigue mostrando valor calculado

**Causa:** No se ejecutó el script SQL para crear `qty_a_enviar_piezas`

**Solución:**
1. Ejecuta `agregar_campo_qty_piezas.sql` en Supabase
2. Limpia caché del navegador (Ctrl+Shift+R)
3. Recarga la página de balances

### Problema: Balance Enviado muestra 0

**Causa:** La orden no tiene `qty_a_enviar_piezas` ni `qty_a_enviar`

**Solución:**
1. Ve a `oci_revisar.html`
2. Ingresa un valor en "Total Real a Enviar (piezas)"
3. Aprueba la orden
4. Recarga la página de balances

### Problema: Error en consola "qty_a_enviar_piezas does not exist"

**Causa:** No se ejecutó el script SQL

**Solución:**
1. Ejecuta el script `agregar_campo_qty_piezas.sql` en Supabase SQL Editor
2. Verifica que el campo se creó:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'ordenes_compra' 
   AND column_name = 'qty_a_enviar_piezas';
   ```

---

## 🎉 Conclusión

La columna "Balance Enviado" ahora muestra correctamente el valor manual ingresado en "Total Real a Enviar (piezas)" de `oci_revisar.html`, proporcionando información precisa y confiable sobre las piezas realmente enviadas.

**Estado:** ✅ Completado y probado  
**Branch:** `contro-de-carton-1.2`  
**Commit:** `2adcba1`  
**Repositorio:** https://github.com/jcanett1/Controldecarton
