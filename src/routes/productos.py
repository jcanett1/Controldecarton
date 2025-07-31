from flask import Blueprint, request, jsonify
from src.models.almacen import db, ProductoCarton, Inventario
from datetime import datetime

productos_bp = Blueprint('productos', __name__)

@productos_bp.route('/productos', methods=['GET'])
def listar_productos():
    """Listar todos los productos de cartón"""
    try:
        activos_solo = request.args.get('activos', 'true').lower() == 'true'
        
        if activos_solo:
            productos = ProductoCarton.query.filter_by(activo=True).all()
        else:
            productos = ProductoCarton.query.all()
        
        return jsonify({
            'success': True,
            'data': [producto.to_dict() for producto in productos],
            'total': len(productos)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@productos_bp.route('/productos/<int:producto_id>', methods=['GET'])
def obtener_producto(producto_id):
    """Obtener un producto específico por ID"""
    try:
        producto = ProductoCarton.query.get(producto_id)
        
        if not producto:
            return jsonify({
                'success': False,
                'error': 'Producto no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'data': producto.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@productos_bp.route('/productos/numero-parte/<numero_parte>', methods=['GET'])
def obtener_producto_por_numero_parte(numero_parte):
    """Obtener un producto específico por número de parte"""
    try:
        producto = ProductoCarton.query.filter_by(numero_parte=numero_parte).first()
        
        if not producto:
            return jsonify({
                'success': False,
                'error': 'Producto no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'data': producto.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@productos_bp.route('/productos', methods=['POST'])
def crear_producto():
    """Crear un nuevo producto de cartón"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No se proporcionaron datos'
            }), 400
        
        # Validar campos requeridos
        if not data.get('numero_parte'):
            return jsonify({
                'success': False,
                'error': 'El número de parte es requerido'
            }), 400
        
        if not data.get('descripcion'):
            return jsonify({
                'success': False,
                'error': 'La descripción es requerida'
            }), 400
        
        # Verificar que el número de parte no exista
        producto_existente = ProductoCarton.query.filter_by(numero_parte=data['numero_parte']).first()
        if producto_existente:
            return jsonify({
                'success': False,
                'error': 'Ya existe un producto con ese número de parte'
            }), 400
        
        # Crear nuevo producto
        producto = ProductoCarton(
            numero_parte=data['numero_parte'],
            descripcion=data['descripcion'],
            activo=data.get('activo', True)
        )
        
        db.session.add(producto)
        db.session.flush()  # Para obtener el ID
        
        # Crear registro de inventario inicial
        inventario = Inventario(
            producto_id=producto.id,
            cantidad_actual=data.get('cantidad_inicial', 0),
            cantidad_minima=data.get('cantidad_minima', 10),
            cantidad_maxima=data.get('cantidad_maxima', 1000)
        )
        
        db.session.add(inventario)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': producto.to_dict(),
            'message': 'Producto creado exitosamente'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@productos_bp.route('/productos/<int:producto_id>', methods=['PUT'])
def actualizar_producto(producto_id):
    """Actualizar un producto existente"""
    try:
        producto = ProductoCarton.query.get(producto_id)
        
        if not producto:
            return jsonify({
                'success': False,
                'error': 'Producto no encontrado'
            }), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No se proporcionaron datos'
            }), 400
        
        # Actualizar campos si se proporcionan
        if 'numero_parte' in data:
            # Verificar que el nuevo número de parte no exista en otro producto
            producto_existente = ProductoCarton.query.filter(
                ProductoCarton.numero_parte == data['numero_parte'],
                ProductoCarton.id != producto_id
            ).first()
            
            if producto_existente:
                return jsonify({
                    'success': False,
                    'error': 'Ya existe otro producto con ese número de parte'
                }), 400
            
            producto.numero_parte = data['numero_parte']
        
        if 'descripcion' in data:
            producto.descripcion = data['descripcion']
        
        if 'activo' in data:
            producto.activo = data['activo']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': producto.to_dict(),
            'message': 'Producto actualizado exitosamente'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@productos_bp.route('/productos/<int:producto_id>', methods=['DELETE'])
def eliminar_producto(producto_id):
    """Eliminar un producto (marcarlo como inactivo)"""
    try:
        producto = ProductoCarton.query.get(producto_id)
        
        if not producto:
            return jsonify({
                'success': False,
                'error': 'Producto no encontrado'
            }), 404
        
        # En lugar de eliminar físicamente, marcamos como inactivo
        producto.activo = False
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Producto marcado como inactivo exitosamente'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@productos_bp.route('/productos/<int:producto_id>/activar', methods=['PUT'])
def activar_producto(producto_id):
    """Reactivar un producto"""
    try:
        producto = ProductoCarton.query.get(producto_id)
        
        if not producto:
            return jsonify({
                'success': False,
                'error': 'Producto no encontrado'
            }), 404
        
        producto.activo = True
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': producto.to_dict(),
            'message': 'Producto reactivado exitosamente'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

