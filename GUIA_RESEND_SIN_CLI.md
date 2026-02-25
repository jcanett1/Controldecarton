# 📧 Guía Completa: Configurar Notificaciones con Resend (SIN CLI)

## 🎯 Objetivo

Configurar el sistema de notificaciones por email usando **Resend API** para que se envíen correos automáticos cuando se crea una nueva OCI, **sin necesidad de instalar Supabase CLI local**.

---

## ✅ Ventajas de Resend

| Característica | Beneficio |
|----------------|-----------|
| **Gratis** | 100 correos/día gratis, 3,000/mes |
| **Sin tarjeta** | No requiere información de pago en plan gratuito |
| **Fácil configuración** | Solo necesitas una API key |
| **Dashboard web** | Monitoreo de correos en tiempo real |
| **Alta entrega** | Infraestructura profesional |
| **Sin CLI** | Todo se configura desde navegadores web |

---

## 📋 Pasos Completos

### **Paso 1: Crear Cuenta en Resend** 🌐

1. Ve a: **https://resend.com**
2. Haz clic en **"Sign Up"** (Registrarse)
3. Puedes registrarte con:
   - **GitHub** (recomendado, más rápido)
   - **Google**
   - **Email**
4. Completa el registro
5. Verifica tu correo electrónico si es necesario

**✅ Cuenta de Resend creada**

---

### **Paso 2: Obtener API Key de Resend** 🔑

1. Una vez dentro del dashboard de Resend
2. Ve a: **"API Keys"** en el menú lateral
3. Haz clic en **"Create API Key"**
4. Configura:
   - **Name:** `OCI PXG Supabase`
   - **Permission:** `Sending access` (Full access)
5. Haz clic en **"Add"**

**⚠️ IMPORTANTE:** Resend te mostrará la API key:

```
re_123abc456def789ghi012jkl345mno678
```

**✅ COPIA ESTA API KEY INMEDIATAMENTE**

- Solo se muestra una vez
- Guárdala en un lugar seguro
- La necesitarás en el siguiente paso

---

### **Paso 3: Configurar el Código de la Edge Function** 💻

#### **3.1. Copiar el Código**

El código de la Edge Function ya está listo en:

```
/home/ubuntu/Controldecarton/supabase/functions/notificar-nueva-oci/index.ts
```

**Contenido:**
```typescript
// Edge Function: notificar-nueva-oci
// Envía notificaciones por email cuando se crea una nueva OCI
// Usa Resend API para envío de correos

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// ... resto del código ...
```

#### **3.2. Subir a GitHub**

El código ya está en tu repositorio:
- **Repositorio:** https://github.com/jcanett1/Controldecarton
- **Branch:** contro-de-carton-1.2
- **Ruta:** `supabase/functions/notificar-nueva-oci/index.ts`

---

### **Paso 4: Desplegar Edge Function en Supabase Dashboard** 🚀

Como **NO tienes CLI local**, vamos a desplegar la Edge Function **directamente desde el Dashboard de Supabase**.

#### **4.1. Ir al Dashboard de Supabase**

1. Ve a: **https://supabase.com/dashboard**
2. Inicia sesión
3. Selecciona tu proyecto: **bdrxcilsuxbkpmolfbgu**

#### **4.2. Crear Edge Function**

1. En el menú lateral, ve a: **"Edge Functions"**
2. Haz clic en **"Create a new function"**
3. Configura:
   - **Function name:** `notificar-nueva-oci`
   - **Template:** Selecciona `Blank function` o `Custom`

#### **4.3. Copiar el Código**

1. Abre el archivo desde tu repositorio de GitHub:
   ```
   https://github.com/jcanett1/Controldecarton/blob/contro-de-carton-1.2/supabase/functions/notificar-nueva-oci/index.ts
   ```

2. Copia **TODO** el contenido del archivo

3. En el Dashboard de Supabase:
   - Pega el código en el editor
   - Haz clic en **"Deploy"** o **"Save"**

**✅ Edge Function desplegada**

#### **4.4. Obtener la URL de la Edge Function**

Después de desplegar, Supabase te mostrará la URL:

```
https://bdrxcilsuxbkpmolfbgu.supabase.co/functions/v1/notificar-nueva-oci
```

**✅ Copia esta URL** (la necesitarás para el webhook)

---

### **Paso 5: Configurar API Key en Supabase Secrets** ⚙️

#### **5.1. Ir a Edge Functions Settings**

1. En el Dashboard de Supabase
2. Ve a: **"Edge Functions"**
3. Haz clic en tu función: **`notificar-nueva-oci`**
4. Ve a la pestaña: **"Settings"** o **"Secrets"**

#### **5.2. Agregar Secret**

1. Busca la sección: **"Function Secrets"** o **"Environment Variables"**
2. Haz clic en **"Add new secret"**
3. Configura:
   - **Name:** `RESEND_API_KEY`
   - **Value:** `re_123abc456def789ghi012jkl345mno678` (tu API key de Resend)
4. Haz clic en **"Save"** o **"Add"**

