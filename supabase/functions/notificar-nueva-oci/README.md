# 📧 Edge Function: notificar-nueva-oci

Supabase Edge Function que envía notificaciones por correo electrónico usando **Resend API** cuando se crea una nueva orden de compra.

---

## 🚀 Despliegue Rápido

```bash
# 1. Instalar Supabase CLI (si no lo tienes)
brew install supabase/tap/supabase

# 2. Iniciar sesión
supabase login

# 3. Vincular proyecto
cd /ruta/a/Controldecarton
supabase link --project-ref bdrxcilsuxbkpmolfbgu

# 4. Configurar API Key de Resend
supabase secrets set RESEND_API_KEY=re_tu_api_key_aqui

# 5. Desplegar función
supabase functions deploy notificar-nueva-oci
```

---

## ⚙️ Configuración

### **Destinatarios:**
- jcanett@pxg.com
- smexia@pxg.com

### **Remitente:**
- controlcarton@pxg.com

### **Servicio de Correo:**
- **Resend API** (https://resend.com)
- 3,000 correos gratis al mes
- Sin tarjeta de crédito requerida

---

## 🔑 Obtener API Key de Resend

### **Paso 1: Crear Cuenta**

1. Ve a: **https://resend.com**
2. Regístrate con tu correo
3. Verifica tu email

### **Paso 2: Crear API Key**

1. En el dashboard, ve a: **Settings** → **API Keys**
2. Haz clic en **"Create API Key"**
3. Nombre: `OCI PXG Notifications`
4. Permiso: `Sending access`
5. Copia la API Key (empieza con `re_...`)

### **Paso 3: Configurar en Supabase**

```bash
supabase secrets set RESEND_API_KEY=re_tu_api_key_aqui
```

---

## 🔗 Configurar Webhook en Supabase

1. **Supabase Dashboard** → **Database** → **Webhooks**
2. **Create webhook:**
   - **Name:** `notificar_nueva_oci`
   - **Table:** `ordenes_compra`
   - **Events:** ✅ INSERT
   - **Method:** POST
   - **URL:** `https://bdrxcilsuxbkpmolfbgu.supabase.co/functions/v1/notificar-nueva-oci`
3. **Guardar**

---

## 🧪 Probar

```bash
# Ver logs en tiempo real
supabase functions logs notificar-nueva-oci --tail

# Crear una OCI de prueba en el sistema
# Revisa tu correo en jcanett@pxg.com y smexia@pxg.com
```

---

## 📊 Monitorear

### **Resend Dashboard:**
- Ve a: https://resend.com/emails
- Ver todos los correos enviados
- Estado: Delivered, Bounced, etc.

### **Supabase Logs:**
```bash
supabase functions logs notificar-nueva-oci
```

---

## 🔧 Actualizar

```bash
# Editar código
nano supabase/functions/notificar-nueva-oci/index.ts

# Desplegar cambios
supabase functions deploy notificar-nueva-oci

# Verificar
supabase functions logs notificar-nueva-oci --tail
```

---

## 📖 Documentación Completa

Ver: `/GUIA_RESEND_API.md`

---

## 📞 Soporte

**Sistema OCI PXG MÉXICO**  
**Creado por:** IT Tequila  
**Soporte:** jcanett@pxg.com

**Resend:**  
- Docs: https://resend.com/docs
- Dashboard: https://resend.com/emails
