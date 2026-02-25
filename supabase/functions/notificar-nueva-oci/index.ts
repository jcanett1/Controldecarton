// Edge Function: notificar-nueva-oci
// Envía notificaciones por correo usando Gmail SMTP cuando se crea una nueva OCI

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Configuración de correo
const GMAIL_USER = Deno.env.get('GMAIL_USER') || 'controlcarton@gmail.com';
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD');
const DESTINATARIOS = ['jcanett@pxg.com', 'smexia@pxg.com'];

serve(async (req) => {
  try {
    console.log('📦 Webhook recibido');
    
    // Parsear el payload del webhook
    const payload = await req.json();
    console.log('📋 Payload:', JSON.stringify(payload, null, 2));

    // Extraer datos de la nueva OCI
    const { record } = payload;
    
    if (!record) {
      console.error('❌ No se encontró record en el payload');
      return new Response(
        JSON.stringify({ error: 'No record found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Nueva OCI:', record.numero_oci);

    // Verificar que tengamos la contraseña de aplicación
    if (!GMAIL_APP_PASSWORD) {
      console.error('❌ GMAIL_APP_PASSWORD no está configurada');
      return new Response(
        JSON.stringify({ error: 'GMAIL_APP_PASSWORD not set' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Preparar datos del correo
    const numeroOCI = record.numero_oci || 'N/A';
    const material = record.material_numero || 'N/A';
    const cantidadTotal = record.cantidad_total_piezas || 0;
    const usuarioId = record.usuario_solicitante_id || 'N/A';
    const fechaCreacion = record.fecha_creacion ? new Date(record.fecha_creacion).toLocaleString('es-MX') : 'N/A';
    const estado = record.estado || 'PENDIENTE';

    // HTML del correo
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva OCI Creada</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(90deg, #000000 0%, #1a1a1a 100%); padding: 30px; text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 5px;">📦</div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Gestión y Control de</h1>
                            <h2 style="margin: 5px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 600;">Órdenes de Compra de Cartón</h2>
                            <p style="margin: 10px 0 0 0; color: #999999; font-size: 14px;">The Cloud ERP - PXG México</p>
                        </td>
                    </tr>

                    <!-- Alert -->
                    <tr>
                        <td style="padding: 30px;">
                            <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; border-radius: 4px; margin-bottom: 25px;">
                                <p style="margin: 0; color: #1976d2; font-weight: 600; font-size: 16px;">
                                    🔔 Nueva Orden de Compra Interna Creada
                                </p>
                            </div>

                            <!-- Info Box -->
                            <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                                <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px; border-bottom: 2px solid #0078d4; padding-bottom: 10px;">
                                    Información de la OCI
                                </h3>
                                
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666; font-weight: 600; width: 40%;">Número de OCI:</td>
                                        <td style="padding: 8px 0; color: #333333; font-weight: 700; font-size: 16px;">${numeroOCI}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666; font-weight: 600;">Material:</td>
                                        <td style="padding: 8px 0; color: #333333;">${material}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666; font-weight: 600;">Cantidad Total:</td>
                                        <td style="padding: 8px 0; color: #333333;">${cantidadTotal.toLocaleString()} piezas</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666; font-weight: 600;">Usuario Solicitante:</td>
                                        <td style="padding: 8px 0; color: #333333;">ID: ${usuarioId}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666; font-weight: 600;">Fecha de Creación:</td>
                                        <td style="padding: 8px 0; color: #333333;">${fechaCreacion}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666; font-weight: 600;">Estado:</td>
                                        <td style="padding: 8px 0;">
                                            <span style="background-color: #fff3cd; color: #856404; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                                                ${estado}
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Next Steps -->
                            <div style="background-color: #e8f5e9; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                                <h4 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 14px;">📋 Próximos Pasos:</h4>
                                <ul style="margin: 0; padding-left: 20px; color: #1b5e20; font-size: 13px;">
                                    <li style="margin-bottom: 5px;">Revisar los detalles de la orden en el sistema</li>
                                    <li style="margin-bottom: 5px;">Verificar disponibilidad de material</li>
                                    <li>Procesar la orden según el flujo establecido</li>
                                </ul>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 25px 0;">
                                <a href="https://tu-sistema-oci.com" style="display: inline-block; background: linear-gradient(90deg, #0078d4 0%, #005a9e 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(0,120,212,0.3);">
                                    Ver en el Sistema
                                </a>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0 0 5px 0; color: #666666; font-size: 12px;">
                                Sistema OCI PXG MÉXICO
                            </p>
                            <p style="margin: 0 0 5px 0; color: #666666; font-size: 12px;">
                                Creado por <strong>IT Tequila</strong>
                            </p>
                            <p style="margin: 0; color: #666666; font-size: 12px;">
                                Soporte: <a href="mailto:jcanett@pxg.com" style="color: #0078d4; text-decoration: none;">jcanett@pxg.com</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    // Enviar correo usando Gmail SMTP
    console.log('📤 Enviando correo via Gmail SMTP...');
    
    // Conectar a Gmail SMTP
    const conn = await Deno.connect({
      hostname: "smtp.gmail.com",
      port: 587,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Función para leer respuesta
    const readResponse = async () => {
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      if (n === null) return '';
      return decoder.decode(buffer.subarray(0, n));
    };

    // Función para enviar comando
    const sendCommand = async (command: string) => {
      await conn.write(encoder.encode(command + '\r\n'));
      return await readResponse();
    };

    try {
      // Leer banner del servidor
      let response = await readResponse();
      console.log('SMTP Banner:', response);

      // EHLO
      response = await sendCommand('EHLO localhost');
      console.log('EHLO:', response);

      // STARTTLS
      response = await sendCommand('STARTTLS');
      console.log('STARTTLS:', response);

      // Upgrade to TLS
      const tlsConn = await Deno.startTls(conn, { hostname: "smtp.gmail.com" });

      // Re-crear funciones con la conexión TLS
      const readTlsResponse = async () => {
        const buffer = new Uint8Array(1024);
        const n = await tlsConn.read(buffer);
        if (n === null) return '';
        return decoder.decode(buffer.subarray(0, n));
      };

      const sendTlsCommand = async (command: string) => {
        await tlsConn.write(encoder.encode(command + '\r\n'));
        return await readTlsResponse();
      };

      // EHLO después de TLS
      response = await sendTlsCommand('EHLO localhost');
      console.log('EHLO (TLS):', response);

      // AUTH LOGIN
      response = await sendTlsCommand('AUTH LOGIN');
      console.log('AUTH LOGIN:', response);

      // Enviar username (base64)
      const usernameB64 = btoa(GMAIL_USER);
      response = await sendTlsCommand(usernameB64);
      console.log('Username:', response);

      // Enviar password (base64)
      const passwordB64 = btoa(GMAIL_APP_PASSWORD);
      response = await sendTlsCommand(passwordB64);
      console.log('Password:', response);

      // MAIL FROM
      response = await sendTlsCommand(`MAIL FROM:<${GMAIL_USER}>`);
      console.log('MAIL FROM:', response);

      // RCPT TO (para cada destinatario)
      for (const destinatario of DESTINATARIOS) {
        response = await sendTlsCommand(`RCPT TO:<${destinatario}>`);
        console.log(`RCPT TO ${destinatario}:`, response);
      }

      // DATA
      response = await sendTlsCommand('DATA');
      console.log('DATA:', response);

      // Construir el mensaje
      const toHeader = DESTINATARIOS.join(', ');
      const message = [
        `From: Control de Cartón <${GMAIL_USER}>`,
        `To: ${toHeader}`,
        `Subject: =?UTF-8?B?${btoa('🔔 Nueva OCI Creada: ' + numeroOCI)}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        '',
        htmlContent,
        '.',
      ].join('\r\n');

      // Enviar mensaje
      await tlsConn.write(encoder.encode(message + '\r\n'));
      response = await readTlsResponse();
      console.log('Message:', response);

      // QUIT
      response = await sendTlsCommand('QUIT');
      console.log('QUIT:', response);

      // Cerrar conexión
      tlsConn.close();

      console.log('✅ Correo enviado exitosamente');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Correo enviado',
          oci: numeroOCI,
          destinatarios: DESTINATARIOS
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );

    } catch (smtpError) {
      console.error('❌ Error SMTP:', smtpError);
      conn.close();
      throw smtpError;
    }

  } catch (error) {
    console.error('❌ Error general:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});
