# 🚀 Instrucciones de Implementación - Corrección Total Real a Enviar

## ⚠️ IMPORTANTE: Debes ejecutar el script SQL antes de usar el sistema

---

## 📋 Paso 1: Crear el Campo en Supabase (OBLIGATORIO)

### 1.1 Acceder a Supabase SQL Editor

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión en tu proyecto
3. En el menú lateral, haz clic en **"SQL Editor"**
4. Haz clic en **"New query"**

### 1.2 Ejecutar el Script SQL

1. Abre el archivo `agregar_campo_qty_piezas.sql` en tu repositorio
2. **Copia TODO el contenido** del archivo
3. **Pégalo** en el editor SQL de Supabase
4. Haz clic en **"Run"** o presiona `Ctrl+Enter`

### 1.3 Verificar que se Creó Correctamente

Ejecuta esta consulta para verificar:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ordenes_compra' 
AND column_name = 'qty_a_enviar_piezas';
```

**Resultado esperado:**
```
column_name           | data_type | is_nullable
----------------------|-----------|------------
qty_a_enviar_piezas   | integer   | YES
```

✅ Si ves este resultado, el campo se creó correctamente.

---

## 📁 Paso 2: Actualizar Archivos (Ya están en el repositorio)

Los siguientes archivos ya fueron actualizados y subidos al repositorio:

- ✅ `oci_revisar.html`
- ✅ `oci_simple.html`
- ✅ `agregar_campo_qty_piezas.sql`
- ✅ `CORRECCION_QTY_MANUAL.md`

**No necesitas hacer nada más**, solo asegúrate de tener la última versión del branch `contro-de-carton-1.2`.

---

## 🧪 Paso 3: Probar el Sistema

### 3.1 Limpiar Caché del Navegador

1. Presiona `Ctrl+Shift+R` (Windows/Linux) o `Cmd+Shift+R` (Mac)
2. O abre DevTools (F12) → Pestaña "Network" → Marca "Disable cache"

### 3.2 Probar en `oci_simple.html`

1. Accede a `oci_simple.html`
2. Crea una nueva orden de compra
3. **Verifica:** El botón debe decir **"ENVIAR ORDEN"** ✅

### 3.3 Probar en `oci_revisar.html`

1. Accede a `oci_revisar.html`
2. Busca una orden pendiente
3. En la columna **"Total Real a Enviar (piezas)"**, ingresa un valor manual (ej: **55**)
4. Espera 2 segundos (se guarda automáticamente)
5. **Recarga la página** (F5)
6. **Verifica:** El valor debe seguir siendo **55** ✅

### 3.4 Probar Modal "Ver"

1. En `oci_revisar.html`, haz clic en el botón **"Ver"** de una orden
2. En la sección **"DATOS DE ENVÍO"**, busca **"TOTAL REAL A ENVIAR"**
3. **Verifica:** Debe mostrar el valor manual que ingresaste (ej: **55 piezas**) ✅

### 3.5 Probar Aprobación

1. Ingresa un valor manual en "Total Real a Enviar" (ej: **55**)
2. Haz clic en **"Aprobar"**
3. Confirma la aprobación
4. Ve a la página de **Balances** → Pestaña **"Balances Usados"**
5. **Verifica:** El balance debe haberse descontado **55 piezas**, no 60 ✅

---

## 🔍 Paso 4: Verificar Logs en Consola

Para ver que todo funciona correctamente:

1. Abre DevTools (F12)
2. Ve a la pestaña **"Console"**
3. Ingresa un valor manual y guárdalo
4. **Debes ver:**
   ```
   ✅ Guardado: Piezas manuales = 55 , Pallets = 1
   ```
5. Aprueba una orden
6. **Debes ver:**
   ```
   🔄 Actualizando balance para material: #0632545
   📦 Piezas enviadas (manual): 55
   ✅ Balance actualizado exitosamente
   ```

---

## ✅ Checklist de Implementación

Marca cada paso cuando lo completes:

- [ ] **Paso 1.1:** Accedí a Supabase SQL Editor
- [ ] **Paso 1.2:** Ejecuté el script `agregar_campo_qty_piezas.sql`
- [ ] **Paso 1.3:** Verifiqué que el campo se creó correctamente
- [ ] **Paso 2:** Tengo la última versión del repositorio
- [ ] **Paso 3.1:** Limpié la caché del navegador
- [ ] **Paso 3.2:** Verifiqué que el botón dice "ENVIAR ORDEN"
- [ ] **Paso 3.3:** Probé ingresar un valor manual y se mantiene al recargar
- [ ] **Paso 3.4:** Verifiqué que el modal "Ver" muestra el valor manual
- [ ] **Paso 3.5:** Probé aprobar una orden y el balance se descuenta correctamente
- [ ] **Paso 4:** Verifiqué los logs en la consola

---

## ❓ Preguntas Frecuentes

### ¿Qué pasa con las órdenes creadas antes de esta actualización?

**Respuesta:** El sistema mantiene compatibilidad total. Las órdenes antiguas seguirán funcionando normalmente, pero usarán el cálculo automático (`qty_a_enviar × piezas_por_pallet`) porque no tienen el campo `qty_a_enviar_piezas`.

### ¿Puedo modificar el valor manual después de guardarlo?

**Respuesta:** Sí, puedes cambiar el valor en cualquier momento antes de aprobar la orden. Solo ingresa el nuevo valor y se guardará automáticamente.

### ¿Qué pasa si no ejecuto el script SQL?

**Respuesta:** El sistema mostrará errores al intentar guardar valores manuales. **Es obligatorio ejecutar el script SQL** antes de usar la funcionalidad.

### ¿El campo `qty_a_enviar` sigue existiendo?

**Respuesta:** Sí, se mantiene para compatibilidad. Ahora el sistema guarda:
- `qty_a_enviar`: Pallets (calculado)
- `qty_a_enviar_piezas`: Piezas (manual)

### ¿Puedo ver qué órdenes tienen valor manual vs calculado?

**Respuesta:** Sí, ejecuta esta consulta en Supabase:

```sql
SELECT 
    numero_oci,
    qty_a_enviar,
    qty_a_enviar_piezas,
    CASE 
        WHEN qty_a_enviar_piezas IS NOT NULL THEN 'Manual'
        ELSE 'Calculado'
    END as tipo_valor
