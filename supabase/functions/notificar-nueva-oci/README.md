# 📧 Edge Function: notificar-nueva-oci

Supabase Edge Function que envía notificaciones por correo electrónico usando **Gmail SMTP** cuando se crea una nueva orden de compra.

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

# 4. Configurar credenciales de Gmail
supabase secrets set GMAIL_USER=controlcarton@gmail.com
supabase secrets set GMAIL_APP_PASSWORD=tu_contraseña_de_aplicacion

# 5. Desplegar función
supabase functions deploy notificar-nueva-oci
```

---

## ⚙️ Configuración

### **Destinatarios:**
- jcanett@pxg.com
- smexia@pxg.com

### **Remitente:**
- controlcarton@gmail.com

### **Servicio de Correo:**
- **Gmail SMTP** (smtp.gmail.com:587)
- Requiere contraseña de aplicación de Google
- 500 correos gratis al día

---

## 🔑 Obtener Contraseña de Aplicación de Gmail

### **Paso 1: Activar Verificación en 2 Pasos**

1. Ve a: **https://myaccount.google.com/security**
2. Busca: **Verificación en 2 pasos**
3. Haz clic en **"Empezar"** y sigue los pasos

### **Paso 2: Crear Contraseña de Aplicación**

1. Ve a: **https://myaccount.google.com/apppasswords**
2. Selecciona app: **"Correo"**
3. Selecciona dispositivo: **"Otro (nombre personalizado)"**
4. Escribe: **"OCI PXG Supabase"**
5. Haz clic en **"Generar"**
6. **⚠️ COPIA LA CONTRASEÑA** (16 caracteres, sin espacios)

**Ejemplo:** `abcdefghijklmnop`

### **Paso 3: Configurar en Supabase**

```bash
supabase secrets set GMAIL_APP_PASSWORD=abcdefghijklmnop
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

## 📊 Límites de Gmail

| Límite | Cantidad |
|--------|----------|
| **Correos por día** | 500 (cuenta gratuita) |
| **Destinatarios por correo** | 100 |
| **Tamaño máximo** | 25 MB |

**Para tu caso:** 2 destinatarios por OCI = **250 OCIs por día**

---

## 🛠️ Solución de Problemas

### **❌ Error: "GMAIL_APP_PASSWORD is not set"**

**Solución:**
```bash
supabase secrets set GMAIL_APP_PASSWORD=tu_contraseña
```

---

### **❌ Error 535: "Username and Password not accepted"**

**Causas:**
1. Contraseña incorrecta (verifica que sea sin espacios)
2. Verificación en 2 pasos no activada
3. Contraseña de aplicación no creada

**Solución:**
1. Ve a: https://myaccount.google.com/apppasswords
2. Crea nueva contraseña de aplicación
3. Configura: `supabase secrets set GMAIL_APP_PASSWORD=nueva_contraseña`

---

### **❌ No llegan los correos**

**Verificar:**
1. Logs: `supabase functions logs notificar-nueva-oci --tail`
2. Carpeta de SPAM en Gmail
3. Webhook activo en Supabase Dashboard
4. Correos destino correctos

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

Ver: `/GUIA_GMAIL_SMTP.md`

---

## 📞 Soporte

**Sistema OCI PXG MÉXICO**  
**Creado por:** IT Tequila  
**Soporte:** jcanett@pxg.com  

**Gmail:**  
- Ayuda: https://support.google.com/mail
- Contraseñas de aplicación: https://myaccount.google.com/apppasswords

**Supabase:**  
- Docs: https://supabase.com/docs
- Dashboard: https://supabase.com/dashboard
