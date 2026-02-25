// Edge Function: notificar-nueva-oci
// Envía notificaciones por email cuando se crea una nueva OCI
// Usa Resend API para envío de correos

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface OCI {
  id: number;
  numero_oci: string;
  usuario_solicitante_id: number;
  material_numero: string;
  piezas_por_pallet: number;
  cantidad_pallets: number;
  cantidad_total_piezas: number;
  fecha_creacion: string;
  estado: string;
  observaciones?: string;
  oc_mtk?: string;
  qty_a_enviar?: number;
  zor?: string;
}

interface WebhookPayload {
  type: string;
  table: string;
  record: OCI;
  schema: string;
  old_record: null | OCI;
}

serve(async (req) => {
  try {
    console.log("📦 Webhook recibido");

    // Verificar que la API key esté configurada
    if (!RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY no está configurada");
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY is not set" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parsear el payload del webhook
    const payload: WebhookPayload = await req.json();
    console.log("📋 Payload:", JSON.stringify(payload, null, 2));

    // Extraer datos de la nueva OCI
    const oci = payload.record;
    console.log(`📋 Nueva OCI: ${oci.numero_oci}`);

    // Preparar el contenido del email
    const emailHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva OCI Creada</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                🔔 Nueva Orden de Compra Creada
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">
                Sistema OCI PXG MÉXICO - The Cloud ERP
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                Se ha creado una nueva Orden de Compra Interna (OCI) en el sistema.
              </p>

              <!-- OCI Details Table -->
              <table width="100%" cellpadding="12" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 20px;">
                <tr style="background-color: #f9fafb;">
                  <td style="border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #1f2937; width: 40%;">
                    📋 Número de OCI
                  </td>
                  <td style="border-bottom: 1px solid #e5e7eb; color: #374151;">
                    <strong style="color: #1e40af; font-size: 18px;">${oci.numero_oci}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #1f2937; background-color: #f9fafb;">
                    📦 Material
                  </td>
                  <td style="border-bottom: 1px solid #e5e7eb; color: #374151;">
                    ${oci.material_numero}
                  </td>
                </tr>
                <tr style="background-color: #f9fafb;">
                  <td style="border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #1f2937;">
                    📊 Cantidad Total
                  </td>
                  <td style="border-bottom: 1px solid #e5e7eb; color: #374151;">
                    <strong>${(oci.cantidad_total_piezas || 0).toLocaleString()}</strong> piezas
                  </td>
                </tr>
                <tr>
                  <td style="border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #1f2937; background-color: #f9fafb;">
                    📦 Pallets
                  </td>
                  <td style="border-bottom: 1px solid #e5e7eb; color: #374151;">
                    ${oci.cantidad_pallets || 0} pallets (${oci.piezas_por_pallet || 0} piezas/pallet)
                  </td>
                </tr>
                <tr style="background-color: #f9fafb;">
                  <td style="border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #1f2937;">
                    👤 Usuario Solicitante
                  </td>
                  <td style="border-bottom: 1px solid #e5e7eb; color: #374151;">
                    ID: ${oci.usuario_solicitante_id}
                  </td>
                </tr>
                <tr>
                  <td style="border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #1f2937; background-color: #f9fafb;">
                    📅 Fecha de Creación
                  </td>
                  <td style="border-bottom: 1px solid #e5e7eb; color: #374151;">
                    ${new Date(oci.fecha_creacion).toLocaleString('es-MX')}
                  </td>
                </tr>
                <tr style="background-color: #f9fafb;">
                  <td style="border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #1f2937;">
                    🔄 Estado
                  </td>
                  <td style="border-bottom: 1px solid #e5e7eb;">
                    <span style="display: inline-block; padding: 4px 12px; background-color: #fef3c7; color: #92400e; border-radius: 12px; font-size: 14px; font-weight: bold;">
                      ${oci.estado}
                    </span>
                  </td>
                </tr>
                ${oci.oc_mtk ? `
                <tr>
                  <td style="border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #1f2937; background-color: #f9fafb;">
                    📄 OC MTK
                  </td>
                  <td style="border-bottom: 1px solid #e5e7eb; color: #374151;">
                    ${oci.oc_mtk}
                  </td>
                </tr>
                ` : ''}
                ${oci.zor ? `
                <tr style="background-color: #f9fafb;">
                  <td style="border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #1f2937;">
                    📋 ZOR
                  </td>
                  <td style="border-bottom: 1px solid #e5e7eb; color: #374151;">
                    ${oci.zor}
                  </td>
                </tr>
                ` : ''}
                ${oci.observaciones ? `
                <tr>
                  <td style="font-weight: bold; color: #1f2937; background-color: #f9fafb; vertical-align: top;">
                    📝 Observaciones
                  </td>
                  <td style="color: #374151;">
                    ${oci.observaciones}
                  </td>
                </tr>
                ` : ''}
              </table>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Por favor, revisa esta orden en el sistema para su aprobación y seguimiento.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                Este es un correo automático del <strong>Sistema OCI PXG MÉXICO</strong>
              </p>
              <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 11px;">
                The Cloud ERP - Gestión y Control de Órdenes de Compra de Cartón
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

    // Enviar email usando Resend API
    console.log("📤 Enviando correo via Resend API...");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Control de Cartón <onboarding@resend.dev>",
        to: ["jcanett@pxg.com", "smexia@pxg.com"],
        subject: `🔔 Nueva OCI Creada: ${oci.numero_oci}`,
        html: emailHTML,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("❌ Error de Resend:", JSON.stringify(resendData, null, 2));
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Correo enviado exitosamente:", JSON.stringify(resendData, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        email_id: resendData.id,
        oci: oci.numero_oci
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Error en Edge Function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
