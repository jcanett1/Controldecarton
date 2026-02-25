# 📧 Guía: Configurar Gmail SMTP para Notificaciones OCI

Esta guía te muestra cómo configurar Gmail para enviar notificaciones automáticas cuando se crea una nueva orden de compra.

---

## 📋 Requisitos

- ✅ Cuenta de Gmail (controlcarton@gmail.com)
- ✅ Verificación en 2 pasos activada
- ✅ Contraseña de aplicación de Google
- ✅ Supabase CLI instalado

---

## 🔐 Paso 1: Crear Cuenta de Gmail

### **1.1 Crear la cuenta**

1. Ve a: **https://accounts.google.com/signup**
2. Llena el formulario:
   - **Nombre:** Control de Cartón
   - **Correo:** controlcarton@gmail.com
   - **Contraseña:** (elige una segura)
3. Verifica tu número de teléfono
4. Completa la configuración

---

## 🔒 Paso 2: Activar Verificación en 2 Pasos

**⚠️ IMPORTANTE:** Gmail requiere verificación en 2 pasos para crear contraseñas de aplicación.

### **2.1 Activar 2FA**

1. Inicia sesión en: **https://myaccount.google.com**
2. Ve a: **Seguridad** (en el menú lateral)
3. Busca: **Verificación en 2 pasos**
4. Haz clic en **"Empezar"**
5. Sigue los pasos:
   - Confirma tu contraseña
   - Agrega tu número de teléfono
   - Elige método: **SMS** o **Llamada**
   - Ingresa el código que recibiste
   - Haz clic en **"Activar"**

**✅ Verificación en 2 pasos activada**

---

## 🔑 Paso 3: Crear Contraseña de Aplicación

### **3.1 Generar contraseña**

1. Ve a: **https://myaccount.google.com/apppasswords**
   - O busca "Contraseñas de aplicaciones" en la configuración de seguridad
2. Es posible que te pida confirmar tu contraseña
3. En "Seleccionar app", elige: **"Correo"**
4. En "Seleccionar dispositivo", elige: **"Otro (nombre personalizado)"**
5. Escribe: **"OCI PXG Supabase"**
6. Haz clic en **"Generar"**

**⚠️ IMPORTANTE:** Google te mostrará una contraseña de 16 caracteres como esta:

```
abcd efgh ijkl mnop
```

**✅ COPIA ESTA CONTRASEÑA INMEDIATAMENTE**

- Solo se muestra una vez
- Guárdala en un lugar seguro
- Quita los espacios: `abcdefghijklmnop`

---

## 💻 Paso 4: Instalar Supabase CLI

### **En Mac/Linux:**

```bash
brew install supabase/tap/supabase
```

### **En Windows (con Scoop):**

```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### **Verificar instalación:**

```bash
supabase --version
```

---

## 🔗 Paso 5: Vincular Proyecto Supabase

### **5.1 Iniciar sesión**

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte.

### **5.2 Vincular proyecto**

```bash
cd /ruta/a/Controldecarton
supabase link --project-ref bdrxcilsuxbkpmolfbgu
```

---

## ⚙️ Paso 6: Configurar Secrets en Supabase

### **6.1 Configurar correo de Gmail**

```bash
supabase secrets set GMAIL_USER=controlcarton@gmail.com
```

### **6.2 Configurar contraseña de aplicación**

```bash
supabase secrets set GMAIL_APP_PASSWORD=abcdefghijklmnop
```

**⚠️ Reemplaza** `abcdefghijklmnop` con tu contraseña de aplicación real (sin espacios).

### **6.3 Verificar secrets**

```bash
supabase secrets list
```

Deberías ver:

```
GMAIL_USER
GMAIL_APP_PASSWORD
```

---

## 🚀 Paso 7: Desplegar Edge Function

### **7.1 Desplegar**

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

**✅ Copia la URL** para el siguiente paso.

---

## 🔗 Paso 8: Configurar Database Webhook

### **8.1 Ir a Supabase Dashboard**

1. Ve a: **https://supabase.com/dashboard**
2. Selecciona tu proyecto: **bdrxcilsuxbkpmolfbgu**
3. **Database** → **Webhooks**
4. Haz clic en **"Create webhook"**

### **8.2 Configurar webhook**

| Campo | Valor |
|-------|-------|
| **Name** | `notificar_nueva_oci` |
| **Table** | `ordenes_compra` |
| **Events** | ✅ **INSERT** (solo INSERT, desmarca UPDATE y DELETE) |
| **Method** | `POST` |
| **URL** | `https://bdrxcilsuxbkpmolfbgu.supabase.co/functions/v1/notificar-nueva-oci` |

### **8.3 Guardar**

Haz clic en **"Create webhook"**

**✅ Webhook configurado**

---

## 🧪 Paso 9: Probar el Sistema

### **9.1 Ver logs en tiempo real**

```bash
supabase functions logs notificar-nueva-oci --tail
```

### **9.2 Crear una OCI de prueba**

1. Ve a tu sistema OCI
2. Haz clic en **"Crear OCI"**
3. Llena todos los campos:
   - Material
   - Cantidad
   - Pallets
   - etc.
4. Haz clic en **"Crear OCI"**

### **9.3 Verificar logs**

En la terminal deberías ver:

