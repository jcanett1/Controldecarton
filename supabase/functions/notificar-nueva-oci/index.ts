// Supabase Edge Function: notificar-nueva-oci
// Envía notificaciones por correo cuando se crea una nueva orden de compra
// Autor: IT Tequila
// Sistema: OCI PXG México

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Configuración de correos destino
const TO_EMAILS = ['jcanett@pxg.com', 'smexia@pxg.com'];
const FROM_EMAIL = 'controlcarton@pxg.com';

// Configuración SMTP (servidor interno PXG)
const SMTP_CONFIG = {
  hostname: '10.232.237.25',
  port: 25,
  // Sin autenticación para servidor interno
};

/**
 * Envía un correo electrónico usando el servidor SMTP interno de PXG
 */
async function enviarCorreo(ordenData: any) {
  try {
    // Extraer información de la orden
    const numeroOci = ordenData.numero_oci || 'N/A';
    const materialNumero = ordenData.material_numero || 'N/A';
    const cantidadTotal = ordenData.cantidad_total_piezas || 0;
    const usuarioId = ordenData.usuario_solicitante_id || 'N/A';
    const fechaCreacion = ordenData.fecha_creacion || new Date().toISOString();
    const estado = ordenData.estado || 'PENDIENTE';
    
    // Formatear fecha
    let fechaFormateada = fechaCreacion;
    try {
      const fecha = new Date(fechaCreacion);
      fechaFormateada = fecha.toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      console.error('Error formateando fecha:', e);
    }
    
    // Crear contenido HTML del correo
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2d2d2d 100%);
            border-radius: 10px;
        }
        .header {
            background: linear-gradient(90deg, #000000 0%, #1a1a1a 100%);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            color: #ccc;
        }
        .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .info-box {
            background: #f8fafc;
            border-left: 4px solid #0078d4;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: bold;
            color: #374151;
        }
        .info-value {
            color: #1f2937;
        }
        .badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        .badge-pendiente {
            background: #fef3c7;
            color: #92400e;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
        }
        .alert {
            background: #dbeafe;
            border-left: 4px solid #2563eb;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
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
                <strong>📋 Se ha creado una nueva orden de compra en el sistema OCI</strong>
            </div>
            
            <div class="info-box">
                <h3 style="margin-top: 0; color: #0078d4;">📄 Información de la Orden</h3>
                
                <div class="info-row">
                    <span class="info-label">Número de OCI:</span>
                    <span class="info-value"><strong>${numeroOci}</strong></span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Material:</span>
                    <span class="info-value">${materialNumero}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Cantidad Total:</span>
                    <span class="info-value"><strong>${cantidadTotal.toLocaleString()} piezas</strong></span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Usuario Solicitante:</span>
                    <span class="info-value">ID: ${usuarioId}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Fecha de Creación:</span>
                    <span class="info-value">${fechaFormateada}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Estado:</span>
                    <span class="info-value">
                        <span class="badge badge-pendiente">${estado}</span>
                    </span>
                </div>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 5px;">
                <p style="margin: 0; font-size: 14px;">
                    <strong>💡 Próximos pasos:</strong><br>
                    • Revisar la orden en el sistema<br>
                    • Validar disponibilidad de material<br>
                    • Procesar la orden de compra
                </p>
            </div>
            
            <div class="footer">
                <p><strong>Sistema OCI PXG MÉXICO</strong></p>
                <p>Creado por IT Tequila</p>
                <p>Soporte: <a href="mailto:jcanett@pxg.com">jcanett@pxg.com</a></p>
                <p style="margin-top: 10px; color: #9ca3af;">
                    Este es un correo automático, por favor no responder.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
    
    // Crear mensaje de correo en formato SMTP
    const subject = `🔔 Nueva OCI Creada: ${numeroOci}`;
    const toHeader = TO_EMAILS.join(', ');
    
    const emailMessage = [
      `From: ${FROM_EMAIL}`,
      `To: ${toHeader}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      htmlContent
    ].join('\r\n');
    
    // Conectar al servidor SMTP y enviar correo
    console.log(`📧 Conectando a SMTP ${SMTP_CONFIG.hostname}:${SMTP_CONFIG.port}...`);
    
    const conn = await Deno.connect({
      hostname: SMTP_CONFIG.hostname,
      port: SMTP_CONFIG.port,
    });
    
    console.log('✅ Conexión SMTP establecida');
    
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Leer respuesta del servidor
    const buffer = new Uint8Array(1024);
    await conn.read(buffer);
    console.log('SMTP:', decoder.decode(buffer));
    
    // HELO
    await conn.write(encoder.encode(`HELO pxg.com\r\n`));
    await conn.read(buffer);
    console.log('SMTP:', decoder.decode(buffer));
    
    // MAIL FROM
    await conn.write(encoder.encode(`MAIL FROM:<${FROM_EMAIL}>\r\n`));
    await conn.read(buffer);
    console.log('SMTP:', decoder.decode(buffer));
    
    // RCPT TO (para cada destinatario)
    for (const email of TO_EMAILS) {
      await conn.write(encoder.encode(`RCPT TO:<${email}>\r\n`));
      await conn.read(buffer);
      console.log('SMTP:', decoder.decode(buffer));
    }
    
    // DATA
    await conn.write(encoder.encode(`DATA\r\n`));
    await conn.read(buffer);
    console.log('SMTP:', decoder.decode(buffer));
    
    // Enviar mensaje
    await conn.write(encoder.encode(emailMessage + '\r\n.\r\n'));
    await conn.read(buffer);
    console.log('SMTP:', decoder.decode(buffer));
    
    // QUIT
    await conn.write(encoder.encode(`QUIT\r\n`));
    await conn.read(buffer);
    console.log('SMTP:', decoder.decode(buffer));
    
    conn.close();
    
    console.log(`✅ Correo enviado exitosamente para OCI ${numeroOci}`);
    return { success: true, message: 'Correo enviado exitosamente' };
    
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handler principal de la Edge Function
 */
serve(async (req) => {
  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido. Use POST.' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtener datos del webhook
    const data = await req.json();
    console.log('📥 Webhook recibido:', JSON.stringify(data, null, 2));
    
    // Validar que sea un INSERT
    if (data.type !== 'INSERT') {
      console.log(`⚠️ Tipo de evento ignorado: ${data.type}`);
      return new Response(
        JSON.stringify({ status: 'ignored', message: 'Solo se procesan eventos INSERT' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtener datos de la nueva orden
    const ordenData = data.record;
    
    if (!ordenData) {
      console.warn('⚠️ No se encontraron datos de la orden');
      return new Response(
        JSON.stringify({ status: 'error', message: 'No se encontraron datos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Enviar correo
    const resultado = await enviarCorreo(ordenData);
    
    if (resultado.success) {
      return new Response(
        JSON.stringify({
          status: 'success',
          message: 'Correo enviado exitosamente',
          oci: ordenData.numero_oci
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Error al enviar correo',
          error: resultado.error
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
})
