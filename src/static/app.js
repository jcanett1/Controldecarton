// Global variables
let currentSection = 'dashboard';
let currentMovementType = '';
let productos = [];
let inventario = [];
let movimientos = [];

// API Base URL
const API_BASE = '/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadDashboardData();
}

function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            showSection(section);
        });
    });

    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', function() {
        refreshCurrentSection();
    });

    // Inventory filter
    document.getElementById('inventario-filter').addEventListener('change', function() {
        loadInventario(this.value);
    });

    // Modal close events
    document.getElementById('modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

// Navigation
function showSection(sectionName) {
    // Update sidebar
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}-section`).classList.add('active');

    // Update header
    updateHeader(sectionName);

    // Load section data
    currentSection = sectionName;
    loadSectionData(sectionName);
}

function updateHeader(sectionName) {
    const titles = {
        dashboard: { title: 'Dashboard', subtitle: 'Resumen general del almacén' },
        productos: { title: 'Productos', subtitle: 'Gestión de productos de cartón' },
        inventario: { title: 'Inventario', subtitle: 'Control de stock y niveles' },
        movimientos: { title: 'Movimientos', subtitle: 'Historial de entradas y salidas' },
        reportes: { title: 'Reportes', subtitle: 'Análisis y estadísticas' }
    };

    const info = titles[sectionName];
    document.getElementById('page-title').textContent = info.title;
    document.getElementById('page-subtitle').textContent = info.subtitle;
}

function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'productos':
            loadProductos();
            break;
        case 'inventario':
            loadInventario();
            break;
        case 'movimientos':
            loadMovimientos();
            break;
        case 'reportes':
            // Reports are loaded on demand
            break;
    }
}

function refreshCurrentSection() {
    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Actualizando...';
    
    setTimeout(() => {
        loadSectionData(currentSection);
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
        showToast('Datos actualizados correctamente', 'success');
    }, 1000);
}

// API Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error en la solicitud');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        showToast(error.message, 'error');
        throw error;
    }
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        // Load summary data
        const [productosRes, inventarioRes, movimientosRes] = await Promise.all([
            apiCall('/productos'),
            apiCall('/inventario'),
            apiCall('/movimientos?limite=10')
        ]);

        productos = productosRes.data;
        inventario = inventarioRes.data;
        movimientos = movimientosRes.data;

        updateDashboardStats();
        updateStockBajoList();
        updateMovimientosRecientes();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function updateDashboardStats() {
    const totalProductos = productos.length;
    const totalStock = inventario.reduce((sum, item) => sum + item.cantidad_actual, 0);
    const stockBajo = inventario.filter(item => item.stock_bajo).length;
    const sinStock = inventario.filter(item => item.cantidad_actual === 0).length;

    document.getElementById('total-productos').textContent = totalProductos;
    document.getElementById('total-stock').textContent = totalStock.toLocaleString();
    document.getElementById('stock-bajo').textContent = stockBajo;
    document.getElementById('sin-stock').textContent = sinStock;
}

function updateStockBajoList() {
    const stockBajoContainer = document.getElementById('stock-bajo-list');
    const stockBajoItems = inventario.filter(item => item.stock_bajo).slice(0, 5);

    if (stockBajoItems.length === 0) {
        stockBajoContainer.innerHTML = '<p class="text-center text-gray-500">No hay productos con stock bajo</p>';
        return;
    }

    stockBajoContainer.innerHTML = stockBajoItems.map(item => `
        <div class="stock-item">
            <div class="stock-item-info">
                <h4>${item.producto.numero_parte}</h4>
                <p>${item.producto.descripcion}</p>
            </div>
            <div class="stock-quantity">${item.cantidad_actual}</div>
        </div>
    `).join('');
}

function updateMovimientosRecientes() {
    const movimientosContainer = document.getElementById('movimientos-recientes');
    
    if (movimientos.length === 0) {
        movimientosContainer.innerHTML = '<p class="text-center text-gray-500">No hay movimientos recientes</p>';
        return;
    }

    movimientosContainer.innerHTML = movimientos.slice(0, 5).map(mov => `
        <div class="movement-item">
            <div class="movement-item-info">
                <h4>${mov.producto.numero_parte}</h4>
                <p>${formatDate(mov.fecha_movimiento)} - ${mov.usuario}</p>
            </div>
            <div class="movement-${mov.tipo_movimiento.toLowerCase()}">
                ${mov.tipo_movimiento === 'ENTRADA' ? '+' : '-'}${mov.cantidad}
            </div>
        </div>
    `).join('');
}

// Products Functions
async function loadProductos() {
    try {
        const response = await apiCall('/productos');
        productos = response.data;
        updateProductosTable();
    } catch (error) {
        console.error('Error loading productos:', error);
    }
}

function updateProductosTable() {
    const tbody = document.getElementById('productos-table-body');
    
    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No hay productos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = productos.map(producto => `
        <tr>
            <td><strong>${producto.numero_parte}</strong></td>
            <td>${producto.descripcion}</td>
            <td>
                <span class="status-badge ${producto.activo ? 'status-active' : 'status-inactive'}">
                    ${producto.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>${formatDate(producto.fecha_creacion)}</td>
            <td>
                <button class="action-btn edit" onclick="editProduct(${producto.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="action-btn delete" onclick="toggleProductStatus(${producto.id}, ${producto.activo})">
                    <i class="fas fa-${producto.activo ? 'ban' : 'check'}"></i> 
                    ${producto.activo ? 'Desactivar' : 'Activar'}
                </button>
            </td>
        </tr>
    `).join('');
}

// Inventory Functions
async function loadInventario(filter = 'all') {
    try {
        let endpoint = '/inventario';
        if (filter === 'stock-bajo') {
            endpoint += '?stock_bajo=true';
        }
        
        const response = await apiCall(endpoint);
        inventario = response.data;
        
        if (filter === 'sin-stock') {
            inventario = inventario.filter(item => item.cantidad_actual === 0);
        }
        
        updateInventarioTable();
    } catch (error) {
        console.error('Error loading inventario:', error);
    }
}

function updateInventarioTable() {
    const tbody = document.getElementById('inventario-table-body');
    
    if (inventario.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No hay datos de inventario</td></tr>';
        return;
    }

    tbody.innerHTML = inventario.map(item => `
        <tr>
            <td>
                <strong>${item.producto.numero_parte}</strong><br>
                <small>${item.producto.descripcion}</small>
            </td>
            <td><strong>${item.cantidad_actual}</strong></td>
            <td>${item.cantidad_minima}</td>
            <td>${item.cantidad_maxima}</td>
            <td>
                <span class="status-badge ${getStockStatus(item)}">
                    ${getStockStatusText(item)}
                </span>
            </td>
            <td>
                <button class="action-btn adjust" onclick="showAdjustModal(${item.producto_id})">
                    <i class="fas fa-cog"></i> Ajustar
                </button>
            </td>
        </tr>
    `).join('');
}

function getStockStatus(item) {
    if (item.cantidad_actual === 0) return 'status-out';
    if (item.stock_bajo) return 'status-low';
    return 'status-normal';
}

function getStockStatusText(item) {
    if (item.cantidad_actual === 0) return 'Sin Stock';
    if (item.stock_bajo) return 'Stock Bajo';
    return 'Normal';
}

// Movements Functions
async function loadMovimientos() {
    try {
        const response = await apiCall('/movimientos?limite=50');
        movimientos = response.data;
        updateMovimientosTable();
    } catch (error) {
        console.error('Error loading movimientos:', error);
    }
}

function updateMovimientosTable() {
    const tbody = document.getElementById('movimientos-table-body');
    
    if (movimientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No hay movimientos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = movimientos.map(mov => `
        <tr>
            <td>${formatDate(mov.fecha_movimiento)}</td>
            <td>
                <strong>${mov.producto.numero_parte}</strong><br>
                <small>${mov.producto.descripcion}</small>
            </td>
            <td>
                <span class="movement-${mov.tipo_movimiento.toLowerCase()}">
                    ${mov.tipo_movimiento}
                </span>
            </td>
            <td><strong>${mov.cantidad}</strong></td>
            <td>${mov.usuario}</td>
            <td>${mov.motivo}</td>
        </tr>
    `).join('');
}

// Modal Functions
function showAddProductModal() {
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('add-product-modal').style.display = 'block';
    document.getElementById('movement-modal').style.display = 'none';
}

async function showMovementModal(type) {
    currentMovementType = type;
    
    // Load products for dropdown
    if (productos.length === 0) {
        await loadProductos();
    }
    
    const select = document.getElementById('movement-producto');
    select.innerHTML = '<option value="">Seleccionar producto...</option>' +
        productos.filter(p => p.activo).map(p => 
            `<option value="${p.id}">${p.numero_parte} - ${p.descripcion}</option>`
        ).join('');
    
    document.getElementById('movement-modal-title').textContent = 
        `Registrar ${type === 'ENTRADA' ? 'Entrada' : 'Salida'}`;
    
    const submitBtn = document.getElementById('movement-submit-btn');
    submitBtn.className = `btn ${type === 'ENTRADA' ? 'btn-success' : 'btn-danger'}`;
    submitBtn.textContent = `Registrar ${type === 'ENTRADA' ? 'Entrada' : 'Salida'}`;
    
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('movement-modal').style.display = 'block';
    document.getElementById('add-product-modal').style.display = 'none';
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
    
    // Reset forms
    document.getElementById('add-product-form').reset();
    document.getElementById('movement-form').reset();
}

// Form Submissions
async function addProduct() {
    const form = document.getElementById('add-product-form');
    const formData = new FormData(form);
    
    const productData = {
        numero_parte: formData.get('numero_parte'),
        descripcion: formData.get('descripcion'),
        cantidad_inicial: parseInt(formData.get('cantidad_inicial')) || 0,
        cantidad_minima: parseInt(formData.get('cantidad_minima')) || 10,
        cantidad_maxima: parseInt(formData.get('cantidad_maxima')) || 1000
    };

    try {
        await apiCall('/productos', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
        
        showToast('Producto creado exitosamente', 'success');
        closeModal();
        loadProductos();
        
        if (currentSection === 'dashboard') {
            loadDashboardData();
        }
    } catch (error) {
        console.error('Error creating product:', error);
    }
}

async function submitMovement() {
    const form = document.getElementById('movement-form');
    const formData = new FormData(form);
    
    const movementData = {
        producto_id: parseInt(formData.get('producto_id')),
        cantidad: parseInt(formData.get('cantidad')),
        motivo: formData.get('motivo'),
        usuario: formData.get('usuario'),
        numero_documento: formData.get('numero_documento'),
        observaciones: formData.get('observaciones')
    };

    try {
        const endpoint = currentMovementType === 'ENTRADA' ? '/movimientos/entrada' : '/movimientos/salida';
        await apiCall(endpoint, {
            method: 'POST',
            body: JSON.stringify(movementData)
        });
        
        showToast(`${currentMovementType} registrada exitosamente`, 'success');
        closeModal();
        
        if (currentSection === 'movimientos') {
            loadMovimientos();
        }
        if (currentSection === 'dashboard') {
            loadDashboardData();
        }
        if (currentSection === 'inventario') {
            loadInventario();
        }
    } catch (error) {
        console.error('Error submitting movement:', error);
    }
}

// Reports Functions
async function generateReport(reportType) {
    const reportResults = document.getElementById('report-results');
    const reportTitle = document.getElementById('report-title');
    const reportContent = document.getElementById('report-content');
    
    reportResults.style.display = 'block';
    reportContent.innerHTML = '<div class="loading">Generando reporte...</div>';
    
    try {
        let response;
        let title;
        
        switch (reportType) {
            case 'stock-bajo':
                response = await apiCall('/reportes/stock-bajo');
                title = 'Reporte de Stock Bajo';
                renderStockBajoReport(response.data);
                break;
                
            case 'resumen-inventario':
                response = await apiCall('/reportes/resumen-inventario');
                title = 'Resumen de Inventario';
                renderResumenInventarioReport(response.data);
                break;
                
            case 'productos-activos':
                response = await apiCall('/reportes/productos-mas-activos');
                title = 'Productos Más Activos';
                renderProductosActivosReport(response.data);
                break;
        }
        
        reportTitle.textContent = title;
    } catch (error) {
        reportContent.innerHTML = '<div class="error">Error al generar el reporte</div>';
    }
}

function renderStockBajoReport(data) {
    const content = document.getElementById('report-content');
    
    content.innerHTML = `
        <div class="report-summary">
            <div class="summary-stats">
                <div class="summary-stat">
                    <h4>${data.resumen.total_productos_stock_bajo}</h4>
                    <p>Productos con Stock Bajo</p>
                </div>
                <div class="summary-stat">
                    <h4>${data.resumen.productos_sin_stock}</h4>
                    <p>Sin Stock</p>
                </div>
                <div class="summary-stat">
                    <h4>${data.resumen.productos_stock_critico}</h4>
                    <p>Stock Crítico</p>
                </div>
            </div>
        </div>
        
        <div class="report-table">
            <h4>Productos Sin Stock</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Número de Parte</th>
                        <th>Descripción</th>
                        <th>Stock Actual</th>
                        <th>Stock Mínimo</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.productos_sin_stock.map(item => `
                        <tr>
                            <td>${item.producto.numero_parte}</td>
                            <td>${item.producto.descripcion}</td>
                            <td class="text-danger">${item.cantidad_actual}</td>
                            <td>${item.cantidad_minima}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderResumenInventarioReport(data) {
    const content = document.getElementById('report-content');
    
    content.innerHTML = `
        <div class="report-summary">
            <div class="summary-stats">
                <div class="summary-stat">
                    <h4>${data.resumen_general.total_productos_activos}</h4>
                    <p>Productos Activos</p>
                </div>
                <div class="summary-stat">
                    <h4>${data.resumen_general.total_stock.toLocaleString()}</h4>
                    <p>Total Stock</p>
                </div>
                <div class="summary-stat">
                    <h4>$${data.resumen_general.valor_total_estimado.toLocaleString()}</h4>
                    <p>Valor Estimado</p>
                </div>
                <div class="summary-stat">
                    <h4>${data.resumen_general.movimientos_ultimos_30_dias}</h4>
                    <p>Movimientos (30 días)</p>
                </div>
            </div>
        </div>
        
        <div class="report-charts">
            <h4>Distribución de Stock</h4>
            <div class="distribution-chart">
                <div class="chart-item">
                    <span class="chart-label">Sin Stock:</span>
                    <span class="chart-value">${data.distribucion_stock.sin_stock}</span>
                </div>
                <div class="chart-item">
                    <span class="chart-label">Stock Bajo:</span>
                    <span class="chart-value">${data.distribucion_stock.stock_bajo}</span>
                </div>
                <div class="chart-item">
                    <span class="chart-label">Stock Normal:</span>
                    <span class="chart-value">${data.distribucion_stock.stock_normal}</span>
                </div>
                <div class="chart-item">
                    <span class="chart-label">Stock Alto:</span>
                    <span class="chart-value">${data.distribucion_stock.stock_alto}</span>
                </div>
            </div>
        </div>
    `;
}

function renderProductosActivosReport(data) {
    const content = document.getElementById('report-content');
    
    content.innerHTML = `
        <div class="report-table">
            <h4>Productos Más Activos (${data.periodo_dias} días)</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Total Movimientos</th>
                        <th>Entradas</th>
                        <th>Salidas</th>
                        <th>Balance</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.productos_mas_activos.map(item => `
                        <tr>
                            <td>
                                <strong>${item.producto.numero_parte}</strong><br>
                                <small>${item.producto.descripcion}</small>
                            </td>
                            <td>${item.estadisticas.total_movimientos}</td>
                            <td class="movement-entrada">+${item.estadisticas.total_entradas}</td>
                            <td class="movement-salida">-${item.estadisticas.total_salidas}</td>
                            <td class="${item.estadisticas.balance_neto >= 0 ? 'movement-entrada' : 'movement-salida'}">
                                ${item.estadisticas.balance_neto >= 0 ? '+' : ''}${item.estadisticas.balance_neto}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function getToastIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Export function (placeholder)
function exportReport() {
    showToast('Función de exportación en desarrollo', 'info');
}

// Additional action functions (placeholders)
function editProduct(id) {
    showToast('Función de edición en desarrollo', 'info');
}

function toggleProductStatus(id, currentStatus) {
    showToast('Función de cambio de estado en desarrollo', 'info');
}

function showAdjustModal(productId) {
    showToast('Función de ajuste de inventario en desarrollo', 'info');
}

