# 📧 Guía Completa: Notificaciones con Resend API

Sistema de notificaciones automáticas por correo electrónico para el Sistema OCI PXG México usando **Resend API** y **Supabase Edge Functions**.

---

## 🎯 ¿Qué es Resend?

**Resend** es un servicio moderno de envío de correos electrónicos diseñado específicamente para desarrolladores. Es perfecto para Supabase Edge Functions porque:

✅ **API simple y moderna**✅ **3,000 correos gratis al mes**✅ **Sin tarjeta de crédito requerida**✅ **Excelente para Deno/Edge Functions**✅ **Entrega rápida y confiable**✅ **Dashboard con métricas en tiempo real**

---

## 📋 Requisitos Previos

- ✅ Cuenta de Supabase (ya la tienes)

- ✅ Proyecto de Supabase configurado

- ✅ Supabase CLI instalado

- ✅ Cuenta de Resend (la crearemos ahora)

---

## 🚀 Paso 1: Crear Cuenta en Resend

### **1.1. Registrarse**

1. Ve a: [**https://resend.com**](https://resend.com)

1. Haz clic en **"Sign Up"** o **"Get Started"**

1. Regístrate con:
  - **Correo:** [jcanett@pxg.com](mailto:jcanett@pxg.com) (o el que prefieras )
  - **Contraseña:** (crea una segura)

1. Verifica tu correo electrónico

### **1.2. Completar Perfil**

1. Ingresa el nombre de tu empresa: **PXG México**

1. Selecciona el caso de uso: **Transactional Emails** (correos transaccionales)

---

## 🔑 Paso 2: Obtener API Key de Resend

### **2.1. Crear API Key**

1. Una vez dentro del dashboard de Resend

1. Ve a: **Settings** → **API Keys**

1. Haz clic en **"Create API Key"**

1. Configura:
  - **Name:** `OCI PXG Notifications`
  - **Permission:** `Sending access` (permiso de envío)

1. Haz clic en **"Create"**

1. **⚠️ IMPORTANTE:** Copia la API Key inmediatamente
  - Se verá así: `re_xxxxxxxxxxxxxxxxxxxxxxxxxx`
  - **Solo se muestra una vez**, guárdala en un lugar seguro

---

## 📧 Paso 3: Verificar Dominio (Opcional pero Recomendado)

Para enviar desde `controlcarton@pxg.com`, necesitas verificar el dominio `pxg.com`.

### **3.1. Agregar Dominio**

1. En Resend Dashboard, ve a: **Domains**

1. Haz clic en **"Add Domain"**

1. Ingresa: `pxg.com`

1. Haz clic en **"Add"**

### **3.2. Configurar DNS**

Resend te dará registros DNS que debes agregar en tu proveedor de DNS:

| Tipo | Nombre | Valor |
| --- | --- | --- |
| **TXT** | `_resend.pxg.com` | `resend-verification=xxx...` |
| **MX** | `pxg.com` | `feedback-smtp.resend.com` |
| **TXT** | `pxg.com` | `v=spf1 include:_spf.resend.com ~all` |
| **CNAME** | `resend._domainkey.pxg.com` | `resend._domainkey.resend.com` |

**Nota:** Si no puedes verificar el dominio ahora, puedes usar temporalmente:

- `controlcarton@resend.dev` (dominio de prueba de Resend)

---

## 🛠️ Paso 4: Instalar Supabase CLI

Si aún no lo tienes instalado:

### **En Mac/Linux:**

```shell
brew install supabase/tap/supabase
```

### **En Windows (con Scoop):**

```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### **Verificar instalación:**

```shell
supabase --version
```

---

## 🔐 Paso 5: Iniciar Sesión en Supabase CLI

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte.

---

## 🔗 Paso 6: Vincular tu Proyecto

```bash
cd /ruta/a/Controldecarton
supabase link --project-ref bdrxcilsuxbkpmolfbgu
```

**Salida esperada:**

```
Linked to project bdrxcilsuxbkpmolfbgu
```

---

## 🚀 Paso 7: Configurar API Key de Resend en Supabase

Necesitas agregar la API Key de Resend como un **secret** en Supabase:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Reemplaza** `re_xxxxxxxxxxxxxxxxxxxxxxxxxx` con tu API Key real de Resend.

**Salida esperada:**

```
✅ Secret RESEND_API_KEY set successfully
```

---

## 📤 Paso 8: Desplegar la Edge Function

```bash
supabase functions deploy notificar-nueva-oci
```

**Salida esperada:**

```
Deploying function notificar-nueva-oci...
Function URL: https://bdrxcilsuxbkpmolfbgu.supabase.co/functions/v1/notificar-nueva-oci
✅ Deployed successfully
```

**Copia la URL**, la necesitarás para el webhook.

---

## 🔗 Paso 9: Configurar Database Webhook en Supabase

### **9.1. Abrir Supabase Dashboard**

1. Ve a: [**https://supabase.com/dashboard**](https://supabase.com/dashboard)

1. Selecciona tu proyecto: **bdrxcilsuxbkpmolfbgu**

### **9.2. Crear Webhook**

1. En el menú lateral, ve a: **Database** → **Webhooks**

1. Haz clic en **"Create webhook"** o **"Enable webhooks"**

1. Configura:

| Campo | Valor |
| --- | --- |
| **Name** | `notificar_nueva_oci` |
| **Table** | `ordenes_compra` |
| **Events** | ✅ **INSERT** (solo marcar INSERT ) |
| **Type** | `HTTP Request` |
| **Method** | `POST` |
| **URL** | `https://bdrxcilsuxbkpmolfbgu.supabase.co/functions/v1/notificar-nueva-oci` |
| **HTTP Headers** | (dejar vacío ) |

1. Haz clic en **"Create webhook"** o **"Save"**

---

## 🧪 Paso 10: Probar el Sistema

### **10.1. Ver Logs en Tiempo Real**

En tu terminal:

```bash
supabase functions logs notificar-nueva-oci --tail
```

Esto mostrará los logs en tiempo real.

### **10.2. Crear una OCI de Prueba**

1. Ve a tu sistema OCI (index.html)

1. Crea una nueva orden de compra

1. Llena todos los campos

1. Haz clic en **"Crear OCI"**

### **10.3. Verificar**

**En la terminal:**

```
📦 Webhook recibido: {...}
📋 Nueva OCI: OCI-2026-02-001
📦 Material: 0632545
🔢 Cantidad: 5000
📤 Enviando correo via Resend...
✅ Correo enviado exitosamente: {id: "xxx"}
```

**En tu correo:**

- Revisa [**jcanett@pxg.com**](mailto:jcanett@pxg.com)

- Revisa [**smexia@pxg.com**](mailto:smexia@pxg.com)

- Si no está en la bandeja de entrada, revisa **SPAM**

**En Resend Dashboard:**

- Ve a: **Emails**

- Deberías ver el correo enviado con estado **Delivered**

---

## 📊 Paso 11: Monitorear Correos

### **En Resend Dashboard:**

1. Ve a: [**https://resend.com/emails**](https://resend.com/emails)

1. Verás todos los correos enviados con:
  - ✅ Estado (Delivered, Bounced, etc. )
  - 📅 Fecha y hora
  - 📧 Destinatarios
  - 📊 Métricas (abiertos, clics, etc.)

### **En Supabase:**

```bash
# Ver logs en tiempo real
supabase functions logs notificar-nueva-oci --tail

# Ver logs históricos
supabase functions logs notificar-nueva-oci
```

---

## 🔧 Actualizar la Edge Function

Si necesitas hacer cambios:

### **1. Editar el código:**

```bash
nano supabase/functions/notificar-nueva-oci/index.ts
```

### **2. Desplegar cambios:**

```bash
supabase functions deploy notificar-nueva-oci
```

### **3. Verificar:**

```bash
supabase functions logs notificar-nueva-oci --tail
```

---

## 🛠️ Solución de Problemas

### **❌ Error: "RESEND_API_KEY is not set"**

**Solución:**

```bash
supabase secrets set RESEND_API_KEY=tu_api_key_aqui
```

---

### **❌ Error: "Domain not verified"**

**Opciones:**

1. **Verificar dominio pxg.com** (recomendado)
  - Agregar registros DNS en tu proveedor
  - Esperar 24-48 horas para propagación

1. **Usar dominio de prueba temporalmente:**
  - Cambiar `FROM_EMAIL` a: `controlcarton@resend.dev`
  - Editar `index.ts` y redesplegar

---

### **❌ No llegan los correos**

**Verificar:**

1. **Logs de la Edge Function:**

   ```bash
   supabase functions logs notificar-nueva-oci --tail
   ```

1. **Dashboard de Resend:**
  - Ve a: [https://resend.com/emails](https://resend.com/emails)
  - Verifica el estado del correo

1. **Carpeta de SPAM:**
  - Revisa la carpeta de correo no deseado

1. **Webhook configurado:**
  - Supabase Dashboard → Database → Webhooks
  - Verifica que esté activo

---

### **❌ Error 401 Unauthorized**

**Causa:** API Key incorrecta

**Solución:**

```bash
# Verificar secret actual
supabase secrets list

# Actualizar con API Key correcta
supabase secrets set RESEND_API_KEY=re_nueva_api_key
```

---

## 📈 Límites de Resend (Plan Gratuito )

| Límite | Cantidad |
| --- | --- |
| **Correos por mes** | 3,000 |
| **Correos por día** | 100 |
| **Destinatarios por correo** | 50 |
| **Tamaño máximo** | 40 MB |
| **Dominios** | 1 |

**Nota:** Si necesitas más, puedes actualizar al plan Pro ($20/mes) con 50,000 correos.

---

## 🎉 ¡Listo!

Tu sistema de notificaciones está configurado y funcionando. Cada vez que se cree una nueva OCI, se enviará automáticamente un correo a:

- ✅ [jcanett@pxg.com](mailto:jcanett@pxg.com)

- ✅ [smexia@pxg.com](mailto:smexia@pxg.com)

Con toda la información de la orden.

---

## 📞 Soporte

**Sistema OCI PXG MÉXICO****Creado por:** IT Tequila**Soporte:** [jcanett@pxg.com](mailto:jcanett@pxg.com)

**Resend:**

- Documentación: [https://resend.com/docs](https://resend.com/docs)

- Soporte: [https://resend.com/support](https://resend.com/support)

**Supabase:**

- Documentación: [https://supabase.com/docs](https://supabase.com/docs)

- Soporte: [https://supabase.com/support](https://supabase.com/support)

---

## 🔗 Enlaces Útiles

- **Resend Dashboard:** [https://resend.com/emails](https://resend.com/emails)

- **Supabase Dashboard:** [https://supabase.com/dashboard](https://supabase.com/dashboard)

- **Resend API Docs:** [https://resend.com/docs/api-reference/emails/send-email](https://resend.com/docs/api-reference/emails/send-email)

- **Supabase Edge Functions:** [https://supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)

---

**¡Disfruta de tus notificaciones automáticas!** 🚀📧✨

