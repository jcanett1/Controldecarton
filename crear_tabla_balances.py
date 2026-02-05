#!/usr/bin/env python3
"""
Script para crear la tabla balances_veritiv en Supabase
"""
import os
from supabase import create_client

# Configuración de Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://bdrxcilsuxbkpmolfbgu.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcnhjaWxzdXhia3Btb2xmYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNTQ0NTcsImV4cCI6MjA2OTgzMDQ1N30.iSO9EoOMEoi_VARxPqMd2yMUvQvTmKJntxJvwAl-TVs')

def crear_tabla_balances():
    """Crear la tabla balances_veritiv en Supabase"""
    try:
        # Crear cliente de Supabase
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
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
        
        -- Crear índices para mejorar el rendimiento
        CREATE INDEX IF NOT EXISTS idx_balances_orden_compra ON balances_veritiv(orden_compra);
        CREATE INDEX IF NOT EXISTS idx_balances_producto_id ON balances_veritiv(producto_id);
        CREATE INDEX IF NOT EXISTS idx_balances_fecha_orden ON balances_veritiv(fecha_orden_compra);
        
        -- Trigger para actualizar fecha_actualizacion automáticamente
        CREATE OR REPLACE FUNCTION update_balances_veritiv_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS trigger_update_balances_timestamp ON balances_veritiv;
        CREATE TRIGGER trigger_update_balances_timestamp
        BEFORE UPDATE ON balances_veritiv
        FOR EACH ROW
        EXECUTE FUNCTION update_balances_veritiv_timestamp();
        """
        
        # Ejecutar el SQL usando RPC (necesitamos usar la API REST directamente)
        print("🔄 Creando tabla balances_veritiv en Supabase...")
        
        # Nota: La API de Python de Supabase no soporta directamente DDL
        # Necesitamos usar el cliente de PostgreSQL o la interfaz web
        print("⚠️  Para crear la tabla, necesitas ejecutar el siguiente SQL en el SQL Editor de Supabase:")
        print("\n" + "="*80)
        print(sql_create_table)
        print("="*80 + "\n")
        
        # Verificar si la tabla existe intentando hacer una consulta
        try:
            result = supabase.table('balances_veritiv').select('*').limit(1).execute()
            print("✅ La tabla balances_veritiv ya existe en la base de datos")
            return True
        except Exception as e:
            if 'relation "public.balances_veritiv" does not exist' in str(e):
                print("❌ La tabla balances_veritiv NO existe. Por favor, ejecuta el SQL anterior en Supabase.")
                return False
            else:
                print(f"⚠️  Error verificando tabla: {e}")
                return False
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    crear_tabla_balances()
