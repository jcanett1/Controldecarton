# Resumen de Cambios: Sistema de Descuento Automático de Balances

## 📋 Descripción General

Se ha implementado un sistema completo para el descuento automático de balances al crear órdenes de compra internas (OCI), con indicadores visuales y un historial de balances usados.

---

## 🎯 Funcionalidades Implementadas

### 1. Descuento Automático de Balances

**Archivo:** `oci_simple.html`

**Cambios:**
- Modificación en la función `agregarMaterialALaOrden()`:
  - Captura el `balance_id` y `balance_disponible` cuando se selecciona una OC-MTK de la lista
  - Valida que hay suficiente balance antes de agregar el material
  - Muestra mensaje de error si el balance es insuficiente

- Modificación en la función `guardarOrden()`:
  - Después de guardar la OCI, procesa cada material con `balance_id`
  - Obtiene el balance actual de la base de datos
  - Calcula el nuevo balance (actual - usado)
  - Actualiza el balance en `balances_veritiv`
  - Registra el uso en la tabla `oci_balances_usados`
  - Muestra mensaje de confirmación con cantidad de balances actualizados

**Validaciones:**
- ✅ Verifica suficiente balance antes de agregar material
- ✅ Maneja errores sin detener el proceso completo
- ✅ Continúa con otros materiales si uno falla
- ✅ Registra logs detallados en consola

---

### 2. Indicadores Visuales en la Tabla de Balances

**Archivos:** `index.html`, `app.js`

**Cambios en `index.html`:**
- Agregada columna "Estado" en la tabla de balances activos
- Modificada estructura HTML para soportar pestañas

**Cambios en `app.js`:**
- Modificación en la función `renderizarBalances()`:
  - Calcula el estado del balance (Disponible, Bajo, Agotado)
  - Aplica estilos condicionales según el estado
  - Fila con fondo rojo claro para balances agotados
  - Texto del material en rojo cuando está agotado
  - Badges de estado con colores distintivos

**Estados:**
- 🟢 **Disponible**: Balance > 1000 piezas (verde)
- 🟡 **Bajo**: Balance entre 1 y 999 piezas (amarillo)
- 🔴 **Agotado**: Balance = 0 piezas (rojo)

---

### 3. Pestaña de Balances Usados

**Archivos:** `index.html`, `app.js`

**Cambios en `index.html`:**
- Agregadas pestañas "Balances Activos" y "Balances Usados"
- Nueva tabla para mostrar balances usados con columnas:
  - Orden Compra
  - Material de Cartón
  - Balance Inicial
  - Total Usado
  - OCIs Ligadas
  - Fecha Agotamiento

**Nuevas funciones en `app.js`:**

1. **`cambiarTabBalance(tab)`**
   - Cambia entre pestañas de balances activos y usados
   - Actualiza estilos de botones
   - Carga datos correspondientes

2. **`cargarBalancesUsados()`**
   - Obtiene balances con cantidad = 0
   - Para cada balance, consulta las OCIs que lo usaron
   - Calcula total de piezas usadas
   - Determina fecha de agotamiento
   - Renderiza tabla con badges de OCIs

3. **`filtrarBalancesUsados()`**
   - Filtra balances usados por orden de compra
   - Mantiene la misma estructura de datos

**Características:**
- 📊 Muestra historial completo de balances agotados
- 🔗 Lista de OCIs ligadas con badges interactivos
- 🕒 Fecha de agotamiento (última fecha de uso)
- 🔍 Filtro de búsqueda por orden de compra
- 💡 Tooltip en badges de OCI con detalles (cantidad y fecha)

---

### 4. Estilos CSS

**Archivo:** `index.html`

**Nuevos estilos agregados:**

```css
/* Estados de balance */
.status-badge.status-disponible { ... }
.status-badge.status-bajo { ... }
.status-badge.status-agotado { ... }

/* Badges de cantidad */
.quantity-badge.status-disponible { ... }
.quantity-badge.status-bajo { ... }
.quantity-badge.status-agotado { ... }

/* Badges de OCI */
.oci-badge { ... }
.oci-badge:hover { ... }

/* Pestañas de balance */
.balance-tab-btn.active { ... }
.balance-tab-content { ... }
```

---

## 🗄️ Base de Datos

### Nueva Tabla: `oci_balances_usados`

**Estructura:**
```sql
CREATE TABLE oci_balances_usados (
  id SERIAL PRIMARY KEY,
  numero_oci VARCHAR(50) NOT NULL,
  balance_id INTEGER NOT NULL,
  material_numero VARCHAR(50) NOT NULL,
  material_descripcion TEXT,
  cantidad_piezas_usadas INTEGER NOT NULL,
  fecha_uso TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (balance_id) REFERENCES balances_veritiv(id) ON DELETE CASCADE
);
```

**Índices:**
- `idx_oci_balances_numero_oci` (numero_oci)
- `idx_oci_balances_balance_id` (balance_id)
- `idx_oci_balances_fecha_uso` (fecha_uso DESC)

**Propósito:**
- Mantener historial de uso de balances
- Relacionar OCIs con balances usados
- Permitir consultas rápidas de historial

---

## 📁 Archivos Modificados

