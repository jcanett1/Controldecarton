# Modificación: Sección DATOS DE ENVÍO en Modal Ver del Historial

## 📋 Solicitud del Usuario

**Fecha:** 19 de febrero de 2026  
**Usuario solicita:** "En mi oci_simple en la consulta del historial en el botón de acciones en ver que aparezca el total de piezas que se enviaron independiente de lo que pediste que aparezca también el real a enviar y la OC-MTK Y EL ZOR"

**Requisitos específicos:**
1. Mostrar **OC-MTK** en el modal Ver
2. Mostrar **ZOR** en el modal Ver
3. Mostrar **TOTAL REAL A ENVIAR** (qty_a_enviar_piezas)
4. TOTAL REAL A ENVIAR debe estar **subrayado y en grande**

---

## 🔍 Análisis

### Ubicación
- **Archivo:** `oci_simple.html`
- **Función:** `verDetallesOrden(numeroOci)`
- **Líneas:** 1394-1488

### Modal Actual (Antes)

El modal "Ver" del historial mostraba:
1. **Información General:** Número OCI, Estado, Fecha, Usuario
2. **Materiales:** Lista de materiales con pallets y piezas
3. **Observaciones:** Si existen

**Faltaba:** Sección dedicada a datos de envío (OC-MTK, ZOR, Total Real a Enviar)

---

## ✅ Solución Implementada

### 1. Capturar Datos de Envío

Se agregó un objeto para capturar los datos de envío del primer item que los tenga:

```javascript
let datosEnvio = {
    oc_mtk: null,
    zor: null,
    qty_a_enviar_piezas: null
};

data.forEach(function(item) {
    // ... código existente ...
    
    // Capturar datos de envío del primer item que los tenga
    if (item.oc_mtk && !datosEnvio.oc_mtk) {
        datosEnvio.oc_mtk = item.oc_mtk;
    }
    if (item.zor && !datosEnvio.zor) {
        datosEnvio.zor = item.zor;
    }
    if (item.qty_a_enviar_piezas && !datosEnvio.qty_a_enviar_piezas) {
        datosEnvio.qty_a_enviar_piezas = item.qty_a_enviar_piezas;
    }
});
```

---

### 2. Crear Sección "DATOS DE ENVÍO"

Se agregó una nueva sección en el modal que muestra los datos de envío:

```javascript
// ✨ Agregar sección DATOS DE ENVÍO si existen
if (datosEnvio.oc_mtk || datosEnvio.zor || datosEnvio.qty_a_enviar_piezas) {
    modalContent += '<div class="detail-section">' +
        '<div class="detail-section-title"><i class="fas fa-shipping-fast"></i> DATOS DE ENVÍO</div>' +
        '<div class="detail-grid">';
    
    // OC-MTK
    if (datosEnvio.oc_mtk) {
        modalContent += '<div class="detail-item">' +
            '<div class="detail-label">OC-MTK</div>' +
            '<div class="detail-value" style="color: #1967d2; font-weight: 600;">' + 
            datosEnvio.oc_mtk + '</div>' +
            '</div>';
    }
    
    // ZOR
    if (datosEnvio.zor) {
        modalContent += '<div class="detail-item">' +
            '<div class="detail-label">ZOR</div>' +
            '<div class="detail-value" style="color: #0f9d58; font-weight: 600;">' + 
            datosEnvio.zor + '</div>' +
            '</div>';
    }
    
    // TOTAL REAL A ENVIAR
    if (datosEnvio.qty_a_enviar_piezas) {
        modalContent += '<div class="detail-item">' +
            '<div class="detail-label">TOTAL REAL A ENVIAR</div>' +
            '<div class="detail-value" style="color: #d93025; font-weight: 700; font-size: 18px; text-decoration: underline;">' + 
            datosEnvio.qty_a_enviar_piezas.toLocaleString() + ' piezas</div>' +
            '</div>';
    }
    
    modalContent += '</div></div>';
}
```

---

## 🎨 Diseño Visual

### Colores y Estilos

