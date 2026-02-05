# Guía Visual - Módulo Balance Veritiv

## 📱 Interfaz de Usuario

### 1. Menú de Navegación

```
┌─────────────────────────────────┐
│  🏢 Almacén Cartón              │
├─────────────────────────────────┤
│  📊 Dashboard                   │
│  📦 Productos                   │
│  🏭 Inventario                  │
│  🔄 Movimientos                 │
│  ➕ Crear OCI                   │
│  ✅ Revisar OCI                 │
│  🚚 Recibido                    │
│  ⚖️  Balance          ◄─ NUEVO  │
│  🏭 Producción                  │
│  📈 Reportes                    │
└─────────────────────────────────┘
```

### 2. Vista Principal de Balance

```
┌──────────────────────────────────────────────────────────────────┐
│  Balance Veritiv                              [+ Nuevo Balance]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Buscar por orden...] [Fecha: ____] [🔍 Filtrar]              │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  Orden Compra │ Fecha Orden │ Material      │ Balance │ Acciones│
├──────────────────────────────────────────────────────────────────┤
│  OC-2026-001  │ 05/02/2026  │ Cartón 3mm    │ 1500.50 │ ✏️  🗑️  │
│  OC-2026-002  │ 04/02/2026  │ Cartón 5mm    │ 2300.00 │ ✏️  🗑️  │
│  OC-2026-003  │ 03/02/2026  │ Cartón doble  │  850.25 │ ✏️  🗑️  │
└──────────────────────────────────────────────────────────────────┘
```

### 3. Modal de Nuevo Balance

```
┌────────────────────────────────────────────┐
│  Nuevo Balance Veritiv               [✕]  │
├────────────────────────────────────────────┤
│                                            │
│  Orden de Compra *                         │
│  [OC-2026-001_________________]            │
│                                            │
│  Fecha de Orden de Compra *                │
│  [05/02/2026__________________]            │
│                                            │
│  Producto de Cartón                        │
│  [Seleccione un producto... ▼]             │
│                                            │
│  Material de Cartón *                      │
│  [Cartón corrugado 3mm________]            │
│                                            │
│  Balance (Cantidad) *                      │
│  [1500.50_____________________]            │
│                                            │
│              [Cancelar]  [💾 Guardar]      │
└────────────────────────────────────────────┘
```

## 🎯 Flujo de Trabajo

### Crear un Nuevo Balance

```
1. Clic en "Balance"
   │
   ▼
2. Clic en "Nuevo Balance"
   │
   ▼
3. Llenar formulario:
   ├─ Orden de Compra: OC-2026-001
   ├─ Fecha: 05/02/2026
   ├─ Producto: (Opcional)
   ├─ Material: Cartón corrugado 3mm
   └─ Balance: 1500.50
   │
   ▼
4. Clic en "Guardar"
   │
   ▼
5. ✅ Balance creado exitosamente
```

### Editar un Balance

```
1. Localizar balance en la tabla
   │
   ▼
2. Clic en ícono de lápiz (✏️)
   │
   ▼
3. Modal se abre con datos precargados
   │
   ▼
4. Modificar campos necesarios
   │
   ▼
5. Clic en "Guardar"
   │
   ▼
6. ✅ Balance actualizado exitosamente
```

### Filtrar Balances

```
1. Ingresar criterios de búsqueda:
   ├─ Orden de compra: "OC-2026"
   └─ Fecha: 05/02/2026
   │
   ▼
2. Clic en "Filtrar"
   │
   ▼
3. Tabla muestra resultados filtrados
```

## 📊 Estados de la Interfaz

### Estado: Cargando

```
┌──────────────────────────────────┐
│                                  │
│           ⏳                     │
│     Cargando balances...         │
│                                  │
└──────────────────────────────────┘
```

### Estado: Sin Datos

```
┌──────────────────────────────────┐
│                                  │
│           📭                     │
│   No hay balances registrados    │
│                                  │
│  Haz clic en "Nuevo Balance"     │
│      para agregar uno            │
│                                  │
└──────────────────────────────────┘
```

### Estado: Error

```
┌──────────────────────────────────┐
│                                  │
│           ⚠️                     │
│    Error al cargar balances      │
│                                  │
│      [🔄 Reintentar]             │
│                                  │
└──────────────────────────────────┘
```

## 🎨 Elementos Visuales

### Badges de Cantidad

```
┌─────────┐
│ 1500.50 │  ← Verde (Normal)
└─────────┘

┌─────────┐
│  850.25 │  ← Verde (Normal)
└─────────┘
```

### Botones de Acción

```
[✏️]  ← Editar (hover: azul)
[🗑️]  ← Eliminar (hover: rojo)
```

### Botón Principal