1. **`oci_simple.html`**
   - Líneas ~1051-1108: Modificación de `agregarMaterialALaOrden()`
   - Líneas ~1191-1275: Modificación de `guardarOrden()`

2. **`index.html`**
   - Líneas ~870-928: Nuevos estilos CSS para badges
   - Líneas ~1084-1103: Estilos para pestañas
   - Líneas ~1421-1512: Nueva estructura HTML con pestañas

3. **`app.js`**
   - Líneas ~2921-2932: Modificación de colspan en mensajes
   - Líneas ~2934-2986: Modificación de `renderizarBalances()`
   - Líneas ~3298-fin: Nuevas funciones para balances usados

---

## 📄 Archivos Nuevos

1. **`crear_tabla_oci_balances_usados.sql`**
   - Script SQL para crear la tabla en Supabase

2. **`INSTRUCCIONES_TABLA_OCI_BALANCES.md`**
   - Guía paso a paso para crear la tabla
   - Configuración de permisos
   - Solución de problemas

3. **`diseno_descuento_balances.md`**
   - Documento de diseño técnico
   - Análisis de estructura
   - Flujo de implementación

4. **`RESUMEN_CAMBIOS_BALANCES.md`**
   - Este documento

---

## 🚀 Instrucciones de Despliegue

### Paso 1: Crear la tabla en Supabase
1. Accede a Supabase SQL Editor
2. Ejecuta el script `crear_tabla_oci_balances_usados.sql`
3. Configura permisos RLS según `INSTRUCCIONES_TABLA_OCI_BALANCES.md`

### Paso 2: Subir archivos modificados
```bash
# Desde el directorio del proyecto
git add oci_simple.html index.html app.js
git commit -m "Implementar descuento automático de balances y pestaña de balances usados"
git push origin main
```

### Paso 3: Verificar funcionamiento
1. Abre `oci_simple.html` en el navegador
2. Crea una nueva OCI con un material
3. Selecciona una OC-MTK de la lista
4. Verifica que muestra el balance disponible
5. Guarda la OCI
6. Verifica el mensaje de confirmación con balances actualizados
7. Abre `index.html` y navega a la sección "Balance"
8. Verifica que la columna "Estado" muestra correctamente
9. Cambia a la pestaña "Balances Usados"
10. Verifica que muestra el balance agotado con las OCIs ligadas

---

## 🧪 Casos de Prueba

### Caso 1: Validación de balance insuficiente
- **Acción:** Intentar agregar más piezas de las disponibles en el balance
- **Resultado esperado:** Mensaje de error, no permite agregar

### Caso 2: Descuento automático
- **Acción:** Crear OCI con material asignado a balance
- **Resultado esperado:** Balance se descuenta automáticamente

### Caso 3: Balance agotado
- **Acción:** Usar todo el balance disponible
- **Resultado esperado:** 
  - Balance queda en 0
  - Aparece en rojo en la tabla de balances activos
  - Aparece en la pestaña de balances usados

### Caso 4: Historial de OCIs
- **Acción:** Usar el mismo balance en múltiples OCIs
- **Resultado esperado:** Todas las OCIs aparecen en la pestaña de balances usados

### Caso 5: Filtro de balances usados
- **Acción:** Buscar por número de orden de compra
- **Resultado esperado:** Muestra solo balances que coinciden

---

## 🔧 Mantenimiento

### Logs y Debugging
- Todos los procesos registran logs en la consola del navegador
- Busca emojis para identificar rápidamente el tipo de mensaje:
  - 🔄 Procesando
  - ✅ Éxito
  - ❌ Error
  - ⚠️ Advertencia
  - 🔍 Búsqueda
  - 📋 Información

### Consultas útiles en Supabase

**Ver todos los usos de balances:**
```sql
SELECT * FROM oci_balances_usados ORDER BY fecha_uso DESC;
```

**Ver balances agotados con OCIs:**
```sql
SELECT 
  bv.orden_compra,
  bv.material_carton,
  COUNT(obu.id) as total_ocis,
  SUM(obu.cantidad_piezas_usadas) as total_usado
FROM balances_veritiv bv
LEFT JOIN oci_balances_usados obu ON bv.id = obu.balance_id
WHERE bv.balance = 0
GROUP BY bv.id, bv.orden_compra, bv.material_carton;
```

**Ver historial de un balance específico:**
```sql
SELECT * FROM oci_balances_usados 
WHERE balance_id = [ID_DEL_BALANCE]
ORDER BY fecha_uso DESC;
```

---

## 📞 Soporte

Si encuentras algún problema:

1. Revisa los logs en la consola del navegador (F12)
2. Verifica que la tabla `oci_balances_usados` existe en Supabase
3. Verifica los permisos RLS en Supabase
4. Consulta el documento `INSTRUCCIONES_TABLA_OCI_BALANCES.md`

---

## 🎉 Mejoras Futuras (Opcional)

- [ ] Agregar gráficas de uso de balances
- [ ] Exportar historial de balances usados a Excel
- [ ] Notificaciones cuando un balance está por agotarse
- [ ] Restaurar balance si se elimina una OCI
- [ ] Auditoría de cambios en balances
- [ ] Dashboard de estadísticas de uso de balances

---

**Fecha de implementación:** 19 de febrero de 2026  
**Versión:** 1.0  
**Desarrollador:** Manus AI
