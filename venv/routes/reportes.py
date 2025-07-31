from flask import Blueprint, request, jsonify
from src.models.almacen import db, ProductoCarton, Inventario, MovimientoInventario
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_, desc

reportes_bp = Blueprint('reportes', __name__)

@reportes_bp.route('/reportes/stock-bajo', methods=['GET'])
def reporte_stock_bajo():
    """Reporte de productos con stock bajo"""
    try:
        # Obtener productos con stock bajo o sin stock
        inventarios_stock_bajo = db.session.query(Inventario).join(ProductoCarton).filter(
            and_(
                ProductoCarton.activo == True,
                Inventario.cantidad_actual <= Inventario.cantidad_minima
            )
        ).all()
        
        productos_sin_stock = [inv for inv in inventarios_stock_bajo if inv.cantidad_actual == 0]
        productos_stock_critico = [inv for inv in inventarios_stock_bajo if 0 < inv.cantidad_actual <= inv.cantidad_minima]
        
        return jsonify({
            'success': True,
            'data': {
                'resumen': {
                    'total_productos_stock_bajo': len(inventarios_stock_bajo),
                    'productos_sin_stock': len(productos_sin_stock),
                    'productos_stock_critico': len(productos_stock_critico)
                },
                'productos_sin_stock': [inv.to_dict() for inv in productos_sin_stock],
                'productos_stock_critico': [inv.to_dict() for inv in productos_stock_critico],
                'todos_stock_bajo': [inv.to_dict() for inv in inventarios_stock_bajo]
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reportes_bp.route('/reportes/movimientos-periodo', methods=['GET'])
def reporte_movimientos_periodo():
    """Reporte de movimientos en un período específico"""
    try:
        # Parámetros
        fecha_desde = request.args.get('fecha_desde')
        fecha_hasta = request.args.get('fecha_hasta')
        
        if not fecha_desde or not fecha_hasta:
            return jsonify({
                'success': False,
                'error': 'Se requieren fecha_desde y fecha_hasta'
            }), 400
        
        try:
            fecha_desde_dt = datetime.fromisoformat(fecha_desde.replace('Z', '+00:00'))
            fecha_hasta_dt = datetime.fromisoformat(fecha_hasta.replace('Z', '+00:00'))
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Formato de fecha inválido. Use formato ISO 8601'
            }), 400
        
        # Consultar movimientos en el período
        movimientos = MovimientoInventario.query.filter(
            and_(
                MovimientoInventario.fecha_movimiento >= fecha_desde_dt,
                MovimientoInventario.fecha_movimiento <= fecha_hasta_dt
            )
        ).order_by(desc(MovimientoInventario.fecha_movimiento)).all()
        
        # Estadísticas del período
        total_entradas = sum(mov.cantidad for mov in movimientos if mov.tipo_movimiento == 'ENTRADA')
        total_salidas = sum(mov.cantidad for mov in movimientos if mov.tipo_movimiento == 'SALIDA')
        
        entradas_count = len([mov for mov in movimientos if mov.tipo_movimiento == 'ENTRADA'])
        salidas_count = len([mov for mov in movimientos if mov.tipo_movimiento == 'SALIDA'])
        
        # Productos más movidos
        productos_movimientos = {}
        for mov in movimientos:
            if mov.producto_id not in productos_movimientos:
                productos_movimientos[mov.producto_id] = {
                    'producto': mov.producto.to_dict(),
                    'total_movimientos': 0,
                    'total_entradas': 0,
                    'total_salidas': 0
                }
            
            productos_movimientos[mov.producto_id]['total_movimientos'] += 1
            if mov.tipo_movimiento == 'ENTRADA':
                productos_movimientos[mov.producto_id]['total_entradas'] += mov.cantidad
            else:
                productos_movimientos[mov.producto_id]['total_salidas'] += mov.cantidad
        
        productos_mas_movidos = sorted(
            productos_movimientos.values(),
            key=lambda x: x['total_movimientos'],
            reverse=True
        )[:10]
        
        return jsonify({
            'success': True,
            'data': {
                'periodo': {
                    'fecha_desde': fecha_desde,
                    'fecha_hasta': fecha_hasta
                },
                'resumen': {
                    'total_movimientos': len(movimientos),
                    'total_entradas_cantidad': total_entradas,
                    'total_salidas_cantidad': total_salidas,
                    'total_entradas_transacciones': entradas_count,
                    'total_salidas_transacciones': salidas_count,
                    'balance_neto': total_entradas - total_salidas
                },
                'productos_mas_movidos': productos_mas_movidos,
                'movimientos': [mov.to_dict() for mov in movimientos]
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reportes_bp.route('/reportes/resumen-inventario', methods=['GET'])
def reporte_resumen_inventario():
    """Reporte de resumen general del inventario"""
    try:
        # Estadísticas generales
        total_productos_activos = ProductoCarton.query.filter_by(activo=True).count()
        total_productos_inactivos = ProductoCarton.query.filter_by(activo=False).count()
        
        inventarios = db.session.query(Inventario).join(ProductoCarton).filter(
            ProductoCarton.activo == True
        ).all()
        
        total_stock = sum(inv.cantidad_actual for inv in inventarios)
        productos_stock_bajo = [inv for inv in inventarios if inv.cantidad_actual <= inv.cantidad_minima]
        productos_sin_stock = [inv for inv in inventarios if inv.cantidad_actual == 0]
        productos_stock_alto = [inv for inv in inventarios if inv.cantidad_actual >= inv.cantidad_maxima * 0.8]
        
        # Valor estimado del inventario (asumiendo $10 por unidad)
        valor_total_estimado = total_stock * 10
        
        # Productos con mayor stock
        productos_mayor_stock = sorted(inventarios, key=lambda x: x.cantidad_actual, reverse=True)[:10]
        
        # Movimientos recientes (últimos 30 días)
        fecha_limite = datetime.utcnow() - timedelta(days=30)
        movimientos_recientes = MovimientoInventario.query.filter(
            MovimientoInventario.fecha_movimiento >= fecha_limite
        ).count()
        
        # Distribución por rangos de stock
        rangos_stock = {
            'sin_stock': 0,
            'stock_bajo': 0,
            'stock_normal': 0,
            'stock_alto': 0
        }
        
        for inv in inventarios:
            if inv.cantidad_actual == 0:
                rangos_stock['sin_stock'] += 1
            elif inv.cantidad_actual <= inv.cantidad_minima:
                rangos_stock['stock_bajo'] += 1
            elif inv.cantidad_actual >= inv.cantidad_maxima * 0.8:
                rangos_stock['stock_alto'] += 1
            else:
                rangos_stock['stock_normal'] += 1
        
        return jsonify({
            'success': True,
            'data': {
                'resumen_general': {
                    'total_productos_activos': total_productos_activos,
                    'total_productos_inactivos': total_productos_inactivos,
                    'total_stock': total_stock,
                    'valor_total_estimado': valor_total_estimado,
                    'movimientos_ultimos_30_dias': movimientos_recientes
                },
                'alertas': {
                    'productos_sin_stock': len(productos_sin_stock),
                    'productos_stock_bajo': len(productos_stock_bajo),
                    'productos_stock_alto': len(productos_stock_alto),
                    'porcentaje_stock_bajo': round((len(productos_stock_bajo) / total_productos_activos * 100) if total_productos_activos > 0 else 0, 2)
                },
                'distribucion_stock': rangos_stock,
                'productos_mayor_stock': [inv.to_dict() for inv in productos_mayor_stock],
                'productos_sin_stock': [inv.to_dict() for inv in productos_sin_stock],
                'productos_stock_bajo': [inv.to_dict() for inv in productos_stock_bajo]
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reportes_bp.route('/reportes/productos-mas-activos', methods=['GET'])
def reporte_productos_mas_activos():
    """Reporte de productos con más movimientos"""
    try:
        dias = request.args.get('dias', 30, type=int)
        limite = request.args.get('limite', 20, type=int)
        
        fecha_limite = datetime.utcnow() - timedelta(days=dias)
        
        # Consulta para obtener productos con más movimientos
        productos_activos = db.session.query(
            MovimientoInventario.producto_id,
            func.count(MovimientoInventario.id).label('total_movimientos'),
            func.sum(func.case([(MovimientoInventario.tipo_movimiento == 'ENTRADA', MovimientoInventario.cantidad)], else_=0)).label('total_entradas'),
            func.sum(func.case([(MovimientoInventario.tipo_movimiento == 'SALIDA', MovimientoInventario.cantidad)], else_=0)).label('total_salidas')
        ).filter(
            MovimientoInventario.fecha_movimiento >= fecha_limite
        ).group_by(
            MovimientoInventario.producto_id
        ).order_by(
            desc('total_movimientos')
        ).limit(limite).all()
        
        # Obtener información completa de los productos
        resultado = []
        for producto_stat in productos_activos:
            producto = ProductoCarton.query.get(producto_stat.producto_id)
            inventario = Inventario.query.filter_by(producto_id=producto_stat.producto_id).first()
            
            if producto:
                resultado.append({
                    'producto': producto.to_dict(),
                    'inventario_actual': inventario.to_dict() if inventario else None,
                    'estadisticas': {
                        'total_movimientos': producto_stat.total_movimientos,
                        'total_entradas': int(producto_stat.total_entradas or 0),
                        'total_salidas': int(producto_stat.total_salidas or 0),
                        'balance_neto': int((producto_stat.total_entradas or 0) - (producto_stat.total_salidas or 0))
                    }
                })
        
        return jsonify({
            'success': True,
            'data': {
                'periodo_dias': dias,
                'productos_mas_activos': resultado
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reportes_bp.route('/reportes/tendencias-stock', methods=['GET'])
def reporte_tendencias_stock():
    """Reporte de tendencias de stock por producto"""
    try:
        producto_id = request.args.get('producto_id', type=int)
        dias = request.args.get('dias', 30, type=int)
        
        if not producto_id:
            return jsonify({
                'success': False,
                'error': 'Se requiere producto_id'
            }), 400
        
        producto = ProductoCarton.query.get(producto_id)
        if not producto:
            return jsonify({
                'success': False,
                'error': 'Producto no encontrado'
            }), 404
        
        fecha_limite = datetime.utcnow() - timedelta(days=dias)
        
        # Obtener movimientos del producto en el período
        movimientos = MovimientoInventario.query.filter(
            and_(
                MovimientoInventario.producto_id == producto_id,
                MovimientoInventario.fecha_movimiento >= fecha_limite
            )
        ).order_by(MovimientoInventario.fecha_movimiento).all()
        
        # Calcular stock histórico
        inventario_actual = Inventario.query.filter_by(producto_id=producto_id).first()
        stock_actual = inventario_actual.cantidad_actual if inventario_actual else 0
        
        # Reconstruir historial de stock
        historial_stock = []
        stock_temporal = stock_actual
        
        # Trabajar hacia atrás desde el stock actual
        for mov in reversed(movimientos):
            if mov.tipo_movimiento == 'ENTRADA':
                stock_temporal -= mov.cantidad
            else:  # SALIDA
                stock_temporal += mov.cantidad
            
            historial_stock.insert(0, {
                'fecha': mov.fecha_movimiento.isoformat(),
                'stock_antes': stock_temporal,
                'movimiento': mov.to_dict(),
                'stock_despues': stock_temporal + (mov.cantidad if mov.tipo_movimiento == 'ENTRADA' else -mov.cantidad)
            })
        
        # Estadísticas del período
        total_entradas = sum(mov.cantidad for mov in movimientos if mov.tipo_movimiento == 'ENTRADA')
        total_salidas = sum(mov.cantidad for mov in movimientos if mov.tipo_movimiento == 'SALIDA')
        
        return jsonify({
            'success': True,
            'data': {
                'producto': producto.to_dict(),
                'inventario_actual': inventario_actual.to_dict() if inventario_actual else None,
                'periodo_dias': dias,
                'estadisticas_periodo': {
                    'total_movimientos': len(movimientos),
                    'total_entradas': total_entradas,
                    'total_salidas': total_salidas,
                    'balance_neto': total_entradas - total_salidas
                },
                'historial_stock': historial_stock
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