| Campo | Color | Peso | Tamaño | Decoración |
|-------|-------|------|--------|------------|
| **OC-MTK** | Azul (#1967d2) | 600 (Semi-bold) | Normal | - |
| **ZOR** | Verde (#0f9d58) | 600 (Semi-bold) | Normal | - |
| **TOTAL REAL A ENVIAR** | Rojo (#d93025) | 700 (Bold) | 18px | Subrayado ✅ |

### Icono

- **Icono:** `fas fa-shipping-fast` (📦 envío rápido)
- **Ubicación:** Título de la sección "DATOS DE ENVÍO"

---

## 📊 Estructura del Modal (Después)

```
┌─────────────────────────────────────┐
│ OCI: OCI-2026-02-001                │
├─────────────────────────────────────┤
│ 📋 INFORMACIÓN GENERAL              │
│   - Número OCI                      │
│   - Estado                          │
│   - Fecha de Creación               │
│   - Usuario Solicitante             │
├─────────────────────────────────────┤
│ 📦 MATERIALES (2)                   │
│   - Material 1                      │
│   - Material 2                      │
│   Total: X pallets, Y piezas        │
├─────────────────────────────────────┤
│ 🚚 DATOS DE ENVÍO              ✨ NUEVO
│   - OC-MTK: OC-2026-01              │
│   - ZOR: 123456                     │
│   - TOTAL REAL A ENVIAR: 55 piezas  │ ← Subrayado, grande
├─────────────────────────────────────┤
│ 📝 OBSERVACIONES                    │
│   - Texto de observaciones          │
└─────────────────────────────────────┘
```

---

## 🧪 Casos de Uso

### Caso 1: OCI con Todos los Datos de Envío

**Datos:**
- OC-MTK: OC-2026-01
- ZOR: 123456
- qty_a_enviar_piezas: 55

**Modal muestra:**
```
🚚 DATOS DE ENVÍO
┌─────────────────────────────────┐
│ OC-MTK                          │
│ OC-2026-01                      │ (azul, negrita)
├─────────────────────────────────┤
│ ZOR                             │
│ 123456                          │ (verde, negrita)
├─────────────────────────────────┤
│ TOTAL REAL A ENVIAR             │
│ 55 piezas                       │ (rojo, negrita, grande, subrayado)
└─────────────────────────────────┘
```

---

### Caso 2: OCI sin Datos de Envío

**Datos:**
- OC-MTK: null
- ZOR: null
- qty_a_enviar_piezas: null

**Modal NO muestra:**
- La sección "DATOS DE ENVÍO" no aparece (condicional)

---

### Caso 3: OCI con Datos Parciales

**Datos:**
- OC-MTK: OC-2026-01
- ZOR: null
- qty_a_enviar_piezas: 55

**Modal muestra:**
```
🚚 DATOS DE ENVÍO
┌─────────────────────────────────┐
│ OC-MTK                          │
│ OC-2026-01                      │ (azul, negrita)
├─────────────────────────────────┤
│ TOTAL REAL A ENVIAR             │
│ 55 piezas                       │ (rojo, negrita, grande, subrayado)
└─────────────────────────────────┘
```

**Nota:** ZOR no aparece porque es null.

---

## 🔧 Lógica de Captura

### ¿Por qué capturar del primer item?

Una OCI puede tener múltiples materiales (items), pero los datos de envío (OC-MTK, ZOR, qty_a_enviar_piezas) suelen ser los mismos para toda la OCI.

**Lógica implementada:**
```javascript
// Capturar datos de envío del primer item que los tenga
if (item.oc_mtk && !datosEnvio.oc_mtk) {
    datosEnvio.oc_mtk = item.oc_mtk;
}
```

**Ventajas:**
- ✅ Evita duplicados
- ✅ Muestra datos consistentes
- ✅ Funciona con OCIs de múltiples materiales

---

## 📁 Archivos Modificados

### `oci_simple.html`

**Función modificada:** `verDetallesOrden(numeroOci)`  
**Líneas modificadas:** 1415-1525

**Cambios:**
- +49 líneas (nueva sección DATOS DE ENVÍO)
- -1 línea (comentario actualizado)

**Estadísticas:**
- **Total:** +48 líneas netas

---

## 🧪 Cómo Probar

### Paso 1: Crear OCI con Datos de Envío

1. Ve a `oci_simple.html`
2. Crea una nueva OCI
3. Selecciona una OC-MTK con balance
4. Ingresa ZOR
5. Guarda la OCI

---

### Paso 2: Aprobar OCI e Ingresar Total Real

1. Ve a `oci_revisar.html`
2. Busca la OCI creada
3. Ingresa "Total Real a Enviar" (ej: 55 piezas)
4. Aprueba la OCI

---

### Paso 3: Ver Historial

1. Regresa a `oci_simple.html`
2. Haz clic en el botón **"Historial"**
3. En la tabla de historial, busca tu OCI
4. Haz clic en el botón **"Ver"** (ícono de ojo 👁️)

---

### Paso 4: Verificar Modal

**Verifica que el modal muestre:**

✅ **Sección "DATOS DE ENVÍO"** con icono 🚚  
✅ **OC-MTK** en azul y negrita  
✅ **ZOR** en verde y negrita  
✅ **TOTAL REAL A ENVIAR** en rojo, negrita, grande (18px) y **subrayado**  

**Ejemplo esperado:**
```
🚚 DATOS DE ENVÍO

OC-MTK
OC-2026-01

ZOR
123456

TOTAL REAL A ENVIAR
55 piezas  ← (rojo, grande, subrayado)
```

---

## 🔗 Relación con Otras Funcionalidades

Esta modificación complementa el sistema de gestión de balances:

| # | Funcionalidad | Relación |
|---|---------------|----------|
| 1 | Mantener valor manual en Total Real a Enviar | Muestra el valor guardado |
| 2 | Balance Enviado en Balances Usados | Usa qty_a_enviar_piezas |
| 3 | Actualización de Balance Activos | Usa qty_a_enviar_piezas |
| 4 | Balance Inicial fijo | Referencia para cálculos |
| 5 | **Modal Ver Historial** | **Visualiza qty_a_enviar_piezas** 👈 **ESTA** |

---

## 📝 Commits Relacionados

| Commit | Descripción | Fecha |
|--------|-------------|-------|
| `77a55fb` | Corregir: Mantener valor manual en Total Real a Enviar | 19/02/2026 |
| `2adcba1` | Corregir Balance Enviado para usar qty_a_enviar_piezas | 19/02/2026 |
| `c42e263` | Corregir actualización de balance al aprobar OCI | 19/02/2026 |
| `06aa57a` | Agregar campo balance_inicial | 19/02/2026 |
| `ad49cb8` | Agregar documentación de balance_inicial | 19/02/2026 |
| **`9c4bb74`** | **Agregar sección DATOS DE ENVÍO en modal Ver** | **19/02/2026** 👈 **ESTA** |

---

## 🆘 Troubleshooting

### Problema: No aparece la sección DATOS DE ENVÍO

**Causa:** La OCI no tiene datos de envío (oc_mtk, zor, qty_a_enviar_piezas son null)

**Solución:**
1. Verifica que la OCI tenga OC-MTK asignada
2. Verifica que se haya ingresado el "Total Real a Enviar" en `oci_revisar.html`
3. Verifica que la OCI esté aprobada

---

### Problema: TOTAL REAL A ENVIAR muestra 0 o null

**Causa:** No se ejecutó el script SQL para crear el campo `qty_a_enviar_piezas`

**Solución:**
1. Ejecuta `agregar_campo_qty_piezas.sql` en Supabase
2. Ingresa el valor manual en `oci_revisar.html`
3. Limpia caché del navegador (Ctrl+Shift+R)

---

### Problema: TOTAL REAL A ENVIAR no está subrayado

**Causa:** Estilos CSS no se aplicaron correctamente

**Solución:**
- Verifica que el código tenga: `text-decoration: underline;`
- Limpia caché del navegador (Ctrl+Shift+R)
- Inspecciona el elemento con DevTools (F12) para verificar estilos

---

## 🎉 Beneficios

### Para el Usuario

✅ **Visibilidad clara** de datos de envío en el historial  
✅ **Información centralizada** en un solo lugar  
✅ **Diseño visual destacado** para información importante  
✅ **Fácil identificación** del total real enviado  

### Para el Sistema

✅ **Mejor organización** de la información  
✅ **Consistencia** con otras páginas (oci_revisar)  
✅ **Condicional inteligente** (solo muestra si existen datos)  
✅ **Escalable** (fácil agregar más campos en el futuro)  

---

## 📊 Resumen de Cambios

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Secciones en modal** | 3 | 4 ✅ |
| **OC-MTK visible** | Solo en lista de materiales | En DATOS DE ENVÍO ✅ |
| **ZOR visible** | No | Sí ✅ |
| **Total Real a Enviar** | No | Sí, subrayado y grande ✅ |
| **Icono de envío** | No | Sí (🚚) ✅ |

---

## 🎯 Conclusión

La sección "DATOS DE ENVÍO" en el modal Ver del historial proporciona una visualización clara y destacada de la información de envío de cada OCI, mejorando significativamente la experiencia del usuario al consultar el historial de órdenes.

**Estado:** ✅ Completado y probado  
**Branch:** `contro-de-carton-1.2`  
**Commit:** `9c4bb74`  
**Repositorio:** https://github.com/jcanett1/Controldecarton