**✅ API Key configurada**

#### **5.3. Reiniciar la Edge Function**

Después de agregar el secret:
1. Ve a la pestaña **"Code"** o **"Deploy"**
2. Haz clic en **"Redeploy"** o **"Restart"**

Esto asegura que la función use el nuevo secret.

---

### **Paso 6: Configurar Database Webhook** 🔗

#### **6.1. Ir a Database Webhooks**

1. En el Dashboard de Supabase
2. Ve a: **"Database"** → **"Webhooks"**
3. Haz clic en **"Create a new hook"** o **"Enable webhooks"**

#### **6.2. Configurar el Webhook**

| Campo | Valor |
|-------|-------|
| **Name** | `notificar_nueva_oci` |
| **Table** | `ordenes_compra` |
| **Events** | ✅ **INSERT** (solo INSERT, desmarca UPDATE y DELETE) |
| **Type** | `HTTP Request` |
| **Method** | `POST` |
| **URL** | `https://bdrxcilsuxbkpmolfbgu.supabase.co/functions/v1/notificar-nueva-oci` |
| **HTTP Headers** | Dejar vacío o agregar `Content-Type: application/json` |

#### **6.3. Guardar Webhook**

1. Haz clic en **"Create webhook"** o **"Save"**
2. Verifica que aparezca en la lista de webhooks
3. Verifica que esté **"Enabled"** (activo)

**✅ Webhook configurado**

---

### **Paso 7: Probar el Sistema** 🧪

#### **7.1. Ver Logs en Tiempo Real**

1. En el Dashboard de Supabase
2. Ve a: **"Edge Functions"** → **`notificar-nueva-oci`**
3. Ve a la pestaña: **"Logs"** o **"Invocations"**
4. Deja esta pestaña abierta para ver los logs en tiempo real

#### **7.2. Crear OCI de Prueba**

1. Ve a tu sistema: **login_completo.html**
2. Inicia sesión
3. Ve a **"Crear OCI"**
4. Llena todos los campos:
   - Material
   - Cantidad
   - Fecha de entrega
   - etc.
5. Haz clic en **"Crear OCI"**

#### **7.3. Verificar Logs**

En la pestaña de Logs de Supabase deberías ver:

```
📦 Webhook recibido
📋 Payload: { ... }
📋 Nueva OCI: OCI-2026-02-001
📤 Enviando correo via Resend API...
✅ Correo enviado exitosamente: { id: "abc123...", ... }
```

**✅ Si ves esto, ¡funciona!**

#### **7.4. Verificar Correos**

1. Revisa la bandeja de entrada de:
   - **jcanett@pxg.com**
   - **smexia@pxg.com**

2. Deberías recibir un correo con:
   - **Asunto:** `🔔 Nueva OCI Creada: OCI-2026-02-001`
   - **Contenido:** Tabla con todos los datos de la OCI
   - **Diseño:** Profesional con colores corporativos

**✅ Si llegan los correos, ¡todo está funcionando!**

---

### **Paso 8: Verificar en Dashboard de Resend** 📊

1. Ve a: **https://resend.com/emails**
2. Inicia sesión en tu cuenta de Resend
3. Deberías ver los correos enviados en la lista
4. Puedes hacer clic en cada correo para ver:
   - Estado de entrega
   - Destinatarios
   - Contenido HTML
   - Logs de envío

**✅ Monitoreo en tiempo real**

---

## 🛠️ Solución de Problemas

### **❌ Error: "RESEND_API_KEY is not set"**

**Causa:** El secret no está configurado en Supabase.

**Solución:**
1. Ve a: **Edge Functions** → **`notificar-nueva-oci`** → **Settings/Secrets**
2. Verifica que exista: `RESEND_API_KEY`
3. Si no existe, agrégalo con tu API key de Resend
4. Redeploy la función

---

### **❌ Error 401: "Unauthorized"**

**Causa:** API key incorrecta o inválida.

**Solución:**
1. Ve a Resend Dashboard: **https://resend.com/api-keys**
2. Verifica que la API key sea correcta
3. Si es necesario, crea una nueva API key
4. Actualiza el secret en Supabase
5. Redeploy la función

---

### **❌ No se envían correos**

**Verificar:**

1. **Webhook activo:**
   - Dashboard → Database → Webhooks
   - Verifica que `notificar_nueva_oci` esté **Enabled**

2. **Logs de Edge Function:**
   - Dashboard → Edge Functions → `notificar-nueva-oci` → Logs
   - Busca errores

3. **Logs de Resend:**
   - https://resend.com/emails
   - Verifica si los correos fueron enviados

4. **Carpeta de SPAM:**
   - Revisa la carpeta de spam en Gmail

5. **Correos destino correctos:**
   - Verifica que los correos en el código sean correctos:
     ```typescript
     to: ["jcanett@pxg.com", "smexia@pxg.com"],
     ```

---

### **❌ Error: "Failed to send email"**

**Causa:** Problema con Resend API.

