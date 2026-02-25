// Supabase Edge Function: notificar-nueva-oci
// Envía notificaciones por correo usando Resend API cuando se crea una nueva OCI
// Autor: IT Tequila
// Sistema: OCI PXG México

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuración
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const FROM_EMAIL = 'controlcarton@pxg.com';
const TO_EMAILS = ['jcanett@pxg.com', 'smexia@pxg.com'];

console.log('🚀 Edge Function iniciada: notificar-nueva-oci');
console.log(`📧 Correos destino: ${TO_EMAILS.join(', ')}`);

serve(async (req) => {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        error: 'Método no permitido. Use POST.' 
      }),
      { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Parsear el payload del webhook
    const payload = await req.json();
    console.log('📦 Webhook recibido:', JSON.stringify(payload, null, 2));

    // Extraer datos de la nueva OCI
    const { record } = payload;
    
    if (!record) {
      console.error('❌ No se encontró el registro en el payload');
      return new Response(
        JSON.stringify({ error: 'Payload inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const {
      numero_oci,
      material_numero,
      cantidad_total_piezas,
      usuario_solicitante_id,
      fecha_creacion,
      estado
    } = record;

    console.log(`📋 Nueva OCI: ${numero_oci}`);
    console.log(`📦 Material: ${material_numero}`);
    console.log(`🔢 Cantidad: ${cantidad_total_piezas}`);

    // Formatear fecha
    const fechaFormateada = fecha_creacion 
      ? new Date(fecha_creacion).toLocaleString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      : 'No disponible';

    // HTML del correo
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva OCI Creada</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2d2d2d 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 8px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .alert {
            background: #d1ecf1;
            border-left: 4px solid #0c5460;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .alert h2 {
            margin: 0 0 10px 0;
            color: #0c5460;
            font-size: 18px;
        }
        .alert p {
            margin: 0;
            color: #0c5460;
        }
        .info-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .info-box h3 {
            margin: 0 0 15px 0;
            color: #000000;
            font-size: 16px;
            font-weight: 600;
        }
        .info-item {
            margin: 12px 0;
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
        }
        .info-item:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: #495057;
        }
        .info-value {
            color: #212529;
            text-align: right;
        }
        .steps {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .steps h3 {
            margin: 0 0 10px 0;
            color: #856404;
            font-size: 16px;
        }
        .steps ul {
            margin: 10px 0 0 0;
            padding-left: 20px;
            color: #856404;
        }
        .steps li {
            margin: 5px 0;
        }
        .footer {
            background: #f8f9fa;
            text-align: center;
            padding: 20px;
            border-top: 2px solid #dee2e6;
            color: #6c757d;
            font-size: 12px;
        }
        .footer p {
            margin: 5px 0;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            background: #ffc107;
            color: #000;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 Nueva Orden de Compra Creada</h1>
            <p>Gestión y Control de Órdenes de Compra de Cartón</p>
            <p>The Cloud ERP - PXG México</p>
        </div>
        
        <div class="content">
            <div class="alert">
                <h2>📋 Se ha creado una nueva orden de compra</h2>
                <p>Se requiere tu atención para procesar la siguiente orden.</p>
            </div>
            
            <div class="info-box">
                <h3>📄 Información de la Orden</h3>
                
                <div class="info-item">
                    <span class="info-label">Número de OCI:</span>
                    <span class="info-value"><strong>${numero_oci || 'No disponible'}</strong></span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Material:</span>
                    <span class="info-value">${material_numero || 'No disponible'}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Cantidad Total:</span>
                    <span class="info-value"><strong>${cantidad_total_piezas ? cantidad_total_piezas.toLocaleString('es-MX') + ' piezas' : 'No disponible'}</strong></span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Usuario Solicitante:</span>
                    <span class="info-value">ID: ${usuario_solicitante_id || 'No disponible'}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Fecha de Creación:</span>
                    <span class="info-value">${fechaFormateada}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">Estado:</span>
                    <span class="info-value"><span class="badge">${estado || 'PENDIENTE'}</span></span>
                </div>
            </div>
            
            <div class="steps">
                <h3>💡 Próximos pasos:</h3>
                <ul>
                    <li>Revisar la orden en el sistema</li>
                    <li>Validar disponibilidad de material</li>
                    <li>Procesar la orden de compra</li>
                    <li>Actualizar el estado en el sistema</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Sistema OCI PXG MÉXICO</strong></p>
            <p>Creado por IT Tequila</p>
            <p>Soporte: jcanett@pxg.com</p>
            <p style="margin-top: 10px; font-size: 11px; color: #adb5bd;">
                Este es un correo automático. Por favor no responder.
            </p>
        </div>
    </div>
</body>
</html>
    `;

    // Enviar correo usando Resend API
    console.log('📤 Enviando correo via Resend...');
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TO_EMAILS,
        subject: `🔔 Nueva OCI Creada: ${numero_oci || 'Sin número'}`,
        html: htmlContent
      })
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('❌ Error de Resend:', resendData);
      return new Response(
        JSON.stringify({ 
          error: 'Error al enviar correo',
          details: resendData 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Correo enviado exitosamente:', resendData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Notificación enviada correctamente',
        email_id: resendData.id,
        oci: numero_oci
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
