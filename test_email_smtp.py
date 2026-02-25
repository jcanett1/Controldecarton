#!/usr/bin/env python3
"""
Script de prueba para envío de correos con servidor SMTP PXG
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración SMTP
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.yamww.internal')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', 'controlcarton@pxg.com')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
FROM_EMAIL = os.getenv('FROM_EMAIL', 'controlcarton@pxg.com')
DESTINOS = os.getenv('DESTINOS', 'jcanett@pxg.com,smexia@pxg.com').split(',')

print("=" * 60)
print("🧪 PRUEBA DE ENVÍO DE CORREO - Sistema OCI PXG")
print("=" * 60)
print(f"\n📧 Configuración SMTP:")
print(f"   Host: {SMTP_HOST}")
print(f"   Puerto: {SMTP_PORT}")
print(f"   Usuario: {SMTP_USERNAME}")
print(f"   Remitente: {FROM_EMAIL}")
print(f"   Destinatarios: {', '.join(DESTINOS)}")
print(f"\n⏰ Fecha/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
print("\n" + "=" * 60)

# Crear mensaje de prueba
msg = MIMEMultipart('alternative')
msg['Subject'] = '🧪 Prueba de Notificaciones - Sistema OCI PXG'
msg['From'] = FROM_EMAIL
msg['To'] = ', '.join(DESTINOS)

# HTML del correo de prueba
html_content = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            color: white;
            padding: 30px;
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
            opacity: 0.9;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
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
        .info-box {
            background: white;
            border: 1px solid #dee2e6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .info-box h3 {
            margin: 0 0 15px 0;
            color: #000000;
            font-size: 16px;
        }
        .info-item {
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #f1f3f5;
        }
        .info-item:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: #495057;
            display: inline-block;
            width: 150px;
        }
        .info-value {
            color: #212529;
        }
        .success {
            background: #d4edda;
            border-left: 4px solid #28a745;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            color: #155724;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #dee2e6;
            color: #6c757d;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔔 Sistema de Notificaciones OCI</h1>
        <p>Gestión y Control de Órdenes de Compra de Cartón</p>
        <p>The Cloud ERP - PXG México</p>
    </div>
    
    <div class="content">
        <div class="alert">
            <h2>🧪 Correo de Prueba</h2>
            <p>Este es un correo de prueba para verificar que el sistema de notificaciones está funcionando correctamente.</p>
        </div>
        
        <div class="info-box">
            <h3>📋 Información de la Prueba</h3>
            <div class="info-item">
                <span class="info-label">Servidor SMTP:</span>
                <span class="info-value">""" + SMTP_HOST + """</span>
            </div>
            <div class="info-item">
                <span class="info-label">Puerto:</span>
                <span class="info-value">""" + str(SMTP_PORT) + """</span>
            </div>
            <div class="info-item">
                <span class="info-label">Remitente:</span>
                <span class="info-value">""" + FROM_EMAIL + """</span>
            </div>
            <div class="info-item">
                <span class="info-label">Fecha/Hora:</span>
                <span class="info-value">""" + datetime.now().strftime('%d/%m/%Y %H:%M:%S') + """</span>
            </div>
        </div>
        
        <div class="success">
            <strong>✅ ¡Configuración Exitosa!</strong><br>
            Si recibes este correo, significa que el sistema de notificaciones está funcionando correctamente y recibirás alertas automáticas cada vez que se cree una nueva orden de compra.
        </div>
        
        <p style="margin-top: 20px; color: #6c757d; font-size: 14px;">
            <strong>💡 Próximos pasos:</strong><br>
            • Configurar el webhook en Supabase<br>
            • Crear una OCI de prueba en el sistema<br>
            • Verificar que llegue la notificación automática
        </p>
    </div>
    
    <div class="footer">
        <p><strong>Sistema OCI PXG MÉXICO</strong></p>
        <p>Creado por IT Tequila</p>
        <p>Soporte: jcanett@pxg.com</p>
    </div>
</body>
</html>
"""

# Adjuntar HTML
html_part = MIMEText(html_content, 'html')
msg.attach(html_part)

# Intentar enviar correo
print("\n📤 Intentando enviar correo de prueba...")
print("-" * 60)

try:
    print(f"🔌 Conectando a {SMTP_HOST}:{SMTP_PORT}...")
    
    # Crear conexión SMTP
    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
    server.set_debuglevel(1)  # Mostrar debug
    
    print("🔐 Iniciando sesión...")
    server.login(SMTP_USERNAME, SMTP_PASSWORD)
    
    print("📧 Enviando correo...")
    server.sendmail(FROM_EMAIL, DESTINOS, msg.as_string())
    
    print("🔌 Cerrando conexión...")
    server.quit()
    
    print("\n" + "=" * 60)
    print("✅ ¡CORREO ENVIADO EXITOSAMENTE!")
    print("=" * 60)
    print(f"\n📬 Revisa tu bandeja de entrada en:")
    for email in DESTINOS:
        print(f"   • {email}")
    print("\n💡 Si no lo ves, revisa la carpeta de SPAM/Correo no deseado")
    print("\n" + "=" * 60)
    
except smtplib.SMTPAuthenticationError as e:
    print("\n" + "=" * 60)
    print("❌ ERROR DE AUTENTICACIÓN")
    print("=" * 60)
    print(f"\n{str(e)}")
    print("\n💡 Posibles soluciones:")
    print("   • Verifica que el usuario y contraseña sean correctos")
    print("   • Verifica que la cuenta esté activa")
    print("   • Verifica que el servidor SMTP permita autenticación")
    
except smtplib.SMTPConnectError as e:
    print("\n" + "=" * 60)
    print("❌ ERROR DE CONEXIÓN")
    print("=" * 60)
    print(f"\n{str(e)}")
    print("\n💡 Posibles soluciones:")
    print("   • Verifica que el host y puerto sean correctos")
    print("   • Verifica que el servidor SMTP esté accesible")
    print("   • Verifica que no haya firewall bloqueando el puerto")
    
except Exception as e:
    print("\n" + "=" * 60)
    print("❌ ERROR INESPERADO")
    print("=" * 60)
    print(f"\nTipo: {type(e).__name__}")
    print(f"Mensaje: {str(e)}")
    print("\n💡 Revisa los logs para más detalles")
    
print("\n" + "=" * 60)
