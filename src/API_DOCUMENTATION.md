API Documentation - Sistema de Almacén de Cartón

📋 Información General

Versión: 1.0.0


Base URL: https://y0h0i3cq0l6m.manus.space/api


Formato: JSON


Autenticación: No requerida (sistema interno)

🎯 Descripción

API REST completa para el control y registro de un almacén de cartón. Permite gestionar productos, inventario, movimientos y generar reportes de análisis.

📦 Productos Preconfigurados

El sistema incluye 21 productos de cartón predefinidos:

Número de ParteDescripción632545K3392 Water Activated Tape1479785Low Cost 8 Iron PE Foam Insert1482387NEW Compact Black Putter Box1482388NEW Compact Black Iron Box1482389NEW Compact Black Wedge Box1482396NEW Compact Black Woods Box1482874Low Cost 8 Iron Corrugated Insert Black1491480Low Cost Black Woods Box Foam Insert1517173Putter Brown Shipper1522048LONG 14 CLUB SHIPPER1522050LONG WOODS BLACK BOX1550683Woods Brown Shipper1551020Black Single Woods Box1551022Single Woods Kraft Shipper1551097Small Driver Foam Insert1564742Wedge Brown Shipper157251514 Club Shipper Version 31574769New Full Bag1574771New Full Bag Inserts1580682LONG WOODS KRAFT SHIPPER15838038 Iron Brown Shipper





🔗 Endpoints de la API

📦 Gestión de Productos

GET /api/productos

Obtiene la lista de todos los productos.

Parámetros de consulta:

•
activo (opcional): true para solo productos activos, false para inactivos

•
buscar (opcional): Buscar por número de parte o descripción

Respuesta exitosa (200):

JSON


{
  "success": true,
  "data": [
    {
      "id": 1,
      "numero_parte": "632545",
      "descripcion": "K3392 Water Activated Tape",
      "activo": true,
      "fecha_creacion": "2024-07-31T10:30:00Z"
    }
  ],
  "total": 21
}


POST /api/productos

Crea un nuevo producto.

Cuerpo de la solicitud:

JSON


{
  "numero_parte": "1234567",
  "descripcion": "Nuevo Producto de Cartón",
  "cantidad_inicial": 100,
  "cantidad_minima": 10,
  "cantidad_maxima": 1000
}


Respuesta exitosa (201):

JSON


{
  "success": true,
  "message": "Producto creado exitosamente",
  "data": {
    "id": 22,
    "numero_parte": "1234567",
    "descripcion": "Nuevo Producto de Cartón",
    "activo": true,
    "fecha_creacion": "2024-07-31T15:45:00Z"
  }
}


GET /api/productos/{id}

Obtiene un producto específico por ID.

Respuesta exitosa (200):

JSON


{
  "success": true,
  "data": {
    "id": 1,
    "numero_parte": "632545",
    "descripcion": "K3392 Water Activated Tape",
    "activo": true,
    "fecha_creacion": "2024-07-31T10:30:00Z"
  }
}


PUT /api/productos/{id}

Actualiza un producto existente.

Cuerpo de la solicitud:

JSON


{
  "descripcion": "Descripción actualizada",
  "activo": true
}


DELETE /api/productos/{id}

Desactiva un producto (soft delete).





📊 Control de Inventario

GET /api/inventario

Obtiene el inventario completo.

Parámetros de consulta:

•
stock_bajo (opcional): true para solo productos con stock bajo

•
producto_id (opcional): Filtrar por ID de producto específico

Respuesta exitosa (200):

JSON


{
  "success": true,
  "data": [
    {
      "id": 1,
      "producto_id": 1,
      "producto": {
        "numero_parte": "632545",
        "descripcion": "K3392 Water Activated Tape"
      },
      "cantidad_actual": 150,
      "cantidad_minima": 10,
      "cantidad_maxima": 1000,
      "stock_bajo": false,
      "fecha_actualizacion": "2024-07-31T14:20:00Z"
    }
  ]
}


