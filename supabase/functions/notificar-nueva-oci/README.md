# Edge Function: notificar-nueva-oci

## 📧 Descripción

Edge Function que envía notificaciones por email cuando se crea una nueva Orden de Compra Interna (OCI) en el sistema.

**Tecnología:** Resend API  
**Destinatarios:** jcanett@pxg.com, smexia@pxg.com  
**Trigger:** Database Webhook en INSERT de tabla `ordenes_compra`

---

## 🚀 Despliegue (SIN CLI)

### **1. Crear Cuenta en Resend**

1. Ve a: https://resend.com
2. Regístrate con GitHub, Google o Email
3. Verifica tu cuenta

### **2. Obtener API Key**

1. Dashboard de Resend → **API Keys**
2. **Create API Key**
3. Name: `OCI PXG Supabase`
4. Permission: `Sending access`
5. **Copiar la API key** (solo se muestra una vez)

### **3. Desplegar Edge Function**

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. **Edge Functions** → **Create a new function**
4. Name: `notificar-nueva-oci`
5. Copia el código de `index.ts` en el editor
6. **Deploy**

### **4. Configurar Secret**

1. **Edge Functions** → `notificar-nueva-oci` → **Settings**
2. **Function Secrets** → **Add new secret**
3. Name: `RESEND_API_KEY`
4. Value: `tu_api_key_de_resend`
5. **Save**
6. **Redeploy** la función

### **5. Configurar Webhook**

1. **Database** → **Webhooks** → **Create a new hook**
2. Configuración:

| Campo | Valor |
|-------|-------|
| Name | `notificar_nueva_oci` |
| Table | `ordenes_compra` |
| Events | ✅ INSERT |
| Method | POST |
| URL | `https://bdrxcilsuxbkpmolfbgu.supabase.co/functions/v1/notificar-nueva-oci` |

3. **Create webhook**

---

## 🧪 Probar

### **Ver Logs**

1. Dashboard → **Edge Functions** → `notificar-nueva-oci` → **Logs**
2. Crear una OCI en el sistema
3. Verificar logs en tiempo real

### **Logs Esperados**

```
📦 Webhook recibido
📋 Payload: { ... }
📋 Nueva OCI: OCI-2026-02-001
📤 Enviando correo via Resend API...
✅ Correo enviado exitosamente: { id: "abc123..." }
```

### **Verificar Correos**

- Revisar bandeja de entrada de jcanett@pxg.com y smexia@pxg.com
- Revisar Dashboard de Resend: https://resend.com/emails

---

## 📊 Límites de Resend

| Plan | Correos/Día | Correos/Mes | Costo |
|------|-------------|-------------|-------|
| Free | 100 | 3,000 | $0 |
| Pro | Ilimitado | 50,000 | $20/mes |

---

## 🛠️ Solución de Problemas

### **Error: "RESEND_API_KEY is not set"**

**Solución:**
1. Verifica que el secret esté configurado en Supabase
2. Redeploy la función después de agregar el secret

### **Error 401: "Unauthorized"**

**Solución:**
1. Verifica que la API key sea correcta
2. Crea una nueva API key en Resend si es necesario
3. Actualiza el secret en Supabase

### **No llegan correos**

**Verificar:**
1. Logs de Edge Function (errores)
2. Dashboard de Resend (estado de envío)
3. Carpeta de SPAM
4. Webhook activo en Supabase
5. Límite de correos no excedido

---

## 📁 Archivos

- `index.ts` - Código de la Edge Function
- `README.md` - Este archivo
- `/GUIA_RESEND_SIN_CLI.md` - Guía completa paso a paso

---

## 📧 Configuración de Correo

**Remitente:**
```typescript
from: "Control de Cartón <onboarding@resend.dev>"
```

**Destinatarios:**
```typescript
to: ["jcanett@pxg.com", "smexia@pxg.com"]
```

**Asunto:**
```typescript
subject: `🔔 Nueva OCI Creada: ${oci.numero_oci}`
```

---

## 🔗 Enlaces Útiles

- **Resend Dashboard:** https://resend.com
- **Resend Docs:** https://resend.com/docs
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions

---

**Sistema OCI PXG MÉXICO**  
**Creado por:** IT Tequila  
**Soporte:** jcanett@pxg.com
