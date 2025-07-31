import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask
from src.models.almacen import db, ProductoCarton, Inventario

def init_database():
    """Inicializa la base de datos con los productos de cartón iniciales"""
    
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    with app.app_context():
        # Crear todas las tablas
        db.create_all()
        
        # Productos iniciales
        productos_iniciales = [
            ("632545", "K3392 Water Activated Tape"),
            ("1479785", "Low Cost 8 Iron PE Foam Insert"),
            ("1482387", "NEW Compact Black Putter Box"),
            ("1482388", "NEW Compact Black Iron Box"),
            ("1482389", "NEW Compact Black Wedge Box"),
            ("1482396", "NEW Compact Black Woods Box"),
            ("1482874", "Low Cost 8 Iron Corrugated Insert Black"),
            ("1491480", "Low Cost Black Woods Box Foam Insert"),
            ("1517173", "Putter Brown Shipper"),
            ("1522048", "LONG 14 CLUB SHIPPER"),
            ("1522050", "LONG WOODS BLACK BOX"),
            ("1550683", "Woods Brown Shipper"),
            ("1551020", "Black Single Woods Box"),
            ("1551022", "Single Woods Kraft Shipper"),
            ("1551097", "Small Driver Foam Insert"),
            ("1564742", "Wedge Brown Shipper"),
            ("1572515", "14 Club Shipper Version 3"),
            ("1574769", "New Full Bag"),
            ("1574771", "New Full Bag Inserts"),
            ("1580682", "LONG WOODS KRAFT SHIPPER"),
            ("1583803", "8 Iron Brown Shipper")
        ]
        
        # Verificar si ya existen productos
        if ProductoCarton.query.count() == 0:
            print("Inicializando productos de cartón...")
            
            for numero_parte, descripcion in productos_iniciales:
                # Crear producto
                producto = ProductoCarton(
                    numero_parte=numero_parte,
                    descripcion=descripcion
                )
                db.session.add(producto)
                db.session.flush()  # Para obtener el ID
                
                # Crear registro de inventario inicial
                inventario = Inventario(
                    producto_id=producto.id,
                    cantidad_actual=0,
                    cantidad_minima=10,
                    cantidad_maxima=1000
                )
                db.session.add(inventario)
                
                print(f"Agregado: {numero_parte} - {descripcion}")
            
            db.session.commit()
            print(f"Se agregaron {len(productos_iniciales)} productos al sistema.")
        else:
            print("La base de datos ya contiene productos. No se realizaron cambios.")

if __name__ == '__main__':
    init_database()