FROM ordenes_compra
ORDER BY fecha_creacion DESC;
```

---

## 🆘 Soporte

### Si algo no funciona:

1. **Verifica que ejecutaste el script SQL** en Supabase
2. **Limpia la caché del navegador** (Ctrl+Shift+R)
3. **Revisa los logs en la consola** (F12 → Console)
4. **Verifica que tienes la última versión** del repositorio

### Errores Comunes

**Error:** "column 'qty_a_enviar_piezas' does not exist"
- **Causa:** No ejecutaste el script SQL
- **Solución:** Ve al Paso 1 y ejecuta el script

**Error:** El valor sigue recalculándose
- **Causa:** Caché del navegador
- **Solución:** Presiona Ctrl+Shift+R para limpiar caché

**Error:** No se guarda el valor
- **Causa:** Permisos RLS en Supabase
- **Solución:** Verifica que tu usuario tiene permisos de UPDATE en `ordenes_compra`

---

## 📊 Resumen de Cambios

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `ordenes_compra` (tabla) | Nuevo campo `qty_a_enviar_piezas` | ⚠️ Requiere ejecutar SQL |
| `oci_revisar.html` | Guardar y mostrar valor manual | ✅ Actualizado |
| `oci_simple.html` | Botón "ENVIAR ORDEN" | ✅ Actualizado |
| `agregar_campo_qty_piezas.sql` | Script SQL | ✅ Creado |
| `CORRECCION_QTY_MANUAL.md` | Documentación técnica | ✅ Creado |

---

## 🎉 ¡Listo!

Una vez que completes todos los pasos del checklist, el sistema estará funcionando correctamente.

**Tiempo estimado de implementación:** 5-10 minutos

**Repositorio:** https://github.com/jcanett1/Controldecarton  
**Branch:** `contro-de-carton-1.2`  
**Commit:** `77a55fb`
