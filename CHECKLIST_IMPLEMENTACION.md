# ✅ Checklist de Implementación - Módulo Balance Veritiv

## 📋 Antes de Comenzar

- [ ] Tienes acceso al proyecto Supabase
- [ ] Tienes acceso al repositorio GitHub
- [ ] La aplicación está funcionando correctamente
- [ ] Tienes permisos de administrador

## 🗄️ Configuración de Base de Datos

### Paso 1: Ejecutar SQL en Supabase

- [ ] Abrir Supabase Dashboard: https://supabase.com/dashboard/project/bdrxcilsuxbkpmolfbgu
- [ ] Ir a **SQL Editor**
- [ ] Abrir el archivo `crear_tabla_sql.sql`
- [ ] Copiar todo el contenido
- [ ] Pegar en SQL Editor
- [ ] Hacer clic en **Run**
- [ ] Verificar que no hay errores
- [ ] Confirmar que la tabla `balances_veritiv` fue creada

### Verificación de la Tabla

```sql
-- Ejecutar esto en SQL Editor para verificar
SELECT * FROM balances_veritiv LIMIT 1;
```

**Resultado esperado**: Query ejecuta sin errores (puede estar vacía)

## 📦 Verificación del Código

### Archivos Nuevos Creados

- [ ] `src/models/balance.py` - Modelo de datos
- [ ] `src/routes/balances.py` - Rutas del API
- [ ] `crear_tabla_sql.sql` - Script SQL
- [ ] `INSTRUCCIONES_BALANCE.md` - Documentación
- [ ] `RESUMEN_IMPLEMENTACION.md` - Resumen técnico
- [ ] `README_BALANCE.md` - Guía rápida
- [ ] `GUIA_VISUAL_BALANCE.md` - Guía visual

### Archivos Modificados

- [ ] `index.html` - Añadida sección Balance y modal
- [ ] `app.js` - Añadidas funciones JavaScript
- [ ] `src/main_supabase.py` - Registrado blueprint

### Commits Realizados

- [ ] Commit 1: `458d617` - Implementación principal
- [ ] Commit 2: `ee27099` - Documentación adicional
- [ ] Commit 3: `a2badcd` - Guía visual

## 🚀 Despliegue

### GitHub

- [ ] Cambios subidos a rama `contro-de-carton-1.2`
- [ ] Verificar en GitHub que los archivos están presentes
- [ ] Verificar que no hay conflictos

### Aplicación Web

- [ ] La aplicación se actualizó automáticamente (si usa GitHub Pages)
- [ ] O hacer deploy manual según tu configuración

## 🧪 Pruebas Funcionales

### Acceso al Módulo

- [ ] Abrir la aplicación en el navegador
- [ ] Iniciar sesión
- [ ] Verificar que aparece "Balance" en el menú lateral
- [ ] Hacer clic en "Balance"
- [ ] Verificar que carga la página sin errores

### Crear Balance

- [ ] Hacer clic en "Nuevo Balance"
- [ ] Verificar que se abre el modal
- [ ] Llenar todos los campos:
  - [ ] Orden de Compra: `OC-TEST-001`
  - [ ] Fecha: Hoy
  - [ ] Producto: (Opcional) Seleccionar uno
  - [ ] Material: `Material de prueba`
  - [ ] Balance: `100.50`
- [ ] Hacer clic en "Guardar"
- [ ] Verificar mensaje de éxito
- [ ] Verificar que aparece en la tabla

### Editar Balance

- [ ] Localizar el balance de prueba en la tabla
- [ ] Hacer clic en el ícono de lápiz (✏️)
- [ ] Verificar que el modal se abre con datos precargados
- [ ] Modificar el balance a `200.75`
- [ ] Hacer clic en "Guardar"
- [ ] Verificar mensaje de éxito
- [ ] Verificar que se actualizó en la tabla

### Filtrar Balances

- [ ] Ingresar `OC-TEST` en el campo de búsqueda
- [ ] Hacer clic en "Filtrar"
- [ ] Verificar que muestra solo el balance de prueba
- [ ] Limpiar el filtro
- [ ] Verificar que muestra todos los balances

### Eliminar Balance

