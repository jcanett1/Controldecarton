# 🔍 Diagnóstico: Correos No Llegan con Resend

## 📋 Situación

- ✅ Edge Function se ejecuta (código 200)
- ❌ Correos no llegan a destinatarios
- ❌ No aparecen en Dashboard de Resend
- ❓ Logs internos de la función no visibles

---

## 🔎 Posibles Causas

### **1. API Key No Configurada o Incorrecta**

**Síntoma:** La función devuelve 200 pero no envía correos.

**Verificar:**
```
Dashboard Supabase → Edge Functions → notificar-nueva-oci → Settings → Secrets
```

**Debe existir:**
- Name: `RESEND_API_KEY`
- Value: `re_...` (tu API key de Resend)

**Solución:**
1. Verifica que el secret exista
2. Verifica que el valor sea correcto (sin espacios)
3. Redeploy la función después de agregar/actualizar

---

### **2. Dominio de Remitente Incorrecto**

**Problema:** Resend requiere que uses un dominio verificado o `onboarding@resend.dev`.

**En el código actual:**
```typescript
from: "Control de Cartón <onboarding@resend.dev>"
```

**✅ Esto es correcto** para cuentas nuevas de Resend.

**⚠️ IMPORTANTE:** El dominio `onboarding@resend.dev` solo funciona para **testing** y tiene limitaciones:
- Solo puede enviar a correos verificados
- No funciona para producción

---

### **3. Destinatarios No Verificados**

**Problema:** En el plan gratuito de Resend, solo puedes enviar correos a direcciones verificadas.

**Destinatarios actuales:**
```typescript
to: ["jcanett@pxg.com", "smexia@pxg.com"]
```

**Solución:**
1. Ve a Dashboard de Resend
2. Ve a: **Settings** → **Verified Emails** o **Audience**
3. Agrega y verifica: `jcanett@pxg.com` y `smexia@pxg.com`
4. Cada destinatario recibirá un correo de verificación
5. Deben hacer clic en el enlace para verificar

---

### **4. Cuenta de Resend en Modo Sandbox**

**Problema:** Las cuentas nuevas de Resend están en modo "Sandbox" que requiere verificación de destinatarios.

**Verificar:**
1. Dashboard de Resend
2. Busca un banner que diga "Sandbox mode" o "Development mode"

**Solución:**
1. Verifica los correos de destinatarios (ver punto 3)
2. O actualiza tu cuenta de Resend a modo producción

---

### **5. Logs No Visibles en Dashboard**

**Problema:** Los `console.log` no aparecen en el Dashboard de Supabase.

**Solución:**
1. Ve a: **Edge Functions** → **notificar-nueva-oci** → **Logs**
2. Cambia el filtro de tiempo a "Last hour" o "Last 24 hours"
3. Busca los logs con emojis (📦, 📋, 📤, ✅, ❌)
4. Si no aparecen, puede ser que los logs estén en otra vista

**Alternativa:**
1. Ve a: **Logs & Analytics** (menú principal)
2. Busca por: `notificar-nueva-oci`
3. Filtra por: "Edge Functions"

---

## 🛠️ Pasos de Diagnóstico

### **Paso 1: Verificar Secret**

1. Dashboard Supabase → Edge Functions → notificar-nueva-oci → Settings
2. Verifica que exista: `RESEND_API_KEY`
3. Si no existe o es incorrecto:
   - Agrégalo o actualízalo
   - Haz clic en "Redeploy"

---

### **Paso 2: Verificar API Key en Resend**

1. Ve a: https://resend.com/api-keys
2. Verifica que la API key exista y esté activa
3. Copia la API key (si es necesario, crea una nueva)
4. Actualiza el secret en Supabase

---

### **Paso 3: Verificar Destinatarios**

1. Ve a: https://resend.com/audiences (o Settings → Verified Emails)
2. Agrega los correos:
   - `jcanett@pxg.com`
   - `smexia@pxg.com`
3. Cada uno recibirá un correo de verificación
4. Deben hacer clic en el enlace

---

### **Paso 4: Verificar Logs Completos**

1. Dashboard Supabase → Edge Functions → notificar-nueva-oci → Logs
2. Haz clic en el log más reciente (el que muestra 200)
3. Busca en los detalles:
   - `📦 Webhook recibido`
   - `📋 Nueva OCI: ...`
   - `📤 Enviando correo via Resend API...`
   - `✅ Correo enviado exitosamente` o `❌ Error de Resend`

---

### **Paso 5: Verificar Dashboard de Resend**

1. Ve a: https://resend.com/emails
2. Deberías ver los correos enviados (incluso si fallaron)
3. Haz clic en cada correo para ver:
   - Estado (Delivered, Failed, Bounced)
   - Error messages (si hay)

---

## 🔧 Soluciones Rápidas

### **Solución 1: Usar Tu Correo Personal para Pruebas**

Cambia temporalmente los destinatarios a tu correo personal (que puedes verificar fácilmente):

```typescript
to: ["tu_correo_personal@gmail.com"]
```

1. Ve a Resend → Verified Emails
2. Agrega y verifica tu correo personal
3. Actualiza el código
4. Redeploy
5. Prueba de nuevo

---

### **Solución 2: Verificar Correos Corporativos**

1. Dashboard Resend → Audiences/Verified Emails
2. Add email: `jcanett@pxg.com`
3. Add email: `smexia@pxg.com`
4. Cada uno recibe correo de verificación
5. Hacer clic en enlace de verificación
6. Probar de nuevo

---

### **Solución 3: Agregar Más Logs**

Actualizar el código para ver más información:

```typescript
console.log("📤 Enviando correo via Resend API...");
console.log("🔑 API Key presente:", !!RESEND_API_KEY);
console.log("📧 Destinatarios:", ["jcanett@pxg.com", "smexia@pxg.com"]);

const resendResponse = await fetch("https://api.resend.com/emails", {
  // ...
});

console.log("📡 Resend status:", resendResponse.status);
console.log("📡 Resend ok:", resendResponse.ok);

const resendData = await resendResponse.json();
console.log("📡 Resend data:", JSON.stringify(resendData, null, 2));
```

---

## 📊 Checklist de Verificación

- [ ] Secret `RESEND_API_KEY` existe en Supabase
- [ ] API Key es correcta (copiada de Resend Dashboard)
- [ ] Función redeployada después de agregar secret
- [ ] Cuenta de Resend creada y activa
- [ ] API Key activa en Resend Dashboard
- [ ] Correos destinatarios verificados en Resend
- [ ] Logs completos revisados (con emojis)
- [ ] Dashboard de Resend revisado (emails enviados)
- [ ] Webhook activo en Supabase
- [ ] Remitente es `onboarding@resend.dev`

---

## 🎯 Siguiente Paso

**Lo más probable es que necesites verificar los correos de destinatarios en Resend.**

1. Ve a: https://resend.com/audiences
2. Agrega: `jcanett@pxg.com` y `smexia@pxg.com`
3. Verifica ambos correos
4. Prueba de nuevo

---

## 📞 Soporte

Si después de verificar todo sigue sin funcionar, necesitamos ver:
1. Los logs completos de la Edge Function (expandidos)
2. El Dashboard de Resend (si aparecen correos)
3. El estado de la API Key en Resend
4. El estado de verificación de destinatarios
