from flask import Blueprint, request, jsonify
from src.models.almacen import db, ProductoCarton, Inventario, MovimientoInventario
from datetime import datetime, timedelta
from sqlalchemy import and_, or_

movimientos_bp = Blueprint('movimientos', __name__)

@movimientos_bp.route('/movimientos', methods=['GET'])
def listar_movimientos():
    """Listar movimientos con filtros opcionales"""
    try:
        # Parámetros de filtro
        producto_id = request.args.get('producto_id', type=int)
        tipo_movimiento = request.args.get('tipo_movimiento')
        fecha_desde = request.args.get('fecha_desde')
        fecha_hasta = request.args.get('fecha_hasta')
        usuario = request.args.get('usuario')
        limite = request.args.get('limite', 100, type=int)
        pagina = request.args.get('pagina', 1, type=int)
        
        query = MovimientoInventario.query
        
        # Aplicar filtros
        if producto_id:
            query = query.filter(MovimientoInventario.producto_id == producto_id)
        
        if tipo_movimiento and tipo_movimiento.upper() in ['ENTRADA', 'SALIDA']:
            query = query.filter(MovimientoInventario.tipo_movimiento == tipo_movimiento.upper())
        
        if fecha_desde:
            try:
                fecha_desde_dt = datetime.fromisoformat(fecha_desde.replace('Z', '+00:00'))
                query = query.filter(MovimientoInventario.fecha_movimiento >= fecha_desde_dt)
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Formato de fecha_desde inválido. Use formato ISO 8601'
                }), 400
        
        if fecha_hasta:
            try:
                fecha_hasta_dt = datetime.fromisoformat(fecha_hasta.replace('Z', '+00:00'))
                query = query.filter(MovimientoInventario.fecha_movimiento <= fecha_hasta_dt)
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Formato de fecha_hasta inválido. Use formato ISO 8601'
                }), 400
        
        if usuario:
            query = query.filter(MovimientoInventario.usuario.ilike(f'%{usuario}%'))
        
        # Ordenar por fecha descendente
        query = query.order_by(MovimientoInventario.fecha_movimiento.desc())
        
        # Paginación
        offset = (pagina - 1) * limite
        movimientos = query.offset(offset).limit(limite).all()
        total = query.count()
        
        return jsonify({
            'success': True,
            'data': [movimiento.to_dict() for movimiento in movimientos],
            'total': total,
            'pagina': pagina,
            'limite': limite,
            'total_paginas': (total + limite - 1) // limite
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@movimientos_bp.route('/movimientos/<int:movimiento_id>', methods=['GET'])
def obtener_movimiento(movimiento_id):
    """Obtener un movimiento específico"""
    try:
        movimiento = MovimientoInventario.query.get(movimiento_id)
        
        if not movimiento:
            return jsonify({
                'success': False,
                'error': 'Movimiento no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'data': movimiento.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@movimientos_bp.route('/movimientos/entrada', methods=['POST'])
def registrar_entrada():
    """Registrar entrada de inventario"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No se proporcionaron datos'
            }), 400
        
        # Validar campos requeridos
        campos_requeridos = ['producto_id', 'cantidad']
        for campo in campos_requeridos:
            if campo not in data:
                return jsonify({
                    'success': False,
                    'error': f'El campo {campo} es requerido'
                }), 400
        
        producto_id = data['producto_id']
        cantidad = data['cantidad']
        
        if cantidad <= 0:
            return jsonify({
                'success': False,
                'error': 'La cantidad debe ser mayor a cero'
            }), 400
        
        # Verificar que el producto existe
        producto = ProductoCarton.query.get(producto_id)
        if not producto:
            return jsonify({
                'success': False,
                'error': 'Producto no encontrado'
            }), 404
        
        if not producto.activo:
            return jsonify({
                'success': False,
                'error': 'No se pueden registrar movimientos para productos inactivos'
            }), 400
        
        # Obtener inventario
        inventario = Inventario.query.filter_by(producto_id=producto_id).first()
        if not inventario:
            return jsonify({
                'success': False,
                'error': 'Inventario no encontrado para este producto'
            }), 404
        
        # Crear movimiento
        movimiento = MovimientoInventario(
            producto_id=producto_id,
            tipo_movimiento='ENTRADA',
            cantidad=cantidad,
            motivo=data.get('motivo', 'Entrada de inventario'),
            usuario=data.get('usuario', 'Sistema'),
            numero_documento=data.get('numero_documento'),
            observaciones=data.get('observaciones')
        )
        
        # Actualizar inventario
        inventario.cantidad_actual += cantidad
        inventario.ultima_actualizacion = datetime.utcnow()
        
        db.session.add(movimiento)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'movimiento': movimiento.to_dict(),
                'inventario': inventario.to_dict()
            },
            'message': 'Entrada registrada exitosamente'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@movimientos_bp.route('/movimientos/salida', methods=['POST'])
def registrar_salida():
    """Registrar salida de inventario"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No se proporcionaron datos'
            }), 400
        
        # Validar campos requeridos
        campos_requeridos = ['producto_id', 'cantidad']
        for campo in campos_requeridos:
            if campo not in data:
                return jsonify({
                    'success': False,
                    'error': f'El campo {campo} es requerido'
                }), 400
        
        producto_id = data['producto_id']
        cantidad = data['cantidad']
        
        if cantidad <= 0:
            return jsonify({
                'success': False,
                'error': 'La cantidad debe ser mayor a cero'
            }), 400
        
        # Verificar que el producto existe
        producto = ProductoCarton.query.get(producto_id)
        if not producto:
            return jsonify({
                'success': False,
                'error': 'Producto no encontrado'
            }), 404
        
        if not producto.activo:
            return jsonify({
                'success': False,
                'error': 'No se pueden registrar movimientos para productos inactivos'
            }), 400
        
        # Obtener inventario
        inventario = Inventario.query.filter_by(producto_id=producto_id).first()
        if not inventario:
            return jsonify({
                'success': False,
                'error': 'Inventario no encontrado para este producto'
            }), 404
        
        # Verificar stock suficiente
        if inventario.cantidad_actual < cantidad:
            return jsonify({
                'success': False,
                'error': f'Stock insuficiente. Disponible: {inventario.cantidad_actual}, Solicitado: {cantidad}'
            }), 400
        
        # Crear movimiento
        movimiento = MovimientoInventario(
            producto_id=producto_id,
            tipo_movimiento='SALIDA',
            cantidad=cantidad,
            motivo=data.get('motivo', 'Salida de inventario'),
            usuario=data.get('usuario', 'Sistema'),
            numero_documento=data.get('numero_documento'),
            observaciones=data.get('observaciones')
        )
        
        # Actualizar inventario
        inventario.cantidad_actual -= cantidad
        inventario.ultima_actualizacion = datetime.utcnow()
        
        db.session.add(movimiento)
        db.session.commit()
        
        # Verificar si queda stock bajo
        alerta_stock_bajo = inventario.cantidad_actual <= inventario.cantidad_minima
        
        response_data = {
            'movimiento': movimiento.to_dict(),
            'inventario': inventario.to_dict()
        }
        
        if alerta_stock_bajo:
            response_data['alerta'] = 'Stock bajo: La cantidad actual está por debajo del mínimo recomendado'
        
        return jsonify({
            'success': True,
            'data': response_data,
            'message': 'Salida registrada exitosamente'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@movimientos_bp.route('/movimientos/lote', methods=['POST'])
def registrar_movimientos_lote():
    """Registrar múltiples movimientos en lote"""
    try:
        data = request.get_json()
        
        if not data or 'movimientos' not in data:
            return jsonify({
                'success': False,
                'error': 'Se requiere una lista de movimientos'
            }), 400
        
        movimientos_data = data['movimientos']
        
        if not isinstance(movimientos_data, list) or len(movimientos_data) == 0:
            return jsonify({
                'success': False,
                'error': 'La lista de movimientos no puede estar vacía'
            }), 400
        
        movimientos_creados = []
        inventarios_actualizados = []
        errores = []
        
        for i, mov_data in enumerate(movimientos_data):
            try:
                # Validar campos requeridos
                if 'producto_id' not in mov_data or 'cantidad' not in mov_data or 'tipo_movimiento' not in mov_data:
                    errores.append(f"Movimiento {i+1}: Faltan campos requeridos")
                    continue
                
                producto_id = mov_data['producto_id']
                cantidad = mov_data['cantidad']
                tipo_movimiento = mov_data['tipo_movimiento'].upper()
                
                if tipo_movimiento not in ['ENTRADA', 'SALIDA']:
                    errores.append(f"Movimiento {i+1}: Tipo de movimiento inválido")
                    continue
                
                if cantidad <= 0:
                    errores.append(f"Movimiento {i+1}: La cantidad debe ser mayor a cero")
                    continue
                
                # Verificar producto
                producto = ProductoCarton.query.get(producto_id)
                if not producto or not producto.activo:
                    errores.append(f"Movimiento {i+1}: Producto no encontrado o inactivo")
                    continue
                
                # Obtener inventario
                inventario = Inventario.query.filter_by(producto_id=producto_id).first()
                if not inventario:
                    errores.append(f"Movimiento {i+1}: Inventario no encontrado")
                    continue
                
                # Verificar stock para salidas
                if tipo_movimiento == 'SALIDA' and inventario.cantidad_actual < cantidad:
                    errores.append(f"Movimiento {i+1}: Stock insuficiente")
                    continue
                
                # Crear movimiento
                movimiento = MovimientoInventario(
                    producto_id=producto_id,
                    tipo_movimiento=tipo_movimiento,
                    cantidad=cantidad,
                    motivo=mov_data.get('motivo', f'{tipo_movimiento.lower()} de inventario'),
                    usuario=mov_data.get('usuario', data.get('usuario_global', 'Sistema')),
                    numero_documento=mov_data.get('numero_documento'),
                    observaciones=mov_data.get('observaciones')
                )
                
                # Actualizar inventario
                if tipo_movimiento == 'ENTRADA':
                    inventario.cantidad_actual += cantidad
                else:  # SALIDA
                    inventario.cantidad_actual -= cantidad
                
                inventario.ultima_actualizacion = datetime.utcnow()
                
                db.session.add(movimiento)
                movimientos_creados.append(movimiento)
                
                if inventario not in inventarios_actualizados:
                    inventarios_actualizados.append(inventario)
                
            except Exception as e:
                errores.append(f"Movimiento {i+1}: {str(e)}")
        
        if errores and len(movimientos_creados) == 0:
            return jsonify({
                'success': False,
                'error': 'No se pudo procesar ningún movimiento',
                'errores': errores
            }), 400
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'movimientos_procesados': len(movimientos_creados),
                'movimientos': [mov.to_dict() for mov in movimientos_creados],
                'inventarios_actualizados': [inv.to_dict() for inv in inventarios_actualizados]
            },
            'errores': errores if errores else None,
            'message': f'Se procesaron {len(movimientos_creados)} movimientos exitosamente'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

