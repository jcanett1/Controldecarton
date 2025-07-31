from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class ProductoCarton(db.Model):
    __tablename__ = 'productos_carton'
    
    id = db.Column(db.Integer, primary_key=True)
    numero_parte = db.Column(db.String(20), unique=True, nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    activo = db.Column(db.Boolean, default=True)
    
    # Relaciones
    inventario = db.relationship('Inventario', backref='producto', uselist=False, cascade='all, delete-orphan')
    movimientos = db.relationship('MovimientoInventario', backref='producto', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<ProductoCarton {self.numero_parte}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'numero_parte': self.numero_parte,
            'descripcion': self.descripcion,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'activo': self.activo
        }

class Inventario(db.Model):
    __tablename__ = 'inventario'
    
    id = db.Column(db.Integer, primary_key=True)
    producto_id = db.Column(db.Integer, db.ForeignKey('productos_carton.id'), nullable=False)
    cantidad_actual = db.Column(db.Integer, default=0)
    cantidad_minima = db.Column(db.Integer, default=0)
    cantidad_maxima = db.Column(db.Integer, default=1000)
    ultima_actualizacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Inventario producto_id={self.producto_id} cantidad={self.cantidad_actual}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'producto_id': self.producto_id,
            'producto': self.producto.to_dict() if self.producto else None,
            'cantidad_actual': self.cantidad_actual,
            'cantidad_minima': self.cantidad_minima,
            'cantidad_maxima': self.cantidad_maxima,
            'ultima_actualizacion': self.ultima_actualizacion.isoformat() if self.ultima_actualizacion else None,
            'stock_bajo': self.cantidad_actual <= self.cantidad_minima
        }

class MovimientoInventario(db.Model):
    __tablename__ = 'movimientos_inventario'
    
    id = db.Column(db.Integer, primary_key=True)
    producto_id = db.Column(db.Integer, db.ForeignKey('productos_carton.id'), nullable=False)
    tipo_movimiento = db.Column(db.String(10), nullable=False)  # 'ENTRADA' o 'SALIDA'
    cantidad = db.Column(db.Integer, nullable=False)
    motivo = db.Column(db.Text)
    usuario = db.Column(db.String(100))
    fecha_movimiento = db.Column(db.DateTime, default=datetime.utcnow)
    numero_documento = db.Column(db.String(50))
    observaciones = db.Column(db.Text)
    
    __table_args__ = (
        db.CheckConstraint("tipo_movimiento IN ('ENTRADA', 'SALIDA')", name='check_tipo_movimiento'),
    )
    
    def __repr__(self):
        return f'<MovimientoInventario {self.tipo_movimiento} {self.cantidad}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'producto_id': self.producto_id,
            'producto': self.producto.to_dict() if self.producto else None,
            'tipo_movimiento': self.tipo_movimiento,
            'cantidad': self.cantidad,
            'motivo': self.motivo,
            'usuario': self.usuario,
            'fecha_movimiento': self.fecha_movimiento.isoformat() if self.fecha_movimiento else None,
            'numero_documento': self.numero_documento,
            'observaciones': self.observaciones
        }

