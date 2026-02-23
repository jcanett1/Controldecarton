# 📧 Guía de Configuración: Notificaciones por Correo para Nuevas OCIs

**Sistema:** OCI PXG México  
**Autor:** IT Tequila  
**Fecha:** Febrero 2026  

---

## 🎯 Objetivo

Configurar notificaciones automáticas por correo electrónico que se envíen a **jcanett@pxg.com** y **smexia@pxg.com** cada vez que se cree una nueva orden de compra en el sistema.

---

## 📋 Información Incluida en el Correo

Cada correo de notificación incluirá:

- ✅ **Número de OCI** (ej: OCI-2026-02-001)
- ✅ **Material** (número de material de cartón)
- ✅ **Cantidad Total** (piezas)
- ✅ **Usuario Solicitante** (ID del usuario)
- ✅ **Fecha de Creación**
- ✅ **Estado** (PENDIENTE, RECIBIDA, etc.)

---

## 🚀 Servidor Webhook

### **URL del Servidor:**
```
https://5000-iqkh81zsju024zvbf96vq-f26ab34f.us2.manus.computer
```

### **Endpoint para Webhooks:**
```
https://5000-iqkh81zsju024zvbf96vq-f26ab34f.us2.manus.computer/webhook/nueva-oci
```

### **Endpoint de Health Check:**
```
https://5000-iqkh81zsju024zvbf96vq-f26ab34f.us2.manus.computer/health
```

---

## ⚙️ Paso 1: Configurar Correo SMTP

### **Opción A: Usar Gmail (Recomendado)**

1. **Ir a tu cuenta de Google:**
   - Visita: https://myaccount.google.com/

2. **Habilitar verificación en 2 pasos:**
   - Ve a "Seguridad"
   - Activa "Verificación en 2 pasos"

3. **Crear Contraseña de Aplicación:**
   - Ve a: https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Otro (nombre personalizado)"
   - Nombre: "OCI Webhook Server"
   - Haz clic en "Generar"
   - **GUARDA LA CONTRASEÑA** (16 caracteres, ej: `abcd efgh ijkl mnop`)

4. **Configurar Variables de Entorno:**

   Crea el archivo `.env` en `/home/ubuntu/Controldecarton/`:
   
   ```bash
   cd /home/ubuntu/Controldecarton
   nano .env
   ```
   
   Contenido del archivo `.env`:
   ```
   SMTP_USERNAME=tu_correo@gmail.com
   SMTP_PASSWORD=abcd efgh ijkl mnop
   PORT=5000
   ```
   
   **IMPORTANTE:** Reemplaza `tu_correo@gmail.com` y `abcd efgh ijkl mnop` con tus credenciales reales.

5. **Reiniciar el Servidor:**
   ```bash
   # Detener el servidor actual
   pkill -f webhook_server.py
   
   # Iniciar con nuevas credenciales
   cd /home/ubuntu/Controldecarton
   nohup python3 webhook_server.py > webhook_server.log 2>&1 &
   ```

---

## 🔗 Paso 2: Configurar Webhook en Supabase

### **2.1. Acceder a Supabase Dashboard**

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto: **bdrxcilsuxbkpmolfbgu**
3. En el menú lateral, haz clic en **"Database"**
4. Luego haz clic en **"Webhooks"** (o "Database Webhooks")

---

### **2.2. Crear Nuevo Webhook**

1. **Haz clic en "Create a new webhook"** (o "Enable Webhooks" si es la primera vez)

2. **Configuración del Webhook:**

   | Campo | Valor |
   |-------|-------|
   | **Name** | `notificar_nueva_oci` |
   | **Table** | `ordenes_compra` |
   | **Events** | ✅ **INSERT** (solo marcar INSERT) |
   | **Type** | `HTTP Request` |
   | **Method** | `POST` |
   | **URL** | `https://5000-iqkh81zsju024zvbf96vq-f26ab34f.us2.manus.computer/webhook/nueva-oci` |
   | **HTTP Headers** | (dejar vacío o agregar `Content-Type: application/json`) |

