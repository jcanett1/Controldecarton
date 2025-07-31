from flask import Blueprint, request, jsonify
from src.models.almacen import db, ProductoCarton, Inventario
from datetime import datetime

inventario_bp = Blueprint('inventario', __name__)

@inventario_bp.route('/inventario', methods=['GET'])
def listar_inventario():
    """Listar inventario completo"""
    try:
        # Parámetros de filtro
        stock_bajo = request.args.get('stock_bajo', 'false').lower() == 'true'
        activos_solo = request.args.get('activos', 'true').lower() == 'true'
        
        query = db.session.query(Inventario).join(ProductoCarton)
        
        if activos_solo:
            query = query.filter(ProductoCarton.activo == True)
        
        if stock_bajo:
            query = query.filter(Inventario.cantidad_actual <= Inventario.cantidad_minima)
        
        inventarios = query.all()
        
        return jsonify({
            'success': True,
            'data': [inventario.to_dict() for inventario in inventarios],
            'total': len(inventarios)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@inventario_bp.route('/inventario/<int:producto_id>', methods=['GET'])
def obtener_inventario_producto(producto_id):
    """Obtener inventario de un producto específico"""
    try:
        inventario = Inventario.query.filter_by(producto_id=producto_id).first()
        
        if not inventario:
            return jsonify({
                'success': False,
                'error': 'Inventario no encontrado para este producto'
            }), 404
        
        return jsonify({
            'success': True,
            'data': inventario.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@inventario_bp.route('/inventario/numero-parte/<numero_parte>', methods=['GET'])
def obtener_inventario_por_numero_parte(numero_parte):
    """Obtener inventario por número de parte"""
    try:
        inventario = db.session.query(Inventario).join(ProductoCarton).filter(
            ProductoCarton.numero_parte == numero_parte
        ).first()
        
        if not inventario:
            return jsonify({
                'success': False,
                'error': 'Inventario no encontrado para este número de parte'
            }), 404
        
        return jsonify({
            'success': True,
            'data': inventario.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@inventario_bp.route('/inventario/<int:producto_id>', methods=['PUT'])
def actualizar_niveles_inventario(producto_id):
    """Actualizar niveles mínimos y máximos de inventario"""
    try:
        inventario = Inventario.query.filter_by(producto_id=producto_id).first()
        
        if not inventario:
            return jsonify({
                'success': False,
                'error': 'Inventario no encontrado para este producto'
            }), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No se proporcionaron datos'
            }), 400
        
        # Actualizar campos si se proporcionan
        if 'cantidad_minima' in data:
            if data['cantidad_minima'] < 0:
                return jsonify({
                    'success': False,
                    'error': 'La cantidad mínima no puede ser negativa'
                }), 400
            inventario.cantidad_minima = data['cantidad_minima']
        
        if 'cantidad_maxima' in data:
            if data['cantidad_maxima'] < 0:
                return jsonify({
                    'success': False,
                    'error': 'La cantidad máxima no puede ser negativa'
                }), 400
            inventario.cantidad_maxima = data['cantidad_maxima']
        
        # Validar que cantidad_minima <= cantidad_maxima
        if inventario.cantidad_minima > inventario.cantidad_maxima:
            return jsonify({
                'success': False,
                'error': 'La cantidad mínima no puede ser mayor que la cantidad máxima'
            }), 400
        
        inventario.ultima_actualizacion = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': inventario.to_dict(),
            'message': 'Niveles de inventario actualizados exitosamente'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@inventario_bp.route('/inventario/<int:producto_id>/ajuste', methods=['POST'])
def ajustar_inventario(producto_id):
    """Realizar ajuste manual de inventario"""
    try:
        inventario = Inventario.query.filter_by(producto_id=producto_id).first()
        
        if not inventario:
            return jsonify({
                'success': False,
                'error': 'Inventario no encontrado para este producto'
            }), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No se proporcionaron datos'
            }), 400
        
        if 'cantidad_nueva' not in data:
            return jsonify({
                'success': False,
                'error': 'La cantidad nueva es requerida'
            }), 400
        
        cantidad_nueva = data['cantidad_nueva']
        
        if cantidad_nueva < 0:
            return jsonify({
                'success': False,
                'error': 'La cantidad no puede ser negativa'
            }), 400
        
        cantidad_anterior = inventario.cantidad_actual
        inventario.cantidad_actual = cantidad_nueva
        inventario.ultima_actualizacion = datetime.utcnow()
        
        # Crear movimiento de ajuste
        from src.models.almacen import MovimientoInventario
        
        diferencia = cantidad_nueva - cantidad_anterior
        tipo_movimiento = 'ENTRADA' if diferencia > 0 else 'SALIDA'
        
        movimiento = MovimientoInventario(
            producto_id=producto_id,
            tipo_movimiento=tipo_movimiento,
            cantidad=abs(diferencia),
            motivo='Ajuste de inventario',
            usuario=data.get('usuario', 'Sistema'),
            observaciones=f"Ajuste manual: {cantidad_anterior} → {cantidad_nueva}. {data.get('observaciones', '')}"
        )
        
        db.session.add(movimiento)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': inventario.to_dict(),
            'movimiento': movimiento.to_dict(),
            'message': 'Ajuste de inventario realizado exitosamente'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@inventario_bp.route('/inventario/resumen', methods=['GET'])
def resumen_inventario():
    """Obtener resumen general del inventario"""
    try:
        # Estadísticas generales
        total_productos = db.session.query(ProductoCarton).filter_by(activo=True).count()
        
        inventarios = db.session.query(Inventario).join(ProductoCarton).filter(
            ProductoCarton.activo == True
        ).all()
        
        total_stock = sum(inv.cantidad_actual for inv in inventarios)
        productos_stock_bajo = sum(1 for inv in inventarios if inv.cantidad_actual <= inv.cantidad_minima)
        productos_sin_stock = sum(1 for inv in inventarios if inv.cantidad_actual == 0)
        
        valor_total_estimado = total_stock * 10  # Valor estimado por unidad
        
        return jsonify({
            'success': True,
            'data': {
                'total_productos': total_productos,
                'total_stock': total_stock,
                'productos_stock_bajo': productos_stock_bajo,
                'productos_sin_stock': productos_sin_stock,
                'valor_total_estimado': valor_total_estimado,
                'porcentaje_stock_bajo': round((productos_stock_bajo / total_productos * 100) if total_productos > 0 else 0, 2)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

