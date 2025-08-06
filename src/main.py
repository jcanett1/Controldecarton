import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.almacen import db
from src.routes.productos import productos_bp
from src.routes.inventario import inventario_bp
from src.routes.movimientos import movimientos_bp
from src.routes.reportes import reportes_bp
from src.routes.auth_routes import auth_bp
from src.config.supabase_config import FlaskSupabaseConfig

def create_app(config_name='default'):
    """
    Factory function para crear la aplicación Flask
    
    Args:
        config_name (str): Nombre de la configuración a usar
        
    Returns:
        Flask: Aplicación Flask configurada
    """
    app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
    
    # Configurar la aplicación
    if config_name == 'supabase':
        # Configuración para Supabase
        password = os.getenv('SUPABASE_DB_PASSWORD')
        if not password:
            raise ValueError("Se requiere la variable de entorno SUPABASE_DB_PASSWORD")
        
        FlaskSupabaseConfig.configure_database(password)
        app.config.from_object(FlaskSupabaseConfig)
        print("🌐 Configuración: Usando Supabase PostgreSQL")
    else:
        # Configuración SQLite local (fallback)
        app.config['SECRET_KEY'] = 'almacen_carton_secret_key_2024'
        app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        print("💾 Configuración: Usando SQLite local")
    
    # Habilitar CORS para todas las rutas
    CORS(app)
    
    # Registrar blueprints
    app.register_blueprint(productos_bp, url_prefix='/api')
    app.register_blueprint(inventario_bp, url_prefix='/api')
    app.register_blueprint(movimientos_bp, url_prefix='/api')
    app.register_blueprint(reportes_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # Inicializar base de datos
    db.init_app(app)
    
    # Crear tablas si no existen
    with app.app_context():
        try:
            db.create_all()
            print("✅ Tablas de base de datos verificadas/creadas")
        except Exception as e:
            print(f"⚠️ Error creando tablas: {e}")
    
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        """Servir archivos estáticos y SPA"""
        static_folder_path = app.static_folder
        if static_folder_path is None:
            return "Static folder not configured", 404

        if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
            return send_from_directory(static_folder_path, path)
        else:
            index_path = os.path.join(static_folder_path, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(static_folder_path, 'index.html')
            else:
                return "index.html not found", 404
    
    @app.route('/health')
    def health_check():
        """Endpoint de verificación de salud"""
        try:
            # Probar conexión a la base de datos
            db.session.execute(db.text('SELECT 1'))
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"
        
        return {
            "status": "healthy",
            "database": db_status,
            "config": "supabase" if os.getenv('USE_SUPABASE') == 'True' else "sqlite"
        }
    
    return app

def main():
    """Función principal para ejecutar la aplicación"""
    # Determinar configuración basada en variables de entorno
    use_supabase = os.getenv('USE_SUPABASE', 'False').lower() == 'true'
    config_name = 'supabase' if use_supabase else 'default'
    
    try:
        app = create_app(config_name)
        
        # Configuración del servidor
        host = os.getenv('FLASK_HOST', '0.0.0.0')
        port = int(os.getenv('FLASK_PORT', 5001))
        debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
        
        print(f"""
🚀 Iniciando Sistema de Almacén de Cartón
📊 Base de datos: {'Supabase PostgreSQL' if use_supabase else 'SQLite Local'}
🌐 Servidor: http://{host}:{port}
🔧 Debug: {'Activado' if debug else 'Desactivado'}
        """)
        
        app.run(host=host, port=port, debug=debug)
        
    except Exception as e:
        print(f"❌ Error iniciando la aplicación: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()

# Crear la aplicación Flask para el despliegue
app = create_app()