3. **Configuración Avanzada (opcional):**
   
   - **Timeout:** 5000ms (5 segundos)
   - **Retry:** 3 intentos
   - **Retry Interval:** 1000ms (1 segundo)

4. **Haz clic en "Create webhook"** o "Save"

---

### **2.3. Captura de Pantalla de Referencia**

La configuración debería verse así:

```
┌─────────────────────────────────────────────────────┐
│ Create Webhook                                      │
├─────────────────────────────────────────────────────┤
│ Name: notificar_nueva_oci                           │
│ Table: ordenes_compra                               │
│ Events: ☑ INSERT  ☐ UPDATE  ☐ DELETE               │
│ Type: HTTP Request                                  │
│ Method: POST                                        │
│ URL: https://5000-iqkh81zsju024zvbf96vq-f26ab34f... │
│                                                     │
│ [Cancel]  [Create webhook]                          │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Paso 3: Probar el Sistema

### **3.1. Verificar que el Servidor está Activo**

```bash
curl https://5000-iqkh81zsju024zvbf96vq-f26ab34f.us2.manus.computer/health
```

**Respuesta esperada:**
```json
{
  "service": "OCI Webhook Server",
  "status": "healthy",
  "timestamp": "2026-02-23T18:24:29.717706"
}
```

---

### **3.2. Crear una Orden de Compra de Prueba**

1. **Abre tu sistema OCI:** `index.html`
2. **Ve a "Crear OCI"**
3. **Llena el formulario:**
   - Material: Cualquier material
   - Cantidad: 100 piezas
4. **Haz clic en "Crear Orden"**

---

### **3.3. Verificar que el Correo fue Enviado**

1. **Revisa tu bandeja de entrada** en:
   - jcanett@pxg.com
   - smexia@pxg.com

2. **Busca un correo con asunto:**
   ```
   🔔 Nueva OCI Creada: OCI-2026-02-XXX
   ```

3. **Verifica que el correo incluya:**
   - ✅ Número de OCI
   - ✅ Material
   - ✅ Cantidad
   - ✅ Usuario
   - ✅ Fecha de creación
   - ✅ Estado

---

### **3.4. Revisar Logs del Servidor**

```bash
cd /home/ubuntu/Controldecarton
tail -f webhook_server.log
```

**Logs esperados:**
```
2026-02-23 18:24:17,234 - __main__ - INFO - 🚀 Iniciando servidor en puerto 5000...
2026-02-23 18:24:17,235 - __main__ - INFO - 📧 Correos destino: jcanett@pxg.com, smexia@pxg.com
2026-02-23 18:25:30,123 - __main__ - INFO - 📥 Webhook recibido: {...}
2026-02-23 18:25:30,456 - __main__ - INFO - Enviando correo para OCI OCI-2026-02-001...
2026-02-23 18:25:32,789 - __main__ - INFO - ✅ Correo enviado exitosamente para OCI OCI-2026-02-001
```

---

## 🔍 Solución de Problemas

### **Problema 1: No llega el correo**

#### **Causa Posible:** Credenciales SMTP incorrectas

**Solución:**
1. Verifica que el archivo `.env` existe y tiene las credenciales correctas
2. Asegúrate de usar una **Contraseña de Aplicación** de Google, no tu contraseña normal
3. Reinicia el servidor:
   ```bash
   pkill -f webhook_server.py
   cd /home/ubuntu/Controldecarton
   nohup python3 webhook_server.py > webhook_server.log 2>&1 &
   ```

---

### **Problema 2: Webhook no se dispara**

#### **Causa Posible:** Webhook mal configurado en Supabase

**Solución:**
1. Ve a Supabase Dashboard → Database → Webhooks
2. Verifica que el webhook esté **Enabled** (activo)
3. Verifica que la URL sea correcta:
   ```
   https://5000-iqkh81zsju024zvbf96vq-f26ab34f.us2.manus.computer/webhook/nueva-oci
   ```
4. Verifica que el evento **INSERT** esté marcado
5. Verifica que la tabla sea **ordenes_compra**

---

### **Problema 3: Error 500 en el webhook**

#### **Causa Posible:** Error en el servidor Flask

**Solución:**
1. Revisa los logs del servidor:
   ```bash
   tail -50 /home/ubuntu/Controldecarton/webhook_server.log
   ```
2. Busca mensajes de error en rojo
3. Si hay error de SMTP, verifica credenciales
4. Si hay error de JSON, verifica que Supabase esté enviando datos correctos

---

### **Problema 4: Servidor no responde**

#### **Causa Posible:** Servidor detenido

**Solución:**
1. Verifica si el servidor está corriendo:
   ```bash
   ps aux | grep webhook_server
   ```
2. Si no está corriendo, inícialo:
   ```bash
   cd /home/ubuntu/Controldecarton
   nohup python3 webhook_server.py > webhook_server.log 2>&1 &
   ```
3. Verifica que responda:
   ```bash
   curl https://5000-iqkh81zsju024zvbf96vq-f26ab34f.us2.manus.computer/health
   ```

---

## 📧 Formato del Correo

### **Asunto:**
```
🔔 Nueva OCI Creada: OCI-2026-02-001
```

### **Contenido (HTML):**

El correo incluye:
- **Header negro con gradiente** con logo y título del sistema
- **Alerta azul** indicando nueva orden
- **Caja de información** con todos los detalles de la OCI
- **Sección de próximos pasos**
- **Footer** con información de contacto

---

## 🔒 Seguridad

### **Recomendaciones:**

1. **Nunca compartas tu archivo `.env`**
   - Está en `.gitignore` para evitar subirlo a GitHub

2. **Usa Contraseñas de Aplicación**
   - No uses tu contraseña real de Gmail

3. **Revoca contraseñas si es necesario**
   - Ve a https://myaccount.google.com/apppasswords
   - Elimina contraseñas que ya no uses

4. **Monitorea los logs**
   - Revisa regularmente `webhook_server.log`
   - Busca intentos de acceso no autorizados

---

## 📊 Monitoreo

### **Verificar Estado del Servidor:**

```bash
# Health check
curl https://5000-iqkh81zsju024zvbf96vq-f26ab34f.us2.manus.computer/health

