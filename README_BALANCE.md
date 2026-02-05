# Módulo Balance Veritiv - Guía Rápida

## 🚀 Inicio Rápido

### 1. Ejecutar SQL en Supabase
```sql
-- Copia y pega esto en SQL Editor de Supabase
-- Ver archivo: crear_tabla_sql.sql
```

### 2. Acceder al Módulo
1. Inicia sesión en la aplicación
2. Haz clic en "Balance" en el menú lateral
3. Haz clic en "Nuevo Balance"

### 3. Crear un Balance
- **Orden de Compra**: OC-2026-001
- **Fecha**: Selecciona la fecha
- **Producto**: (Opcional) Selecciona de la lista
- **Material**: Cartón corrugado 3mm
- **Balance**: 1500.50

## 📋 Campos

| Campo | Tipo | Requerido | Ejemplo |
|-------|------|-----------|---------|
| Orden Compra | Texto | ✅ | OC-2026-001 |
| Fecha Orden | Fecha | ✅ | 05/02/2026 |
| Producto | Lista | ❌ | Seleccionar... |
| Material | Texto | ✅ | Cartón corrugado 3mm |
| Balance | Número | ✅ | 1500.50 |

## 🔍 Funciones

- ✅ Crear balances
- ✅ Editar balances
- ✅ Eliminar balances
- ✅ Filtrar por orden de compra
- ✅ Filtrar por fecha
- ✅ Ver historial

## 📁 Archivos Importantes

- `crear_tabla_sql.sql` - SQL para crear tabla
- `INSTRUCCIONES_BALANCE.md` - Guía completa
- `RESUMEN_IMPLEMENTACION.md` - Detalles técnicos

## ⚠️ Importante

**Debes ejecutar el SQL en Supabase antes de usar el módulo.**

Ver: `crear_tabla_sql.sql`

## 🐛 Problemas Comunes

### No aparecen balances
- Verifica que ejecutaste el SQL
- Revisa las políticas RLS en Supabase

### No puedo crear balances
- Verifica que todos los campos estén llenos
- Revisa la consola del navegador (F12)

### Error de Foreign Key
- Verifica que la tabla `productos_carton` exista

---

**Documentación completa**: Ver `INSTRUCCIONES_BALANCE.md`
