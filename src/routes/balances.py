from flask import Blueprint, request, jsonify
from datetime import datetime
from src.models.almacen import db
from src.models.balance import BalanceVeritiv
from src.models.almacen import ProductoCarton

balances_bp = Blueprint('balances', __name__)

@balances_bp.route('/balances', methods=['GET'])
def obtener_balances():
    """
    Obtener todos los balances con filtros opcionales
    Query params:
    - orden_compra: Filtrar por orden de compra
    - fecha_desde: Filtrar por fecha desde
    - fecha_hasta: Filtrar por fecha hasta
    - producto_id: Filtrar por producto
    """
    try:
        query = BalanceVeritiv.query.filter_by(activo=True)
        
        # Aplicar filtros
        orden_compra = request.args.get('orden_compra')
        if orden_compra:
            query = query.filter(BalanceVeritiv.orden_compra.ilike(f'%{orden_compra}%'))
        
        fecha_desde = request.args.get('fecha_desde')
        if fecha_desde:
            query = query.filter(BalanceVeritiv.fecha_orden_compra >= datetime.strptime(fecha_desde, '%Y-%m-%d').date())
        
        fecha_hasta = request.args.get('fecha_hasta')
        if fecha_hasta:
            query = query.filter(BalanceVeritiv.fecha_orden_compra <= datetime.strptime(fecha_hasta, '%Y-%m-%d').date())
        
        producto_id = request.args.get('producto_id')
        if producto_id:
            query = query.filter_by(producto_id=int(producto_id))
        
        # Ordenar por fecha de creación descendente
        balances = query.order_by(BalanceVeritiv.fecha_creacion.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [balance.to_dict() for balance in balances],
            'count': len(balances)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@balances_bp.route('/balances/<int:balance_id>', methods=['GET'])
def obtener_balance(balance_id):
    """Obtener un balance específico por ID"""
    try:
        balance = BalanceVeritiv.query.get(balance_id)
        
        if not balance:
            return jsonify({
                'success': False,
                'error': 'Balance no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'data': balance.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@balances_bp.route('/balances', methods=['POST'])
def crear_balance():
    """Crear un nuevo balance"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        campos_requeridos = ['orden_compra', 'fecha_orden_compra', 'material_carton', 'balance']
        for campo in campos_requeridos:
            if campo not in data:
                return jsonify({
                    'success': False,
                    'error': f'Campo requerido faltante: {campo}'
                }), 400
        
        # Validar que el producto existe si se proporciona
        if 'producto_id' in data and data['producto_id']:
            producto = ProductoCarton.query.get(data['producto_id'])
            if not producto:
                return jsonify({
                    'success': False,
                    'error': 'Producto no encontrado'
                }), 404
        
        # Convertir fecha de string a date
        fecha_orden = datetime.strptime(data['fecha_orden_compra'], '%Y-%m-%d').date()
        
        # Crear nuevo balance
        nuevo_balance = BalanceVeritiv(
            orden_compra=data['orden_compra'],
            fecha_orden_compra=fecha_orden,
            producto_id=data.get('producto_id'),
            material_carton=data['material_carton'],
            balance=float(data['balance'])
        )
        
        db.session.add(nuevo_balance)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Balance creado exitosamente',
            'data': nuevo_balance.to_dict()
        }), 201
        
    except ValueError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error de formato en los datos: {str(e)}'
        }), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@balances_bp.route('/balances/<int:balance_id>', methods=['PUT'])
def actualizar_balance(balance_id):
    """Actualizar un balance existente"""
    try:
        balance = BalanceVeritiv.query.get(balance_id)
        
        if not balance:
            return jsonify({
                'success': False,
                'error': 'Balance no encontrado'
            }), 404
        
        data = request.get_json()
        
        # Actualizar campos si están presentes
        if 'orden_compra' in data:
            balance.orden_compra = data['orden_compra']
        
        if 'fecha_orden_compra' in data:
            balance.fecha_orden_compra = datetime.strptime(data['fecha_orden_compra'], '%Y-%m-%d').date()
        
        if 'producto_id' in data:
            if data['producto_id']:
                producto = ProductoCarton.query.get(data['producto_id'])
                if not producto:
                    return jsonify({
                        'success': False,
                        'error': 'Producto no encontrado'
                    }), 404
            balance.producto_id = data['producto_id']
        
        if 'material_carton' in data:
            balance.material_carton = data['material_carton']
        
        if 'balance' in data:
            balance.balance = float(data['balance'])
        
        if 'activo' in data:
            balance.activo = data['activo']
        
        balance.fecha_actualizacion = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Balance actualizado exitosamente',
            'data': balance.to_dict()
        }), 200
        
    except ValueError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error de formato en los datos: {str(e)}'
        }), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@balances_bp.route('/balances/<int:balance_id>', methods=['DELETE'])
def eliminar_balance(balance_id):
    """Eliminar un balance (soft delete)"""
    try:
        balance = BalanceVeritiv.query.get(balance_id)
        
        if not balance:
            return jsonify({
                'success': False,
                'error': 'Balance no encontrado'
            }), 404
        
        # Soft delete
        balance.activo = False
        balance.fecha_actualizacion = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Balance eliminado exitosamente'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@balances_bp.route('/balances/estadisticas', methods=['GET'])
def obtener_estadisticas():
    """Obtener estadísticas de balances"""
    try:
        total_balances = BalanceVeritiv.query.filter_by(activo=True).count()
        
        # Suma total de balances
        suma_total = db.session.query(
            db.func.sum(BalanceVeritiv.balance)
        ).filter_by(activo=True).scalar() or 0
        
        # Balances por mes actual
        fecha_actual = datetime.utcnow()
        balances_mes = BalanceVeritiv.query.filter(
            BalanceVeritiv.activo == True,
            db.extract('month', BalanceVeritiv.fecha_creacion) == fecha_actual.month,
            db.extract('year', BalanceVeritiv.fecha_creacion) == fecha_actual.year
        ).count()
        
        return jsonify({
            'success': True,
            'data': {
                'total_balances': total_balances,
                'suma_total': float(suma_total),
                'balances_mes_actual': balances_mes
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
