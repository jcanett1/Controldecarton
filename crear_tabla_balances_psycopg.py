#!/usr/bin/env python3
"""
Script para crear la tabla balances_veritiv en Supabase usando psycopg2
"""
import os
import psycopg2
from psycopg2 import sql

# Configuración de conexión a Supabase PostgreSQL
# Formato: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
DB_HOST = "db.bdrxcilsuxbkpmolfbgu.supabase.co"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASSWORD = "Edel1ewy."  # La contraseña del proyecto
DB_PORT = 5432

def crear_tabla_balances():
    """Crear la tabla balances_veritiv en Supabase"""
    conn = None
    cursor = None
    
    try:
        # Conectar a la base de datos
        print("🔄 Conectando a Supabase PostgreSQL...")
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            sslmode='require'
        )
        
        cursor = conn.cursor()
        print("✅ Conexión establecida")
        
        # SQL para crear la tabla
        sql_create_table = """
        CREATE TABLE IF NOT EXISTS balances_veritiv (
            id SERIAL PRIMARY KEY,
            orden_compra VARCHAR(100) NOT NULL,
            fecha_orden_compra DATE NOT NULL,
            producto_id INTEGER REFERENCES productos_carton(id) ON DELETE CASCADE,
            material_carton VARCHAR(255) NOT NULL,
            balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            activo BOOLEAN DEFAULT TRUE
        );
        """
        
        print("🔄 Creando tabla balances_veritiv...")
        cursor.execute(sql_create_table)
        
        # Crear índices
        print("🔄 Creando índices...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_balances_orden_compra 
            ON balances_veritiv(orden_compra);
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_balances_producto_id 
            ON balances_veritiv(producto_id);
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_balances_fecha_orden 
            ON balances_veritiv(fecha_orden_compra);
        """)
        
        # Crear función y trigger para actualización automática
        print("🔄 Creando trigger para actualización automática...")
        cursor.execute("""
            CREATE OR REPLACE FUNCTION update_balances_veritiv_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """)
        
        cursor.execute("""
            DROP TRIGGER IF EXISTS trigger_update_balances_timestamp ON balances_veritiv;
        """)
        
        cursor.execute("""
            CREATE TRIGGER trigger_update_balances_timestamp
            BEFORE UPDATE ON balances_veritiv
            FOR EACH ROW
            EXECUTE FUNCTION update_balances_veritiv_timestamp();
        """)
        
        # Confirmar cambios
        conn.commit()
        print("✅ Tabla balances_veritiv creada exitosamente")
        print("✅ Índices creados")
        print("✅ Trigger de actualización configurado")
        
        # Verificar la tabla
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'balances_veritiv'
            ORDER BY ordinal_position;
        """)
        
        print("\n📋 Estructura de la tabla balances_veritiv:")
        print("-" * 60)
        for row in cursor.fetchall():
            print(f"  {row[0]:<25} {row[1]:<20} NULL: {row[2]}")
        print("-" * 60)
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Error de PostgreSQL: {e}")
        if conn:
            conn.rollback()
        return False
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if conn:
            conn.rollback()
        return False
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            print("\n🔌 Conexión cerrada")

if __name__ == '__main__':
    crear_tabla_balances()