```
┌─────────────────────┐
│  + Nuevo Balance    │  ← Azul gradiente
└─────────────────────┘
```

## 📱 Responsive Design

### Desktop (> 768px)

```
┌─────────┬────────────────────────────────────┐
│ Sidebar │  Contenido Principal               │
│         │                                    │
│ Balance │  Tabla completa con 6 columnas     │
│         │                                    │
└─────────┴────────────────────────────────────┘
```

### Mobile (< 768px)

```
┌────────────────────────────────┐
│  ☰  Balance Veritiv            │
├────────────────────────────────┤
│                                │
│  Tabla adaptada                │
│  (scroll horizontal)           │
│                                │
│  Filtros en columna            │
│                                │
└────────────────────────────────┘
```

## 🎬 Animaciones

### Hover en Fila de Tabla

```
Normal:  ┌──────────────────┐
         │ OC-2026-001 ...  │
         └──────────────────┘

Hover:   ┌──────────────────┐
         │ OC-2026-001 ...  │  ← Fondo gris claro
         └──────────────────┘
```

### Modal Aparece

```
1. Fondo oscuro fade-in (0.3s)
2. Modal slide-down (0.3s)
3. Contenido fade-in (0.2s)
```

## 🎯 Validaciones Visuales

### Campo Válido

```
┌─────────────────────────┐
│ OC-2026-001             │  ← Borde azul al focus
└─────────────────────────┘
```

### Campo Inválido

```
┌─────────────────────────┐
│ [vacío]                 │  ← Borde rojo
└─────────────────────────┘
  ⚠️ Este campo es requerido
```

### Campo con Datos

```
┌─────────────────────────┐
│ OC-2026-001         ✓   │  ← Checkmark verde
└─────────────────────────┘
```

## 🌈 Paleta de Colores

```
Primario:    #3b82f6  ████  (Azul)
Secundario:  #10b981  ████  (Verde)
Advertencia: #f59e0b  ████  (Amarillo)
Error:       #ef4444  ████  (Rojo)
Texto:       #1e293b  ████  (Gris oscuro)
Fondo:       #f8fafc  ████  (Gris claro)
```

## 📐 Tipografía

```
Títulos:     Inter Bold 24px
Subtítulos:  Inter SemiBold 18px
Texto:       Inter Regular 16px
Pequeño:     Inter Regular 14px
```

## 🔔 Notificaciones

### Éxito

```
┌────────────────────────────────┐
│ ✅ Balance creado exitosamente │
└────────────────────────────────┘
```

### Error

```
┌────────────────────────────────┐
│ ❌ Error al guardar el balance │
└────────────────────────────────┘
```

### Confirmación

```
┌────────────────────────────────┐
│ ⚠️  ¿Eliminar este balance?    │
│                                │
│   [Cancelar]  [Eliminar]       │
└────────────────────────────────┘
```

## 🎭 Iconos Utilizados

```
⚖️  Balance (menú)
➕  Nuevo
✏️  Editar
🗑️  Eliminar
🔍  Buscar/Filtrar
💾  Guardar
✕   Cerrar
📅  Fecha
📦  Producto
📝  Material
🔢  Cantidad
✅  Éxito
❌  Error
⚠️  Advertencia
⏳  Cargando
📭  Sin datos
```

## 🖱️ Interacciones

### Click en Fila

```
Click → Selecciona fila (opcional)
```

### Click en Editar

```
Click → Abre modal con datos
```

### Click en Eliminar

```
Click → Muestra confirmación → Elimina
```

### Click en Filtrar

```
Click → Aplica filtros → Actualiza tabla
```

### Click Fuera del Modal

```
Click → Cierra modal
```

## 📊 Ejemplo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│ Orden      │ Fecha      │ Material         │ Balance  │ Acciones│
├─────────────────────────────────────────────────────────────────┤
│ OC-2026-001│ 05/02/2026 │ Cartón 3mm       │ 1500.50  │ ✏️  🗑️  │
│            │            │ #12345 - Caja    │          │         │
├─────────────────────────────────────────────────────────────────┤
│ OC-2026-002│ 04/02/2026 │ Cartón 5mm       │ 2300.00  │ ✏️  🗑️  │
│            │            │ #12346 - Lamina  │          │         │
├─────────────────────────────────────────────────────────────────┤
│ OC-2026-003│ 03/02/2026 │ Cartón doble     │  850.25  │ ✏️  🗑️  │
│            │            │ Sin producto     │          │         │
└─────────────────────────────────────────────────────────────────┘
```

---

**Nota**: Esta es una representación visual en ASCII. La interfaz real utiliza HTML, CSS y JavaScript moderno con diseño responsive y animaciones suaves.
