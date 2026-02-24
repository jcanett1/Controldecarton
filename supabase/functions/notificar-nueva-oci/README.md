# 📧 Edge Function: notificar-nueva-oci

Supabase Edge Function que envía notificaciones por correo electrónico cuando se crea una nueva orden de compra.

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

# 4. Desplegar función
supabase functions deploy notificar-nueva-oci
```

---

## ⚙️ Configuración

### **Destinatarios:**
- jcanett@pxg.com
- smexia@pxg.com

### **Remitente:**
- controlcarton@pxg.com

### **Servidor SMTP:**
- Host: 10.232.237.25 (smtp.yamww.internal)
- Puerto: 25
- Autenticación: Desactivada (servidor interno)

---

## 🔗 Webhook

Después de desplegar, configura el webhook en Supabase Dashboard:

1. **Database** → **Webhooks** → **Create webhook**
2. **Name:** `notificar_nueva_oci`
3. **Table:** `ordenes_compra`
4. **Events:** ✅ INSERT
5. **Method:** POST
6. **URL:** `https://bdrxcilsuxbkpmolfbgu.supabase.co/functions/v1/notificar-nueva-oci`

---

## 🧪 Prueba

```bash
# Ver logs en tiempo real
supabase functions logs notificar-nueva-oci --tail

# Crear una OCI de prueba en el sistema
# Revisa tu correo en jcanett@pxg.com y smexia@pxg.com
```

---

## 📖 Documentación Completa

Ver: `/GUIA_EDGE_FUNCTION_WEBHOOK.md`

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

## 📞 Soporte

**Sistema OCI PXG MÉXICO**  
**Creado por:** IT Tequila  
**Soporte:** jcanett@pxg.com