```
📦 Webhook recibido
📋 Nueva OCI: OCI-2026-02-001
📤 Enviando correo via Gmail SMTP...
SMTP Banner: 220 smtp.gmail.com ESMTP...
EHLO: 250-smtp.gmail.com...
STARTTLS: 220 2.0.0 Ready to start TLS
EHLO (TLS): 250-smtp.gmail.com...
AUTH LOGIN: 334 VXNlcm5hbWU6
Username: 334 UGFzc3dvcmQ6
Password: 235 2.7.0 Accepted
MAIL FROM: 250 2.1.0 OK
RCPT TO jcanett@pxg.com: 250 2.1.5 OK
RCPT TO smexia@pxg.com: 250 2.1.5 OK
DATA: 354 Go ahead
Message: 250 2.0.0 OK
QUIT: 221 2.0.0 closing connection
✅ Correo enviado exitosamente
```

### **9.4 Verificar correos**

**Revisa:**
- ✅ jcanett@pxg.com
- ✅ smexia@pxg.com

**Si no está en la bandeja de entrada, revisa SPAM**

---

## 📧 Información del Correo

### **Destinatarios:**
- jcanett@pxg.com
- smexia@pxg.com

### **Remitente:**
- controlcarton@gmail.com

### **Asunto:**
```
🔔 Nueva OCI Creada: OCI-2026-02-001
```

### **Contenido:**

| Campo | Ejemplo |
|-------|---------|
| **Número de OCI** | OCI-2026-02-001 |
| **Material** | 0632545 |
| **Cantidad Total** | 5,000 piezas |
| **Usuario Solicitante** | ID: 1 |
| **Fecha de Creación** | 25/02/2026 12:45:30 |
| **Estado** | PENDIENTE |

---

## 🛠️ Solución de Problemas

### **❌ Error: "GMAIL_APP_PASSWORD is not set"**

**Solución:**

```bash
supabase secrets set GMAIL_APP_PASSWORD=tu_contraseña_aqui
```

---

### **❌ Error 535: "Username and Password not accepted"**

**Causas posibles:**

1. **Contraseña incorrecta**
   - Verifica que copiaste la contraseña de aplicación correctamente
   - Sin espacios: `abcdefghijklmnop`

2. **Verificación en 2 pasos no activada**
   - Ve a: https://myaccount.google.com/security
   - Activa "Verificación en 2 pasos"

3. **Contraseña de aplicación no creada**
   - Ve a: https://myaccount.google.com/apppasswords
   - Crea una nueva contraseña de aplicación

**Solución:**

```bash
# Crear nueva contraseña de aplicación
# Configurar en Supabase
supabase secrets set GMAIL_APP_PASSWORD=nueva_contraseña
```

---

### **❌ No llegan los correos**

**Verificar:**

1. **Logs de Edge Function:**
   ```bash
   supabase functions logs notificar-nueva-oci --tail
   ```

2. **Carpeta de SPAM:**
   - Gmail puede marcar correos automáticos como spam

3. **Webhook activo:**
   - Supabase Dashboard → Database → Webhooks
   - Verificar que esté habilitado

4. **Correos destino correctos:**
   - Verificar que jcanett@pxg.com y smexia@pxg.com sean correctos

---

### **❌ Error: "Connection timeout"**

**Causa:** Firewall bloqueando puerto 587

**Solución:**
- Verifica que el puerto 587 esté abierto
- Supabase Edge Functions normalmente no tienen este problema

---

## 📊 Límites de Gmail

| Límite | Cantidad |
|--------|----------|
| **Correos por día** | 500 (cuenta gratuita) |
| **Correos por día** | 2,000 (Google Workspace) |
| **Destinatarios por correo** | 100 |
| **Tamaño máximo** | 25 MB |

**Nota:** Para tu caso (2 destinatarios por OCI), puedes enviar hasta **250 OCIs por día**.

---

## 🔧 Actualizar Edge Function

### **Editar código:**

```bash
cd /ruta/a/Controldecarton
nano supabase/functions/notificar-nueva-oci/index.ts
```

### **Desplegar cambios:**

```bash
supabase functions deploy notificar-nueva-oci
```

### **Ver logs:**

```bash
supabase functions logs notificar-nueva-oci --tail
```

---

## 🔒 Seguridad

### **Buenas prácticas:**

1. ✅ **Nunca compartas la contraseña de aplicación**
2. ✅ **Usa una contraseña única para la cuenta de Gmail**
3. ✅ **Activa verificación en 2 pasos**
4. ✅ **Revoca contraseñas de aplicación no usadas**
5. ✅ **Monitorea actividad de la cuenta**

### **Revocar contraseña de aplicación:**

1. Ve a: https://myaccount.google.com/apppasswords
2. Encuentra "OCI PXG Supabase"
3. Haz clic en el icono de papelera
4. Confirma

---

## 📞 Soporte

**Sistema OCI PXG MÉXICO**  
**Creado por:** IT Tequila  
**Soporte:** jcanett@pxg.com  

**Gmail:**  
- Ayuda: https://support.google.com/mail
- Contraseñas de aplicación: https://myaccount.google.com/apppasswords

**Supabase:**  
- Documentación: https://supabase.com/docs
- Dashboard: https://supabase.com/dashboard

---

## 🎉 Resumen

✅ **Cuenta de Gmail creada: controlcarton@gmail.com**  
✅ **Verificación en 2 pasos activada**  
✅ **Contraseña de aplicación generada**  
✅ **Supabase CLI instalado**  
✅ **Proyecto vinculado**  
✅ **Secrets configurados**  
✅ **Edge Function desplegada**  
✅ **Webhook configurado**  
✅ **Sistema probado y funcionando**  

**¡Tu sistema de notificaciones está listo!** 📧✅🚀
