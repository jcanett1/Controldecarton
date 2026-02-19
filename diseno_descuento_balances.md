# Diseño: Descuento Automático de Balances en OCI

## Objetivo
Implementar un sistema que descuente automáticamente los balances de materiales cuando se crea una OCI, con indicadores visuales y un historial de balances usados.

## Análisis de la Estructura Actual

### Tablas Involucradas

1. **ordenes_compra** (Supabase)
   - numero_oci
   - fecha_creacion
   - usuario_solicitante_id
   - material_numero
   - piezas_por_pallet
   - cantidad_pallets
   - cantidad_total_piezas
   - oc_mtk (número de OC-MTK asignada)
   - observaciones
   - estado

2. **balances_veritiv** (Supabase)
   - id
   - orden_compra
   - fecha_orden_compra
   - producto_id
   - material_carton
   - balance (cantidad disponible)
   - fecha_creacion
   - fecha_actualizacion
   - activo

### Flujo Actual en oci_simple.html

1. Usuario selecciona un material
2. Sistema carga las OC-MTK disponibles desde `balances_veritiv`
3. Usuario selecciona una OC-MTK y ve el balance disponible
4. Usuario agrega el material con cantidad de pallets
5. Al guardar, se inserta en `ordenes_compra` pero **NO se actualiza el balance**

## Requerimientos de la Nueva Funcionalidad

### 1. Descuento Automático de Balance

**Comportamiento:**
- Al guardar una OCI, por cada material que tenga una OC-MTK asignada:
  - Buscar el registro en `balances_veritiv` correspondiente
  - Restar la cantidad de piezas usadas del balance
  - Si el balance llega a 0, marcar el registro de alguna forma (campo adicional o cambio de estado)

**Validación:**
- Verificar que hay suficiente balance antes de guardar
- Si no hay suficiente balance, mostrar error y no permitir guardar

### 2. Tabla de Relación OCI-Balance

**Nueva tabla: `oci_balances_usados`**
```sql
CREATE TABLE oci_balances_usados (
  id SERIAL PRIMARY KEY,
  numero_oci VARCHAR(50) NOT NULL,
  balance_id INTEGER NOT NULL REFERENCES balances_veritiv(id),
  material_numero VARCHAR(50) NOT NULL,
  cantidad_piezas_usadas INTEGER NOT NULL,
  fecha_uso TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (numero_oci) REFERENCES ordenes_compra(numero_oci)
);
```

Esta tabla permitirá:
- Rastrear qué OCIs usaron qué balances
- Mantener un historial de uso
- Mostrar en la página de balances qué OCIs están ligadas a cada balance

### 3. Indicadores Visuales

**En la página de balances (index.html):**
- Balances con cantidad > 0: color normal (negro/gris)
- Balances con cantidad = 0: color rojo o fondo rojo claro
- Agregar una columna "Estado" que muestre:
  - "Disponible" (verde) si balance > 0
  - "Agotado" (rojo) si balance = 0

### 4. Pestaña de Balances Usados

**En la sección de Balance (index.html):**
- Agregar pestañas:
  - "Balances Activos" (actual)
  - "Balances Usados" (nueva)

**Contenido de "Balances Usados":**
- Mostrar balances con cantidad = 0
- Columnas adicionales:
  - OCIs ligadas (lista de números de OCI)
  - Fecha de agotamiento
  - Total de piezas usadas

## Implementación Técnica

### Paso 1: Crear tabla de relación
- Script SQL para crear `oci_balances_usados`

### Paso 2: Modificar función `guardarOrden()` en oci_simple.html
```javascript
async function guardarOrden(event) {
  // ... código actual ...
  
  // NUEVO: Por cada material con OC-MTK
  for (const item of materialesEnOrden) {
    if (item.oc_mtk) {
      // 1. Buscar balance_id correspondiente
      const { data: balance } = await supabaseClient
        .from('balances_veritiv')
        .select('id, balance')
        .eq('orden_compra', item.oc_mtk)
        .eq('material_carton', item.descripcion)
        .single();
      
      if (balance) {
        // 2. Validar que hay suficiente balance
        if (balance.balance < item.total_piezas) {
          throw new Error(`Balance insuficiente para ${item.descripcion}`);
        }
        
        // 3. Actualizar balance
        const nuevoBalance = balance.balance - item.total_piezas;
        await supabaseClient
          .from('balances_veritiv')
          .update({ balance: nuevoBalance })
          .eq('id', balance.id);
        
        // 4. Registrar uso en tabla de relación
        await supabaseClient
          .from('oci_balances_usados')
          .insert({
            numero_oci: numeroOci,
            balance_id: balance.id,
            material_numero: item.numero,
            cantidad_piezas_usadas: item.total_piezas
          });
      }
    }
  }
  
  // ... resto del código ...
}
```

### Paso 3: Modificar la visualización de balances en index.html
- Agregar columna "Estado"
- Aplicar estilos condicionales según balance
- Agregar pestaña "Balances Usados"

### Paso 4: Crear función para cargar balances usados
```javascript
async function cargarBalancesUsados() {
  const { data } = await supabaseClient
    .from('balances_veritiv')
    .select(`
      *,
      oci_balances_usados (
        numero_oci,
        cantidad_piezas_usadas,
        fecha_uso
      )
    `)
    .eq('balance', 0)
    .eq('activo', true);
  
  // Renderizar tabla con OCIs ligadas
}
```

## Consideraciones

1. **Transacciones:** Idealmente, todo el proceso de guardar OCI + actualizar balances debería ser una transacción atómica
2. **Rollback:** Si falla la actualización de balance, debería revertirse la creación de la OCI
3. **Permisos:** Verificar que el usuario de Supabase tiene permisos para UPDATE en `balances_veritiv`
4. **Validación:** Agregar validación en el frontend antes de enviar para evitar errores

## Próximos Pasos

1. Crear la tabla `oci_balances_usados` en Supabase
2. Modificar `oci_simple.html` para implementar el descuento automático
3. Modificar `index.html` para agregar indicadores visuales y pestaña de balances usados
4. Probar el flujo completo
