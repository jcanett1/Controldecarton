# 📧 Guía: Notificaciones por Correo con Supabase Edge Functions

**Sistema:** OCI PXG México  
**Autor:** IT Tequila  
**Fecha:** Febrero 2026  

---

## 🎯 Objetivo

Configurar notificaciones automáticas por correo electrónico usando **Supabase Edge Functions** que se envíen a **jcanett@pxg.com** y **smexia@pxg.com** cada vez que se cree una nueva orden de compra.

---

## ✨ Ventajas de Edge Functions vs Servidor Flask

| Característica | Edge Functions ✅ | Servidor Flask ❌ |
|----------------|-------------------|-------------------|
| **Infraestructura** | Gestionada por Supabase | Requiere servidor propio |
| **Escalabilidad** | Automática | Manual |
| **Costo** | Incluido en plan Supabase | Servidor + mantenimiento |
| **Seguridad** | Red interna Supabase | Expuesto públicamente |
| **Mantenimiento** | Mínimo | Alto |
| **Acceso a DB** | Directo | Requiere API |

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

## 🚀 Paso 1: Desplegar la Edge Function

### **1.1. Instalar Supabase CLI**

Si aún no tienes Supabase CLI instalado:

```bash
# En macOS/Linux
brew install supabase/tap/supabase

# En Windows (con Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Verifica la instalación:
```bash
supabase --version
```

---

### **1.2. Iniciar Sesión en Supabase**

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte.

---

### **1.3. Vincular tu Proyecto**

```bash
cd /ruta/a/Controldecarton
supabase link --project-ref bdrxcilsuxbkpmolfbgu
```

**Nota:** Reemplaza `bdrxcilsuxbkpmolfbgu` con tu Project ID real si es diferente.

---

### **1.4. Desplegar la Edge Function**

```bash
cd /ruta/a/Controldecarton
supabase functions deploy notificar-nueva-oci
```

**Salida esperada:**
```
Deploying function notificar-nueva-oci...
Function URL: https://bdrxcilsuxbkpmolfbgu.supabase.co/functions/v1/notificar-nueva-oci
✅ Deployed successfully
```

**Guarda la URL** de la función, la necesitarás para el webhook.

---

## 🔗 Paso 2: Configurar Database Webhook en Supabase

### **2.1. Acceder a Supabase Dashboard**

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto: **bdrxcilsuxbkpmolfbgu**
3. En el menú lateral, haz clic en **"Database"**
4. Luego haz clic en **"Webhooks"**

---

### **2.2. Crear Nuevo Webhook**

1. **Haz clic en "Create a new webhook"** o **"Enable Webhooks"**

2. **Configuración del Webhook:**

   | Campo | Valor |
   |-------|-------|
   | **Name** | `notificar_nueva_oci` |
   | **Table** | `ordenes_compra` |
   | **Events** | ✅ **INSERT** (solo marcar INSERT) |
   | **Type** | `HTTP Request` |
   | **Method** | `POST` |
   | **URL** | `https://bdrxcilsuxbkpmolfbgu.supabase.co/functions/v1/notificar-nueva-oci` |
   | **HTTP Headers** | (opcional) `Content-Type: application/json` |

3. **Configuración Avanzada (opcional):**
   
   - **Timeout:** 5000ms (5 segundos)
   - **Retry:** 3 intentos
   - **Retry Interval:** 1000ms (1 segundo)

4. **Haz clic en "Create webhook"** o **"Save"**

---

### **2.3. Captura de Pantalla de Referencia**

La configuración debería verse así:

```
┌─────────────────────────────────────────────────────────────┐
│ Create Webhook                                              │
├─────────────────────────────────────────────────────────────┤
│ Name: notificar_nueva_oci                                   │
│ Table: ordenes_compra                                       │
│ Events: ☑ INSERT  ☐ UPDATE  ☐ DELETE                       │
│ Type: HTTP Request                                          │
│ Method: POST                                                │
│ URL: https://bdrxcilsuxbkpmolfbgu.supabase.co/functions... │
│                                                             │
│ [Cancel]  [Create webhook]                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Paso 3: Probar el Sistema

### **3.1. Verificar que la Edge Function está Desplegada**

```bash
curl https://bdrxcilsuxbkpmolfbgu.supabase.co/functions/v1/notificar-nueva-oci
```

**Respuesta esperada:**
```json
{
  "error": "Método no permitido. Use POST."
}
```

Esto confirma que la función está activa (rechaza GET, solo acepta POST).

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

### **3.4. Revisar Logs de la Edge Function**

```bash
supabase functions logs notificar-nueva-oci
```

**Logs esperados:**
```
2026-02-24 10:00:00 - 📥 Webhook recibido: {...}
2026-02-24 10:00:01 - 📧 Conectando a SMTP 10.232.237.25:25...
2026-02-24 10:00:02 - ✅ Conexión SMTP establecida
2026-02-24 10:00:03 - ✅ Correo enviado exitosamente para OCI OCI-2026-02-001
```

---

## 🔍 Solución de Problemas

### **Problema 1: No llega el correo**

#### **Causa Posible:** Servidor SMTP no accesible desde Supabase Edge Functions

**Solución:**

Las Edge Functions de Supabase se ejecutan en la infraestructura de Supabase (AWS), que puede no tener acceso a tu red interna `10.232.237.25`.

**Opciones:**

1. **Usar un servicio SMTP externo:**
   - Gmail (smtp.gmail.com:587)
   - SendGrid (smtp.sendgrid.net:587)
   - Mailgun (smtp.mailgun.org:587)
   - Outlook (smtp.office365.com:587)

2. **Exponer tu servidor SMTP interno:**
   - Configurar firewall para permitir acceso desde IPs de Supabase
   - Usar VPN o túnel seguro

3. **Usar Supabase Email Service (si está disponible):**
   - Revisar si Supabase ofrece servicio de email integrado

---

### **Problema 2: Webhook no se dispara**

#### **Causa Posible:** Webhook mal configurado

**Solución:**

1. Ve a Supabase Dashboard → Database → Webhooks
2. Verifica que el webhook esté **Enabled** (activo)
3. Verifica que la URL sea correcta:
   ```
   https://bdrxcilsuxbkpmolfbgu.supabase.co/functions/v1/notificar-nueva-oci
   ```
4. Verifica que el evento **INSERT** esté marcado
5. Verifica que la tabla sea **ordenes_compra**

---

### **Problema 3: Error 500 en la Edge Function**

#### **Causa Posible:** Error en el código o conexión SMTP

**Solución:**

1. Revisa los logs de la Edge Function:
   ```bash
   supabase functions logs notificar-nueva-oci --tail
   ```

2. Busca mensajes de error en rojo

3. Si hay error de conexión SMTP, verifica:
   - Que el servidor 10.232.237.25 sea accesible
   - Que el puerto 25 esté abierto
   - Que no haya firewall bloqueando

---

### **Problema 4: Edge Function no desplegada**

#### **Causa Posible:** Error en el despliegue

**Solución:**

1. Verifica que estés autenticado:
   ```bash
   supabase login
   ```

2. Verifica que el proyecto esté vinculado:
   ```bash
   supabase projects list
   ```

3. Intenta desplegar de nuevo:
   ```bash
   supabase functions deploy notificar-nueva-oci --no-verify-jwt
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

