"""
Rutas de autenticación para el sistema de almacén de cartón
"""

from flask import Blueprint, request, jsonify
from src.auth import auth, token_required, admin_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Registrar nuevo usuario"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['email', 'password', 'full_name']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'message': f'Campo requerido: {field}'
                }), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        full_name = data['full_name'].strip()
        role = data.get('role', 'viewer')  # Por defecto viewer
        
        # Validar longitud de contraseña
        if len(password) < 6:
            return jsonify({
                'success': False,
                'message': 'La contraseña debe tener al menos 6 caracteres'
            }), 400
        
        # Registrar usuario
        result = auth.register_user(email, password, full_name, role)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error interno del servidor: {str(e)}'
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Iniciar sesión"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Email y contraseña son requeridos'
            }), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Autenticar usuario
        result = auth.login_user(email, password)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 401
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error interno del servidor: {str(e)}'
        }), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    """Obtener información del usuario actual"""
    try:
        return jsonify({
            'success': True,
            'user': request.current_user
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error interno del servidor: {str(e)}'
        }), 500

@auth_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def list_users():
    """Listar todos los usuarios (solo admin)"""
    try:
        result = auth.list_users()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error interno del servidor: {str(e)}'
        }), 500

@auth_bp.route('/users/<user_id>/role', methods=['PUT'])
@token_required
@admin_required
def update_user_role(user_id):
    """Actualizar rol de usuario (solo admin)"""
    try:
        data = request.get_json()
        
        if not data.get('role'):
            return jsonify({
                'success': False,
                'message': 'Rol es requerido'
            }), 400
        
        new_role = data['role']
        
        # Validar que no se esté modificando a sí mismo
        if user_id == request.current_user['id']:
            return jsonify({
                'success': False,
                'message': 'No puedes modificar tu propio rol'
            }), 400
        
        result = auth.update_user_role(user_id, new_role)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error interno del servidor: {str(e)}'
        }), 500

@auth_bp.route('/users/<user_id>/deactivate', methods=['PUT'])
@token_required
@admin_required
def deactivate_user(user_id):
    """Desactivar usuario (solo admin)"""
    try:
        # Validar que no se esté desactivando a sí mismo
        if user_id == request.current_user['id']:
            return jsonify({
                'success': False,
                'message': 'No puedes desactivar tu propia cuenta'
            }), 400
        
        result = auth.deactivate_user(user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error interno del servidor: {str(e)}'
        }), 500

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """Verificar si un token es válido"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({
                'success': False,
                'message': 'Token requerido'
            }), 400
        
        # Verificar token
        payload = auth.verify_jwt_token(token)
        user_result = auth.get_user_by_id(payload['user_id'])
        
        if user_result['success']:
            return jsonify({
                'success': True,
                'valid': True,
                'user': user_result['user']
            }), 200
        else:
            return jsonify({
                'success': False,
                'valid': False,
                'message': 'Token inválido'
            }), 401
            
    except Exception as e:
        return jsonify({
            'success': False,
            'valid': False,
            'message': str(e)
        }), 401

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """Cerrar sesión (invalidar token del lado del cliente)"""
    try:
        return jsonify({
            'success': True,
            'message': 'Sesión cerrada exitosamente'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error interno del servidor: {str(e)}'
        }), 500
