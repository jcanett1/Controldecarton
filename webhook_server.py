#!/usr/bin/env python3
"""
Servidor Flask para recibir webhooks de Supabase y enviar notificaciones por correo
cuando se crea una nueva orden de compra.

Autor: IT Tequila
Sistema: OCI PXG México
"""

from flask import Flask, request, jsonify
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os
import logging

app = Flask(__name__)

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuración de correo
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', 'tu_correo@gmail.com')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', 'tu_password_app')
FROM_EMAIL = SMTP_USERNAME
TO_EMAILS = ['jcanett@pxg.com', 'smexia@pxg.com']

def enviar_correo_nueva_oci(orden_data):
    """
    Envía un correo electrónico notificando la creación de una nueva OCI.
    
    Args:
        orden_data (dict): Datos de la orden de compra
    """
    try:
        # Extraer información de la orden
        numero_oci = orden_data.get('numero_oci', 'N/A')
        material_numero = orden_data.get('material_numero', 'N/A')
        cantidad_total = orden_data.get('cantidad_total_piezas', 0)
        usuario_id = orden_data.get('usuario_solicitante_id', 'N/A')
        fecha_creacion = orden_data.get('fecha_creacion', datetime.now().isoformat())
        estado = orden_data.get('estado', 'PENDIENTE')
        
        # Formatear fecha
        try:
            fecha_obj = datetime.fromisoformat(fecha_creacion.replace('Z', '+00:00'))
            fecha_formateada = fecha_obj.strftime('%d/%m/%Y %H:%M:%S')
        except:
            fecha_formateada = fecha_creacion
        
        # Crear mensaje HTML
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2d2d2d 100%);
                    border-radius: 10px;
                }}
                .header {{
                    background: linear-gradient(90deg, #000000 0%, #1a1a1a 100%);
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 24px;
                }}
                .header p {{
                    margin: 5px 0 0 0;
                    font-size: 14px;
                    color: #ccc;
                }}
                .content {{
                    background: white;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }}
                .info-box {{
                    background: #f8fafc;
                    border-left: 4px solid #0078d4;
                    padding: 15px;
                    margin: 15px 0;
                    border-radius: 5px;
                }}
                .info-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #e5e7eb;
                }}
                .info-row:last-child {{
                    border-bottom: none;
                }}
                .info-label {{
                    font-weight: bold;
                    color: #374151;
                }}
                .info-value {{
                    color: #1f2937;
                }}
                .badge {{
                    display: inline-block;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                }}
                .badge-pendiente {{
                    background: #fef3c7;
                    color: #92400e;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    font-size: 12px;
                    color: #6b7280;
                }}
                .alert {{
                    background: #dbeafe;
                    border-left: 4px solid #2563eb;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 5px;
                }}
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
                            <span class="info-value"><strong>{numero_oci}</strong></span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Material:</span>
                            <span class="info-value">{material_numero}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Cantidad Total:</span>
                            <span class="info-value"><strong>{cantidad_total:,} piezas</strong></span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Usuario Solicitante:</span>
                            <span class="info-value">ID: {usuario_id}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Fecha de Creación:</span>
                            <span class="info-value">{fecha_formateada}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Estado:</span>
                            <span class="info-value">
                                <span class="badge badge-pendiente">{estado}</span>
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
        """
        
        # Crear mensaje
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'🔔 Nueva OCI Creada: {numero_oci}'
        msg['From'] = FROM_EMAIL
        msg['To'] = ', '.join(TO_EMAILS)
        
        # Adjuntar HTML
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Enviar correo
        logger.info(f"Enviando correo para OCI {numero_oci}...")
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"✅ Correo enviado exitosamente para OCI {numero_oci}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error enviando correo: {str(e)}")
        return False


@app.route('/webhook/nueva-oci', methods=['POST'])
def webhook_nueva_oci():
    """
    Endpoint para recibir webhooks de Supabase cuando se crea una nueva OCI.
    """
    try:
        # Obtener datos del webhook
        data = request.get_json()
        logger.info(f"📥 Webhook recibido: {data}")
        
        # Validar que sea un INSERT
        if data.get('type') != 'INSERT':
            logger.info(f"⚠️ Tipo de evento ignorado: {data.get('type')}")
            return jsonify({'status': 'ignored', 'message': 'Solo se procesan eventos INSERT'}), 200
        
        # Obtener datos de la nueva orden
        orden_data = data.get('record', {})
        
        if not orden_data:
            logger.warning("⚠️ No se encontraron datos de la orden")
            return jsonify({'status': 'error', 'message': 'No se encontraron datos'}), 400
        
        # Enviar correo
        resultado = enviar_correo_nueva_oci(orden_data)
        
        if resultado:
            return jsonify({
                'status': 'success',
                'message': 'Correo enviado exitosamente',
                'oci': orden_data.get('numero_oci')
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': 'Error al enviar correo'
            }), 500
            
    except Exception as e:
        logger.error(f"❌ Error procesando webhook: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """
    Endpoint para verificar que el servidor está funcionando.
    """
    return jsonify({
        'status': 'healthy',
        'service': 'OCI Webhook Server',
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/', methods=['GET'])
def index():
    """
    Página de inicio con información del servidor.
    """
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>OCI Webhook Server</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2d2d2d 100%);
                color: white;
            }
            .container {
                background: white;
                color: #333;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            h1 { color: #0078d4; }
            .endpoint {
                background: #f8fafc;
                padding: 15px;
                margin: 10px 0;
                border-left: 4px solid #0078d4;
                border-radius: 5px;
            }
            code {
                background: #1a1a1a;
                color: #00ff00;
                padding: 2px 6px;
                border-radius: 3px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 OCI Webhook Server</h1>
            <p><strong>Sistema OCI PXG México</strong></p>
            <p>Servidor de webhooks para notificaciones de órdenes de compra</p>
            
            <h2>📡 Endpoints Disponibles:</h2>
            
            <div class="endpoint">
                <strong>POST /webhook/nueva-oci</strong><br>
                Recibe notificaciones de nuevas órdenes de compra desde Supabase
            </div>
            
            <div class="endpoint">
                <strong>GET /health</strong><br>
                Verifica el estado del servidor
            </div>
            
            <h2>✉️ Destinatarios de Correo:</h2>
            <ul>
                <li>jcanett@pxg.com</li>
                <li>smexia@pxg.com</li>
            </ul>
            
            <h2>📋 Información Incluida:</h2>
            <ul>
                <li>Número de OCI</li>
                <li>Material</li>
                <li>Cantidad Total</li>
                <li>Usuario Solicitante</li>
                <li>Fecha de Creación</li>
                <li>Estado</li>
            </ul>
            
            <hr>
            <p style="text-align: center; color: #6b7280; font-size: 14px;">
                Creado por IT Tequila | Soporte: jcanett@pxg.com
            </p>
        </div>
    </body>
    </html>
    """


if __name__ == '__main__':
    # Verificar variables de entorno
    if SMTP_USERNAME == 'tu_correo@gmail.com':
        logger.warning("⚠️ ADVERTENCIA: Configura las variables de entorno SMTP_USERNAME y SMTP_PASSWORD")
    
    # Iniciar servidor
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"🚀 Iniciando servidor en puerto {port}...")
    logger.info(f"📧 Correos destino: {', '.join(TO_EMAILS)}")
    app.run(host='0.0.0.0', port=port, debug=False)
