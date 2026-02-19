# Guía Rápida: Sistema de Descuento Automático de Balances

## 🎯 ¿Qué hace esta funcionalidad?

Cuando creas una Orden de Compra Interna (OCI) y asignas un material a una OC-MTK (orden de compra de Veritiv), el sistema automáticamente:

1. ✅ **Valida** que hay suficiente balance disponible
2. 📉 **Descuenta** la cantidad de piezas usadas del balance
3. 📊 **Registra** el uso en un historial
4. 🔴 **Marca** visualmente los balances agotados

---

## 📝 Paso a Paso: Crear una OCI con descuento automático

### 1. Accede a la página de OCI Simple
- Abre `oci_simple.html` en tu navegador
- O haz clic en el menú "Nueva OCI"

### 2. Selecciona un material
- En el campo "Material", selecciona el material que necesitas
- El sistema mostrará información del material (número, piezas/pallet, descripción)

### 3. Selecciona la OC-MTK
- En el campo "Asignar OC-MTK", verás una lista desplegable con las órdenes de compra disponibles
- Cada opción muestra: `OC-XXXX (Balance: X,XXX piezas)`
- **Selecciona la OC-MTK** que quieres usar

### 4. Verifica el balance disponible
- Después de seleccionar la OC-MTK, aparecerá un campo mostrando el balance disponible
- Ejemplo: `10,000 piezas`

### 5. Ingresa la cantidad de pallets
- En "Cantidad de Pallets", ingresa cuántos pallets necesitas
- El sistema calculará automáticamente el total de piezas

### 6. Validación automática
- Si intentas usar más piezas de las disponibles, el sistema mostrará un mensaje de error:
  ```
  ⚠️ Balance insuficiente
  
  Balance disponible: 10,000 piezas
  Cantidad solicitada: 15,000 piezas
  
  Por favor, reduce la cantidad de pallets o selecciona otra OC-MTK.
  ```

### 7. Agrega el material a la orden
- Si hay suficiente balance, haz clic en "Agregar Material"
- El material se agregará a la tabla de materiales de la orden

### 8. Guarda la orden
- Haz clic en "Guardar Orden"
- El sistema:
  - Guardará la OCI en la base de datos
  - Descontará automáticamente las piezas del balance
  - Mostrará un mensaje de confirmación:
    ```
    Orden de compra OCI-2026-001 creada exitosamente con 1 materiales.
    
    📊 1 balance(s) actualizado(s) automáticamente.
    ```

---

## 📊 Ver el Estado de los Balances

### Acceder a la página de Balances
1. Abre `index.html` en tu navegador
2. En el menú lateral, haz clic en "Balance"

### Pestaña "Balances Activos"
Muestra todos los balances con cantidad disponible:

| Estado | Color | Descripción |
|--------|-------|-------------|
| 🟢 **Disponible** | Verde | Balance > 1000 piezas |
| 🟡 **Bajo** | Amarillo | Balance entre 1 y 999 piezas |
| 🔴 **Agotado** | Rojo | Balance = 0 piezas |

**Características:**
- Los balances agotados tienen fondo rojo claro
- El nombre del material aparece en rojo si está agotado
- Puedes filtrar por orden de compra o fecha

### Pestaña "Balances Usados"
Muestra el historial de balances agotados:

**Información que muestra:**
- Orden de compra
- Material de cartón
- Balance inicial (total usado)
- **OCIs ligadas** (con badges azules)
- Fecha de agotamiento

**Badges de OCIs:**
- Pasa el mouse sobre un badge de OCI para ver:
  - Cantidad de piezas usadas
  - Fecha y hora del uso

**Ejemplo:**
```
OCI-2026-001  OCI-2026-005  OCI-2026-010
(3 OCIs)
```

---

## 🔍 Buscar Balances Usados

1. Ve a la pestaña "Balances Usados"
2. En el campo de búsqueda, escribe el número de orden de compra
3. Haz clic en "Filtrar"
4. El sistema mostrará solo los balances que coincidan

---

## ⚙️ Configuración Inicial (Solo una vez)

### Crear la tabla en Supabase

**⚠️ IMPORTANTE:** Antes de usar esta funcionalidad, debes crear la tabla `oci_balances_usados` en Supabase.

1. Abre el archivo `INSTRUCCIONES_TABLA_OCI_BALANCES.md`
2. Sigue las instrucciones paso a paso
3. Ejecuta el script SQL en Supabase
4. Configura los permisos

**Tiempo estimado:** 5 minutos

---

## 💡 Consejos y Buenas Prácticas

### ✅ Recomendaciones

1. **Siempre selecciona la OC-MTK de la lista**
   - Esto asegura que el balance se descuente automáticamente
   - Si escribes manualmente, el balance NO se descontará

2. **Verifica el balance antes de agregar**
   - Revisa el campo "Balance Disponible" antes de continuar
   - Asegúrate de que hay suficiente cantidad

3. **Revisa la pestaña de Balances Usados regularmente**
   - Te ayudará a saber qué balances se han agotado
   - Podrás ver qué OCIs usaron cada balance

4. **Usa el filtro de búsqueda**
   - Para encontrar rápidamente balances específicos
   - Especialmente útil cuando tienes muchos registros

### ⚠️ Advertencias

1. **No elimines manualmente registros de balances**
   - Si eliminas un balance que tiene OCIs asociadas, también se eliminarán los registros del historial

2. **No modifiques directamente la base de datos**
   - Usa siempre la interfaz de la aplicación
   - Los cambios manuales pueden causar inconsistencias

3. **Verifica los logs en caso de error**
   - Abre la consola del navegador (F12)
   - Busca mensajes con emojis (🔄, ✅, ❌)

---

## 🐛 Solución de Problemas

### Problema: No aparece el balance disponible
**Solución:**
- Verifica que seleccionaste una OC-MTK de la lista (no escribiste manualmente)
- Refresca la página y vuelve a intentar

### Problema: El balance no se descuenta
**Solución:**
- Verifica que la tabla `oci_balances_usados` existe en Supabase
- Revisa los logs en la consola del navegador (F12)
- Verifica los permisos de la tabla en Supabase

### Problema: No aparecen balances en la pestaña "Balances Usados"
**Solución:**
- Verifica que existen balances con cantidad = 0
- Usa el filtro de búsqueda para verificar
- Refresca la página

### Problema: Error al guardar la OCI
**Solución:**
- Revisa los logs en la consola del navegador
- Verifica que todos los campos están completos
- Verifica tu conexión a internet

---

## 📞 Ayuda Adicional

Si necesitas más ayuda, consulta estos documentos:

- **`INSTRUCCIONES_TABLA_OCI_BALANCES.md`**: Instrucciones para crear la tabla en Supabase
- **`RESUMEN_CAMBIOS_BALANCES.md`**: Detalles técnicos de la implementación
- **`diseno_descuento_balances.md`**: Diseño técnico del sistema

---

## 🎉 ¡Listo!

Ahora puedes usar el sistema de descuento automático de balances. El sistema te ayudará a:

- ✅ Controlar el inventario de materiales
- ✅ Evitar sobregiros de balance
- ✅ Mantener un historial de uso
- ✅ Identificar rápidamente balances agotados

**¡Disfruta de tu nuevo sistema de gestión de balances!** 🚀