GET /api/inventario/{id}

Obtiene el inventario de un producto específico.

PUT /api/inventario/{id}

Ajusta los niveles de inventario.

Cuerpo de la solicitud:

JSON


{
  "cantidad_minima": 15,
  "cantidad_maxima": 1200,
  "motivo": "Ajuste de niveles por demanda"
}






🔄 Gestión de Movimientos

GET /api/movimientos

Obtiene el historial de movimientos.

Parámetros de consulta:

•
limite (opcional): Número máximo de resultados (default: 50)

•
producto_id (opcional): Filtrar por producto

•
tipo (opcional): ENTRADA o SALIDA

•
fecha_desde (opcional): Fecha inicio (YYYY-MM-DD)

•
fecha_hasta (opcional): Fecha fin (YYYY-MM-DD)

Respuesta exitosa (200):

JSON


{
  "success": true,
  "data": [
    {
      "id": 1,
      "producto_id": 1,
      "producto": {
        "numero_parte": "632545",
        "descripcion": "K3392 Water Activated Tape"
      },
      "tipo_movimiento": "ENTRADA",
      "cantidad": 100,
      "motivo": "Compra inicial",
      "usuario": "admin",
      "fecha_movimiento": "2024-07-31T09:15:00Z",
      "numero_documento": "PO-2024-001",
      "observaciones": "Primer lote recibido"
    }
  ],
  "total": 1
}


POST /api/movimientos/entrada

Registra una entrada de inventario.

Cuerpo de la solicitud:

JSON


{
  "producto_id": 1,
  "cantidad": 50,
  "motivo": "Reabastecimiento",
  "usuario": "admin",
  "numero_documento": "PO-2024-002",
  "observaciones": "Entrega programada"
}


Respuesta exitosa (201):

JSON


{
  "success": true,
  "message": "Entrada registrada exitosamente",
  "data": {
    "id": 2,
    "nuevo_stock": 200,
    "movimiento": {
      "tipo_movimiento": "ENTRADA",
      "cantidad": 50,
      "fecha_movimiento": "2024-07-31T16:30:00Z"
    }
  }
}


POST /api/movimientos/salida

Registra una salida de inventario.

Cuerpo de la solicitud:

JSON


{
  "producto_id": 1,
  "cantidad": 25,
  "motivo": "Venta",
  "usuario": "admin",
  "numero_documento": "SO-2024-001",
  "observaciones": "Pedido cliente ABC"
}


Validaciones:

•
Verifica que hay stock suficiente

•
El producto debe estar activo

•
La cantidad debe ser mayor a 0





📈 Reportes y Análisis

GET /api/reportes/stock-bajo

Genera reporte de productos con stock bajo.

Respuesta exitosa (200):

JSON


{
  "success": true,
  "data": {
    "resumen": {
      "total_productos_stock_bajo": 5,
      "productos_sin_stock": 2,
      "productos_stock_critico": 3
    },
    "productos_sin_stock": [
      {
        "producto": {
          "numero_parte": "1482387",
          "descripcion": "NEW Compact Black Putter Box"
        },
        "cantidad_actual": 0,
        "cantidad_minima": 10
      }
    ],
    "productos_stock_critico": [
      {
        "producto": {
          "numero_parte": "632545",
          "descripcion": "K3392 Water Activated Tape"
        },
        "cantidad_actual": 5,
        "cantidad_minima": 10
      }
    ]
  }
}


GET /api/reportes/resumen-inventario

Genera resumen estadístico del inventario.

Respuesta exitosa (200):

JSON


{
  "success": true,
  "data": {
    "resumen_general": {
      "total_productos_activos": 21,
      "total_stock": 2450,
      "valor_total_estimado": 12250.00,
      "movimientos_ultimos_30_dias": 45
    },
    "distribucion_stock": {
      "sin_stock": 2,
      "stock_bajo": 3,
      "stock_normal": 14,
      "stock_alto": 2
    }
  }
}


