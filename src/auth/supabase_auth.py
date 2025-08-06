"""
Módulo de autenticación con Supabase
Maneja registro, login, roles y verificación de tokens
"""

import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

class SupabaseAuth:
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')
        self.jwt_secret = os.getenv('JWT_SECRET_KEY')
        self.jwt_algorithm = os.getenv('JWT_ALGORITHM', 'HS256')
        self.jwt_expiration_hours = int(os.getenv('JWT_EXPIRATION_HOURS', 24))
        
        # Inicializar cliente de Supabase
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
    
    def hash_password(self, password: str) -> str:
        """Hashear contraseña usando bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verificar contraseña hasheada"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def generate_jwt_token(self, user_data: dict) -> str:
        """Generar token JWT para el usuario"""
        payload = {
            'user_id': user_data['id'],
            'email': user_data['email'],
            'role': user_data['role'],
            'exp': datetime.utcnow() + timedelta(hours=self.jwt_expiration_hours),
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)
        return token
    
    def verify_jwt_token(self, token: str) -> dict:
        """Verificar y decodificar token JWT"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise Exception('Token expirado')
        except jwt.InvalidTokenError:
            raise Exception('Token inválido')
    
    def register_user(self, email: str, password: str, full_name: str, role: str = 'viewer') -> dict:
        """Registrar nuevo usuario en Supabase"""
        try:
            # Validar rol
            if role not in ['admin', 'viewer']:
                raise Exception('Rol inválido. Debe ser "admin" o "viewer"')
            
            # Hashear contraseña
            hashed_password = self.hash_password(password)
            
            # Insertar usuario en la tabla users
            user_data = {
                'email': email,
                'password_hash': hashed_password,
                'full_name': full_name,
                'role': role,
                'active': True,
                'created_at': datetime.utcnow().isoformat(),
                'last_login': None
            }
            
            result = self.supabase.table('users').insert(user_data).execute()
            
            if result.data:
                user = result.data[0]
                # Generar token JWT
                token = self.generate_jwt_token(user)
                
                return {
                    'success': True,
                    'message': 'Usuario registrado exitosamente',
                    'user': {
                        'id': user['id'],
                        'email': user['email'],
                        'full_name': user['full_name'],
                        'role': user['role']
                    },
                    'token': token
                }
            else:
                raise Exception('Error al crear usuario')
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Error al registrar usuario: {str(e)}'
            }
    
    def login_user(self, email: str, password: str) -> dict:
        """Autenticar usuario"""
        try:
            # Buscar usuario por email
            result = self.supabase.table('users').select('*').eq('email', email).eq('active', True).execute()
            
            if not result.data:
                raise Exception('Usuario no encontrado o inactivo')
            
            user = result.data[0]
            
            # Verificar contraseña
            if not self.verify_password(password, user['password_hash']):
                raise Exception('Contraseña incorrecta')
            
            # Actualizar último login
            self.supabase.table('users').update({
                'last_login': datetime.utcnow().isoformat()
            }).eq('id', user['id']).execute()
            
            # Generar token JWT
            token = self.generate_jwt_token(user)
            
            return {
                'success': True,
                'message': 'Login exitoso',
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'full_name': user['full_name'],
                    'role': user['role']
                },
                'token': token
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'Error en login: {str(e)}'
            }
    
    def get_user_by_id(self, user_id: str) -> dict:
        """Obtener usuario por ID (UUID)"""
        try:
            result = self.supabase.table('users').select('id, email, full_name, role, active, created_at, last_login').eq('id', user_id).eq('active', True).execute()
            
            if result.data:
                return {
                    'success': True,
                    'user': result.data[0]
                }
            else:
                return {
                    'success': False,
                    'message': 'Usuario no encontrado'
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Error al obtener usuario: {str(e)}'
            }
    
    def update_user_role(self, user_id: str, new_role: str) -> dict:
        """Actualizar rol de usuario (solo admin)"""
        try:
            if new_role not in ['admin', 'viewer']:
                raise Exception('Rol inválido')
            
            result = self.supabase.table('users').update({
                'role': new_role
            }).eq('id', user_id).execute()
            
            if result.data:
                return {
                    'success': True,
                    'message': 'Rol actualizado exitosamente'
                }
            else:
                raise Exception('Usuario no encontrado')
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Error al actualizar rol: {str(e)}'
            }
    
    def deactivate_user(self, user_id: str) -> dict:
        """Desactivar usuario"""
        try:
            result = self.supabase.table('users').update({
                'active': False
            }).eq('id', user_id).execute()
            
            if result.data:
                return {
                    'success': True,
                    'message': 'Usuario desactivado exitosamente'
                }
            else:
                raise Exception('Usuario no encontrado')
                
        except Exception as e:
            return {
                'success': False,
                'message': f'Error al desactivar usuario: {str(e)}'
            }
    
    def list_users(self) -> dict:
        """Listar todos los usuarios (solo admin)"""
        try:
            result = self.supabase.table('users').select('id, email, full_name, role, active, created_at, last_login').order('created_at', desc=True).execute()
            
            return {
                'success': True,
                'users': result.data
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'Error al listar usuarios: {str(e)}'
            }

# Instancia global de autenticación
auth = SupabaseAuth()

# Decoradores para proteger rutas
def token_required(f):
    """Decorador para requerir token JWT válido"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Buscar token en headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'message': 'Formato de token inválido'}), 401
        
        if not token:
            return jsonify({'message': 'Token requerido'}), 401
        
        try:
            # Verificar token
            payload = auth.verify_jwt_token(token)
            current_user = auth.get_user_by_id(payload['user_id'])
            
            if not current_user['success']:
                return jsonify({'message': 'Usuario no válido'}), 401
            
            # Agregar usuario actual al contexto
            request.current_user = current_user['user']
            
        except Exception as e:
            return jsonify({'message': str(e)}), 401
        
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    """Decorador para requerir rol de administrador"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'current_user'):
            return jsonify({'message': 'Usuario no autenticado'}), 401
        
        if request.current_user['role'] != 'admin':
            return jsonify({'message': 'Permisos de administrador requeridos'}), 403
        
        return f(*args, **kwargs)
    
    return decorated

def viewer_or_admin_required(f):
    """Decorador para requerir rol de viewer o admin"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'current_user'):
            return jsonify({'message': 'Usuario no autenticado'}), 401
        
        if request.current_user['role'] not in ['admin', 'viewer']:
            return jsonify({'message': 'Permisos insuficientes'}), 403
        
        return f(*args, **kwargs)
    
    return decorated