- [ ] Localizar el balance de prueba
- [ ] Hacer clic en el ícono de basura (🗑️)
- [ ] Verificar que aparece confirmación
- [ ] Hacer clic en "Aceptar"
- [ ] Verificar mensaje de éxito
- [ ] Verificar que desaparece de la tabla

## 🔍 Verificación de Consola

### Consola del Navegador (F12)

- [ ] Abrir DevTools (F12)
- [ ] Ir a la pestaña **Console**
- [ ] Verificar que no hay errores en rojo
- [ ] Buscar mensajes como:
  - `🔄 Cargando balances...`
  - `✅ Balances cargados: X`

### Network Tab

- [ ] Ir a la pestaña **Network**
- [ ] Filtrar por `balances`
- [ ] Verificar que las peticiones retornan 200 OK
- [ ] Verificar que la respuesta tiene formato JSON correcto

## 📊 Verificación en Supabase

### Table Editor

- [ ] Ir a Supabase Dashboard
- [ ] Ir a **Table Editor**
- [ ] Buscar tabla `balances_veritiv`
- [ ] Verificar que tiene las columnas correctas
- [ ] Verificar que hay datos (si creaste balances)

### Políticas RLS

- [ ] Ir a **Authentication** → **Policies**
- [ ] Buscar políticas de `balances_veritiv`
- [ ] Verificar que están habilitadas:
  - [ ] Permitir lectura pública
  - [ ] Permitir inserción autenticada
  - [ ] Permitir actualización autenticada
  - [ ] Permitir eliminación autenticada

## 🎨 Verificación Visual

### Diseño

- [ ] El menú "Balance" tiene el ícono correcto (⚖️)
- [ ] La tabla se ve correctamente formateada
- [ ] El modal se centra en la pantalla
- [ ] Los botones tienen los colores correctos
- [ ] Los íconos se muestran correctamente

### Responsive

- [ ] Abrir en móvil o reducir ventana
- [ ] Verificar que la tabla es scrolleable
- [ ] Verificar que el modal se adapta
- [ ] Verificar que los filtros se apilan verticalmente

## 📱 Pruebas en Diferentes Navegadores

- [ ] Chrome/Edge (recomendado)
- [ ] Firefox
- [ ] Safari (si tienes Mac)

## 🐛 Solución de Problemas

### Si no aparece el menú "Balance"

1. [ ] Verificar que `index.html` tiene la línea del menú
2. [ ] Hacer hard refresh (Ctrl+Shift+R)
3. [ ] Limpiar caché del navegador

### Si no carga la tabla

1. [ ] Verificar que ejecutaste el SQL en Supabase
2. [ ] Revisar consola del navegador (F12)
3. [ ] Verificar políticas RLS en Supabase

### Si no puede crear balances

1. [ ] Verificar que todos los campos están llenos
2. [ ] Revisar consola del navegador
3. [ ] Verificar políticas RLS de INSERT

### Si hay error de Foreign Key

1. [ ] Verificar que la tabla `productos_carton` existe
2. [ ] Verificar que el campo `id` es INTEGER
3. [ ] Intentar crear balance sin seleccionar producto

## 📚 Documentación Leída

- [ ] `README_BALANCE.md` - Guía rápida
- [ ] `INSTRUCCIONES_BALANCE.md` - Guía completa
- [ ] `RESUMEN_IMPLEMENTACION.md` - Detalles técnicos
- [ ] `GUIA_VISUAL_BALANCE.md` - Guía visual

## ✅ Confirmación Final

- [ ] El módulo Balance está funcionando correctamente
- [ ] Puedo crear balances
- [ ] Puedo editar balances
- [ ] Puedo eliminar balances
- [ ] Puedo filtrar balances
- [ ] No hay errores en consola
- [ ] El diseño se ve bien
- [ ] Funciona en móvil

## 📝 Notas Adicionales

Espacio para notas personales o problemas encontrados:

```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

## 🎉 ¡Implementación Completa!

Si marcaste todas las casillas, ¡felicidades! El módulo Balance Veritiv está completamente implementado y funcionando.

---

**Fecha de verificación**: _______________  
**Verificado por**: _______________  
**Estado**: [ ] Completo [ ] Pendiente [ ] Con problemas
