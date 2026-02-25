#!/usr/bin/env python3
"""
Script de prueba para verificar el envío de correos con el servidor SMTP interno PXG.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Configuración SMTP interno PXG
SMTP_SERVER = "10.232.237.25"
SMTP_PORT = 25
FROM_EMAIL = "controlcarton@pxg.com"
TO_EMAILS = ["jcanett@pxg.com", "smexia@pxg.com"]

def test_enviar_correo():
    """
    Envía un correo de prueba para verificar la configuración SMTP.
    """
    try:
        print("=" * 60)
        print("🧪 PRUEBA DE ENVÍO DE CORREO")
        print("=" * 60)
        print(f"📧 Servidor SMTP: {SMTP_SERVER}:{SMTP_PORT}")
        print(f"📤 Remitente: {FROM_EMAIL}")
        print(f"📥 Destinatarios: {', '.join(TO_EMAILS)}")
        print(f"🔒 Autenticación: Desactivada (servidor interno)")
        print("=" * 60)
        
        # Crear mensaje HTML de prueba
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
                .content {{
                    background: white;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }}
                .alert {{
                    background: #dcfce7;
                    border-left: 4px solid #16a34a;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 5px;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    font-size: 12px;
                    color: #6b7280;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Prueba de Correo Exitosa</h1>
                    <p>Sistema OCI PXG México</p>
                </div>
                <div class="content">
                    <div class="alert">
                        <strong>🎉 ¡El sistema de notificaciones está funcionando correctamente!</strong>
                    </div>
                    
                    <p>Este es un correo de prueba para verificar que el servidor SMTP interno está configurado correctamente.</p>
                    
                    <h3>📋 Información de la Prueba:</h3>
                    <ul>
                        <li><strong>Servidor SMTP:</strong> {SMTP_SERVER}:{SMTP_PORT}</li>
                        <li><strong>Remitente:</strong> {FROM_EMAIL}</li>
                        <li><strong>Fecha:</strong> {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</li>
                        <li><strong>Autenticación:</strong> Desactivada (servidor interno)</li>
                    </ul>
                    
                    <p>Si recibes este correo, significa que:</p>
                    <ul>
                        <li>✅ El servidor webhook está funcionando</li>
                        <li>✅ La configuración SMTP es correcta</li>
                        <li>✅ Los correos se envían desde controlcarton@pxg.com</li>
                        <li>✅ El sistema está listo para notificaciones de OCIs</li>
                    </ul>
                    
                    <div class="footer">
                        <p><strong>Sistema OCI PXG MÉXICO</strong></p>
                        <p>Creado por IT Tequila</p>
                        <p>Soporte: <a href="mailto:jcanett@pxg.com">jcanett@pxg.com</a></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Crear mensaje
        msg = MIMEMultipart('alternative')
        msg['Subject'] = '✅ Prueba de Correo - Sistema OCI PXG'
        msg['From'] = FROM_EMAIL
        msg['To'] = ', '.join(TO_EMAILS)
        
        # Adjuntar HTML
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Enviar correo
        print("\n📤 Conectando al servidor SMTP...")
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            print("✅ Conexión establecida")
            print("📧 Enviando correo...")
            server.send_message(msg)
            print("✅ Correo enviado exitosamente")
        
        print("\n" + "=" * 60)
        print("🎉 PRUEBA COMPLETADA EXITOSAMENTE")
        print("=" * 60)
        print(f"\n📥 Revisa tu bandeja de entrada en:")
        for email in TO_EMAILS:
            print(f"   - {email}")
        print(f"\n📧 Asunto: ✅ Prueba de Correo - Sistema OCI PXG")
        print("\n" + "=" * 60)
        
        return True
        
    except Exception as e:
        print("\n" + "=" * 60)
        print("❌ ERROR EN LA PRUEBA")
        print("=" * 60)
        print(f"Error: {str(e)}")
        print("\nPosibles causas:")
        print("  1. El servidor SMTP no es accesible desde esta red")
        print("  2. El puerto 25 está bloqueado")
        print("  3. La dirección IP del servidor es incorrecta")
        print("  4. El correo remitente no está autorizado")
        print("\n" + "=" * 60)
        return False


if __name__ == "__main__":
    test_enviar_correo()
