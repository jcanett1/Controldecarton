"""
Configuración de Supabase para el Sistema de Almacén de Cartón
============================================================

Este archivo contiene la configuración necesaria para conectar
la aplicación Flask con la base de datos PostgreSQL de Supabase.
"""

import os
from urllib.parse import urlparse

class SupabaseConfig:
    """Configuración de conexión a Supabase"""
    
    # URL y credenciales de Supabase
    SUPABASE_URL = "https://bdrxcilsuxbkpmolfbgu.supabase.co"
    SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcnhjaWxzdXhia3Btb2xmYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNTQ0NTcsImV4cCI6MjA2OTgzMDQ1N30.iSO9EoOMEoi_VARxPqMd2yMUvQvTmKJntxJvwAl-TVs"
    
    # Configuración de la base de datos PostgreSQL
    # Supabase usa PostgreSQL en el puerto 5432
    DB_HOST = "db.bdrxcilsuxbkpmolfbgu.supabase.co"
    DB_PORT = "5432"
    DB_NAME = "postgres"
    DB_USER = "postgres"
    
    # La contraseña debe ser configurada en las variables de entorno
    # o solicitada al usuario (por seguridad)
    DB_PASSWORD = os.getenv('Edel1ewy.', '')
    
    @classmethod
    def get_database_url(cls, password=None):
        """
        Genera la URL de conexión a PostgreSQL
        
        Args:
            password (str): Contraseña de la base de datos
            
        Returns:
            str: URL de conexión PostgreSQL
        """
        if password:
            cls.DB_PASSWORD = password
            
        if not cls.DB_PASSWORD:
            raise ValueError("Se requiere la contraseña de la base de datos. "
                           "Configúrala en la variable de entorno SUPABASE_DB_PASSWORD "
                           "o pásala como parámetro.")
        
        return f"postgresql://{cls.DB_USER}:{cls.DB_PASSWORD}@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"
    
    @classmethod
    def get_supabase_client_config(cls):
        """
        Obtiene la configuración para el cliente de Supabase
        
        Returns:
            dict: Configuración del cliente
        """
        return {
            "url": cls.SUPABASE_URL,
            "key": cls.SUPABASE_ANON_KEY
        }

class FlaskSupabaseConfig:
    """Configuración de Flask para usar con Supabase"""
    
    SECRET_KEY = os.getenv('SECRET_KEY', 'almacen_carton_supabase_secret_key_2024')
    
    # Configuración de SQLAlchemy para PostgreSQL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'connect_args': {
            'sslmode': 'require'  # Supabase requiere SSL
        }
    }
    
    @classmethod
    def configure_database(cls, password=None):
        """
        Configura la URL de la base de datos
        
        Args:
            password (str): Contraseña de la base de datos
        """
        cls.SQLALCHEMY_DATABASE_URI = SupabaseConfig.get_database_url(password)

# Configuración para desarrollo local (opcional)
class DevelopmentConfig(FlaskSupabaseConfig):
    """Configuración para desarrollo"""
    DEBUG = True
    TESTING = False

# Configuración para producción
class ProductionConfig(FlaskSupabaseConfig):
    """Configuración para producción"""
    DEBUG = False
    TESTING = False

# Configuración por defecto
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