GET /api/reportes/productos-mas-activos

Obtiene productos con más movimientos.

Parámetros de consulta:

•
dias (opcional): Período en días (default: 30)

•
limite (opcional): Número de productos (default: 10)

Respuesta exitosa (200):

JSON


{
  "success": true,
  "data": {
    "periodo_dias": 30,
    "productos_mas_activos": [
      {
        "producto": {
          "numero_parte": "632545",
          "descripcion": "K3392 Water Activated Tape"
        },
        "estadisticas": {
          "total_movimientos": 15,
          "total_entradas": 8,
          "total_salidas": 7,
          "balance_neto": 25
        }
      }
    ]
  }
}






⚠️ Códigos de Error

Errores Comunes

CódigoDescripciónEjemplo400Bad RequestDatos de entrada inválidos404Not FoundProducto no encontrado409ConflictNúmero de parte duplicado422Unprocessable EntityStock insuficiente para salida500Internal Server ErrorError del servidor

Formato de Respuesta de Error

JSON


{
  "success": false,
  "error": "Descripción del error",
  "code": "ERROR_CODE",
  "details": {
    "campo": "Detalle específico del error"
  }
}


Ejemplos de Errores

Stock insuficiente (422):

JSON


{
  "success": false,
  "error": "Stock insuficiente para realizar la salida",
  "code": "INSUFFICIENT_STOCK",
  "details": {
    "stock_actual": 5,
    "cantidad_solicitada": 10,
    "producto": "632545"
  }
}


Producto no encontrado (404):

JSON


{
  "success": false,
  "error": "Producto no encontrado",
  "code": "PRODUCT_NOT_FOUND",
  "details": {
    "producto_id": 999
  }
}






🔧 Validaciones de Negocio

Productos

•
Número de parte único y requerido

•
Descripción requerida (máximo 255 caracteres)

•
Solo se pueden eliminar productos sin movimientos

Inventario

•
Cantidad mínima debe ser ≥ 0

•
Cantidad máxima debe ser > cantidad mínima

•
Stock actual se calcula automáticamente

Movimientos

•
Cantidad debe ser > 0

•
Para salidas: verificar stock disponible

•
Producto debe estar activo

•
Usuario requerido para auditoría





📱 Interfaz Web

La API incluye una interfaz web completa accesible en:
https://y0h0i3cq0l6m.manus.space

Características de la Interfaz:

•
Dashboard con estadísticas en tiempo real

•
Gestión visual de productos e inventario

•
Formularios para registrar movimientos

•
Reportes interactivos

•
Diseño responsive para móviles





🚀 Ejemplos de Uso

Flujo Típico de Trabajo

1.
Consultar inventario actual:

Bash


curl -X GET "https://y0h0i3cq0l6m.manus.space/api/inventario"


1.
Registrar entrada de mercancía:

Bash


curl -X POST "https://y0h0i3cq0l6m.manus.space/api/movimientos/entrada" \
  -H "Content-Type: application/json" \
  -d '{
    "producto_id": 1,
    "cantidad": 100,
    "motivo": "Compra mensual",
    "usuario": "admin",
    "numero_documento": "PO-2024-003"
  }'


1.
Registrar salida por venta:

Bash


curl -X POST "https://y0h0i3cq0l6m.manus.space/api/movimientos/salida" \
  -H "Content-Type: application/json" \
  -d '{
    "producto_id": 1,
    "cantidad": 25,
    "motivo": "Venta cliente XYZ",
    "usuario": "admin",
    "numero_documento": "SO-2024-005"
  }'


1.
Generar reporte de stock bajo:

Bash


curl -X GET "https://y0h0i3cq0l6m.manus.space/api/reportes/stock-bajo"






📞 Soporte y Contacto

Para soporte técnico o consultas sobre la API:

•
Documentación: Este archivo

•
Interfaz Web: https://y0h0i3cq0l6m.manus.space

•
Versión: 1.0.0