1. **Usar HTTPS siempre**
   - La URL de la Edge Function ya usa HTTPS

2. **Validar origen del webhook**
   - Supabase firma los webhooks con un secreto
   - Puedes validar la firma para mayor seguridad

3. **Limitar acceso a la Edge Function**
   - Solo permitir llamadas desde Supabase
   - Usar API Keys si es necesario

4. **Monitorear logs**
   - Revisa regularmente los logs de la Edge Function
   - Busca intentos de acceso no autorizados

---

## 📊 Monitoreo

### **Ver Logs en Tiempo Real:**

```bash
supabase functions logs notificar-nueva-oci --tail
```

### **Ver Logs Históricos:**

```bash
supabase functions logs notificar-nueva-oci --limit 100
```

### **Verificar Estado:**

```bash
curl https://bdrxcilsuxbkpmolfbgu.supabase.co/functions/v1/notificar-nueva-oci
```

---

## 🔄 Actualizar la Edge Function

Si necesitas hacer cambios en el código:

1. **Edita el archivo:**
   ```bash
   nano supabase/functions/notificar-nueva-oci/index.ts
   ```

2. **Despliega de nuevo:**
   ```bash
   supabase functions deploy notificar-nueva-oci
   ```

3. **Verifica que funcione:**
   ```bash
   supabase functions logs notificar-nueva-oci --tail
   ```

---

## 📞 Soporte

**Sistema OCI PXG MÉXICO**  
**Creado por:** IT Tequila  
**Soporte:** jcanett@pxg.com  

---

## ✅ Checklist de Configuración

- [ ] Instalar Supabase CLI
- [ ] Iniciar sesión en Supabase
- [ ] Vincular proyecto
- [ ] Desplegar Edge Function
- [ ] Verificar que la función esté activa
- [ ] Configurar Database Webhook en Supabase
- [ ] Verificar que webhook esté activo
- [ ] Crear orden de compra de prueba
- [ ] Verificar que llegue correo a jcanett@pxg.com
- [ ] Verificar que llegue correo a smexia@pxg.com
- [ ] Revisar logs de la Edge Function
- [ ] Documentar configuración

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, el sistema enviará automáticamente correos de notificación cada vez que se cree una nueva orden de compra.

**¡Disfruta de tus notificaciones automáticas con Supabase Edge Functions!** 📧✅🚀

---

## 📝 Notas Adicionales

### **Limitaciones de Supabase Edge Functions:**

- **Timeout:** 10 segundos por defecto
- **Memoria:** 512 MB
- **Ejecuciones:** Según plan de Supabase

### **Alternativas si el servidor SMTP interno no es accesible:**

1. **Usar Gmail SMTP:**
   ```typescript
   const SMTP_CONFIG = {
     hostname: 'smtp.gmail.com',
     port: 587,
     username: 'controlcarton@pxg.com',
     password: 'tu_password_de_aplicacion',
     tls: true
   };
   ```

2. **Usar SendGrid:**
   ```typescript
   // Usar API de SendGrid en vez de SMTP directo
   const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${SENDGRID_API_KEY}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       personalizations: [{
         to: TO_EMAILS.map(email => ({ email }))
       }],
       from: { email: FROM_EMAIL },
       subject: subject,
       content: [{ type: 'text/html', value: htmlContent }]
     })
   });
   ```

3. **Usar Resend (recomendado para Deno):**
   ```typescript
   import { Resend } from 'https://esm.sh/resend@1.0.0';
   
   const resend = new Resend(RESEND_API_KEY);
   
   await resend.emails.send({
     from: FROM_EMAIL,
     to: TO_EMAILS,
     subject: subject,
     html: htmlContent
   });
   ```