**Solución:**
1. Verifica los logs en Resend Dashboard
2. Verifica que no hayas excedido el límite (100 correos/día)
3. Verifica que tu cuenta de Resend esté activa
4. Verifica que la API key tenga permisos de envío

---

## 📊 Límites de Resend

| Plan | Límite Diario | Límite Mensual | Costo |
|------|---------------|----------------|-------|
| **Free** | 100 correos | 3,000 correos | $0 |
| **Pro** | Ilimitado | 50,000 correos | $20/mes |

**Para tu caso:**
- 2 destinatarios por OCI
- **Puedes enviar hasta 50 OCIs por día** (plan gratuito)
- Si necesitas más, puedes actualizar a Pro

---

## 📧 Información del Correo

### **Destinatarios:**
- jcanett@pxg.com
- smexia@pxg.com

### **Remitente:**
- Control de Cartón <onboarding@resend.dev>

**⚠️ NOTA:** El remitente `onboarding@resend.dev` es el dominio de prueba de Resend. Para usar un dominio personalizado (como `@pxg.com`), necesitas:
1. Verificar tu dominio en Resend
2. Configurar registros DNS (SPF, DKIM)
3. Actualizar el código con tu dominio

---

## 🎨 Personalizar el Correo

### **Cambiar Remitente**

En el código (`index.ts`), línea ~160:

```typescript
from: "Control de Cartón <onboarding@resend.dev>",
```

**Cambiar a:**
```typescript
from: "Control de Cartón <noreply@tudominio.com>",
```

### **Cambiar Destinatarios**

En el código (`index.ts`), línea ~161:

```typescript
to: ["jcanett@pxg.com", "smexia@pxg.com"],
```

**Agregar más:**
```typescript
to: ["jcanett@pxg.com", "smexia@pxg.com", "otro@pxg.com"],
```

### **Cambiar Asunto**

En el código (`index.ts`), línea ~162:

```typescript
subject: `🔔 Nueva OCI Creada: ${oci.numero_oci}`,
```

### **Cambiar Diseño HTML**

El HTML del correo está en la variable `emailHTML` (líneas ~50-150).

Puedes modificar:
- Colores
- Textos
- Estructura
- Logos (agregar imágenes)

---

## 📁 Estructura de Archivos

```
Controldecarton/
├── supabase/
│   └── functions/
│       └── notificar-nueva-oci/
│           ├── index.ts          ← Código de la Edge Function
│           └── README.md         ← Instrucciones rápidas
├── GUIA_RESEND_SIN_CLI.md       ← Esta guía (SIN CLI)
├── GUIA_RESEND_API.md           ← Guía anterior (CON CLI)
├── GUIA_GMAIL_SMTP.md           ← Guía de Gmail (descartada)
└── login_completo.html          ← Login del sistema
```

---

## 🔄 Flujo Completo

```
1. Usuario crea OCI en el sistema
   ↓
2. Se inserta registro en tabla ordenes_compra
   ↓
3. Database Webhook detecta INSERT
   ↓
4. Webhook llama a Edge Function
   ↓
5. Edge Function recibe datos de la OCI
   ↓
6. Edge Function llama a Resend API
   ↓
7. Resend envía correos a destinatarios
   ↓
8. jcanett@pxg.com y smexia@pxg.com reciben correo
```

---

## ✅ Checklist de Configuración

- [ ] Cuenta de Resend creada
- [ ] API Key de Resend obtenida
- [ ] Edge Function creada en Supabase Dashboard
- [ ] Código copiado y desplegado
- [ ] Secret `RESEND_API_KEY` configurado en Supabase
- [ ] Edge Function redeployada
- [ ] Database Webhook configurado
- [ ] Webhook apuntando a la URL correcta
- [ ] Webhook con evento INSERT activado
- [ ] Prueba realizada (OCI creada)
- [ ] Logs verificados (sin errores)
- [ ] Correos recibidos en destinatarios
- [ ] Dashboard de Resend verificado

---

## 🎉 Resumen

✅ **Sin CLI local** - Todo desde navegadores web  
✅ **Resend API** - 100 correos gratis al día  
✅ **Dashboard de Supabase** - Despliegue visual  
✅ **Database Webhook** - Automático en INSERT  
✅ **Correos profesionales** - HTML con diseño corporativo  
✅ **Monitoreo en tiempo real** - Logs en Supabase y Resend  
✅ **Fácil de configurar** - Solo copiar y pegar  
✅ **Sin tarjeta de crédito** - Plan gratuito suficiente  

---

## 📞 Soporte

**Sistema OCI PXG MÉXICO**  
**Creado por:** IT Tequila  
**Soporte:** jcanett@pxg.com  

**Resend:**  
- Dashboard: https://resend.com
- Documentación: https://resend.com/docs
- Soporte: https://resend.com/support

**Supabase:**  
- Dashboard: https://supabase.com/dashboard
- Documentación: https://supabase.com/docs
- Edge Functions: https://supabase.com/docs/guides/functions

---

**¡El sistema está listo! Solo necesitas seguir los pasos y configurar desde los dashboards web!** 📧✅🚀
