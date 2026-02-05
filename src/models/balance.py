from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.almacen import db

class BalanceVeritiv(db.Model):
    """Modelo para la tabla balances_veritiv"""
    __tablename__ = 'balances_veritiv'
    
    id = db.Column(db.Integer, primary_key=True)
    orden_compra = db.Column(db.String(100), nullable=False, index=True)
    fecha_orden_compra = db.Column(db.Date, nullable=False, index=True)
    producto_id = db.Column(db.Integer, db.ForeignKey('productos_carton.id', ondelete='CASCADE'))
    material_carton = db.Column(db.String(255), nullable=False)
    balance = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    activo = db.Column(db.Boolean, default=True)
    
    # Relación con ProductoCarton
    producto = db.relationship('ProductoCarton', backref='balances', lazy=True)
    
    def __repr__(self):
        return f'<BalanceVeritiv {self.orden_compra} - {self.material_carton}>'
    
    def to_dict(self):
        """Convertir el objeto a diccionario"""
        return {
            'id': self.id,
            'orden_compra': self.orden_compra,
            'fecha_orden_compra': self.fecha_orden_compra.isoformat() if self.fecha_orden_compra else None,
            'producto_id': self.producto_id,
            'producto': self.producto.to_dict() if self.producto else None,
            'material_carton': self.material_carton,
            'balance': float(self.balance) if self.balance else 0,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'fecha_actualizacion': self.fecha_actualizacion.isoformat() if self.fecha_actualizacion else None,
            'activo': self.activo
        }
