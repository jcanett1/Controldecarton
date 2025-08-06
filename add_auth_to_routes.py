"""
Script para agregar decoradores de autenticación a todas las rutas existentes
"""

import os
import re

def add_auth_to_file(file_path, admin_routes=None, viewer_routes=None):
    """Agregar decoradores de autenticación a un archivo de rutas"""
    
    if admin_routes is None:
        admin_routes = ['POST', 'PUT', 'DELETE']
    
    if viewer_routes is None:
        viewer_routes = ['GET']
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Agregar imports si no existen
    if 'from src.auth import' not in content:
        # Buscar la línea de imports de Flask
        flask_import_pattern = r'from flask import.*'
        flask_import_match = re.search(flask_import_pattern, content)
        
        if flask_import_match:
            # Agregar import después de los imports de Flask
            auth_import = '\nfrom src.auth import token_required, admin_required, viewer_or_admin_required'
            content = content.replace(flask_import_match.group(), flask_import_match.group() + auth_import)
    
    # Buscar todas las rutas y agregar decoradores
    route_pattern = r'@\w+_bp\.route\([^)]+\)\s*\ndef\s+(\w+)\([^)]*\):'
    
    def replace_route(match):
        route_line = match.group(0)
        function_name = match.group(1)
        
        # Determinar el método HTTP de la ruta
        method_match = re.search(r"methods=\['([^']+)'\]", route_line)
        if method_match:
            method = method_match.group(1)
        else:
            method = 'GET'  # Por defecto GET
        
        # Determinar qué decoradores agregar
        decorators = ['@token_required']
        
        if method in admin_routes:
            decorators.append('@admin_required')
        else:
            decorators.append('@viewer_or_admin_required')
        
        # Verificar si ya tiene decoradores de auth
        if '@token_required' in route_line:
            return route_line
        
        # Agregar decoradores
        new_decorators = '\n'.join(decorators)
        return route_line.replace(f'def {function_name}(', f'{new_decorators}\ndef {function_name}(')
    
    # Aplicar reemplazos
    content = re.sub(route_pattern, replace_route, content)
    
    # Escribir archivo actualizado
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Autenticación agregada a: {file_path}")

def main():
    """Agregar autenticación a todas las rutas"""
    
    routes_dir = 'src/routes'
    route_files = [
        'productos.py',
        'inventario.py', 
        'movimientos.py',
        'reportes.py'
    ]
    
    for file_name in route_files:
        file_path = os.path.join(routes_dir, file_name)
        if os.path.exists(file_path):
            print(f"🔒 Agregando autenticación a {file_name}...")
            add_auth_to_file(file_path)
        else:
            print(f"❌ Archivo no encontrado: {file_path}")
    
    print("\n🎉 Proceso completado!")
    print("\n📋 Resumen de permisos:")
    print("• GET (Lectura): Requiere rol 'viewer' o 'admin'")
    print("• POST/PUT/DELETE (Escritura): Requiere rol 'admin'")

if __name__ == "__main__":
    main()