# Ver logs en tiempo real
tail -f /home/ubuntu/Controldecarton/webhook_server.log

# Ver últimas 50 líneas de logs
tail -50 /home/ubuntu/Controldecarton/webhook_server.log

# Buscar errores en logs
grep -i error /home/ubuntu/Controldecarton/webhook_server.log
```

---

## 🔄 Mantenimiento

### **Reiniciar el Servidor:**

```bash
# Detener
pkill -f webhook_server.py

# Iniciar
cd /home/ubuntu/Controldecarton
nohup python3 webhook_server.py > webhook_server.log 2>&1 &

# Verificar
curl https://5000-iqkh81zsju024zvbf96vq-f26ab34f.us2.manus.computer/health
```

### **Ver Proceso:**

```bash
ps aux | grep webhook_server
```

### **Limpiar Logs Antiguos:**

```bash
# Respaldar logs
cp webhook_server.log webhook_server_backup_$(date +%Y%m%d).log

# Limpiar logs actuales
> webhook_server.log
```

---

## 📞 Soporte

**Sistema OCI PXG MÉXICO**  
**Creado por:** IT Tequila  
**Soporte:** jcanett@pxg.com  

---

## ✅ Checklist de Configuración

- [ ] Crear Contraseña de Aplicación en Google
- [ ] Crear archivo `.env` con credenciales SMTP
- [ ] Iniciar servidor Flask
- [ ] Verificar que el servidor responde en `/health`
- [ ] Configurar webhook en Supabase Dashboard
- [ ] Verificar que webhook esté activo
- [ ] Crear orden de compra de prueba
- [ ] Verificar que llegue correo a jcanett@pxg.com
- [ ] Verificar que llegue correo a smexia@pxg.com
- [ ] Revisar logs del servidor
- [ ] Documentar configuración

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, el sistema enviará automáticamente correos de notificación cada vez que se cree una nueva orden de compra.

**¡Disfruta de tus notificaciones automáticas!** 📧✅🚀
