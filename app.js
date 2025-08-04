// Configuración de Supabase (al inicio de app.js)
const supabaseUrl = 'https://bdrxcilsuxbkpmolfbgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcnhjaWxzdXhia3Btb2xmYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNTQ0NTcsImV4cCI6MjA2OTgzMDQ1N30.iSO9EoOMEoi_VARxPqMd2yMUvQvTmKJntxJvwAl-TVs';

// Inicialización correcta del cliente
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true
  },
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
});
// Variables globales
let currentSection = 'dashboard';
let currentMovementType = '';
let productos = [];
let inventario = [];
let movimientos = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setTimeout(() => {
        loadDashboardData();
    }, 100);
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
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}-section`).classList.add('active');

    updateHeader(sectionName);
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

// Data Loading Functions
async function loadDashboardData() {
  try {
    console.log('Loading dashboard data...');
    
    // Carga en paralelo usando el cliente Supabase
    const [
      { data: productos, error: productosError },
      { data: inventario, error: inventarioError },
      { data: movimientos, error: movimientosError }
    ] = await Promise.all([
      supabase
        .from('productos_carton')
        .select('*')
        .eq('activo', true),
      supabase
        .from('inventario')
        .select('*, producto:productos_carton(*)'),
      supabase
        .from('movimientos_inventario')
        .select('*, producto:productos_carton(*)')
        .order('fecha_movimiento', { ascending: false })
        .limit(10)
    ]);

    // Manejo de errores
    if (productosError) throw productosError;
    if (inventarioError) throw inventarioError;
    if (movimientosError) throw movimientosError;

    // Asignación de datos
    window.productos = productos || [];
    window.inventario = inventario || [];
    window.movimientos = movimientos || [];

    console.log('Data loaded successfully');
    
    updateDashboardStats();
    updateStockBajoList();
    updateMovimientosRecientes();
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showToast('Error cargando datos del dashboard', 'error');
    
    // Fallback a datos mock en desarrollo
    if (window.location.hostname === 'localhost') {
      console.warn('Using mock data for development');
      window.productos = mockProductos;
      window.inventario = mockInventario;
      window.movimientos = mockMovimientos;
      updateDashboardStats();
    }
  }
}

async function loadProductos() {
    try {
        const { data, error } = await supabase
            .from('productos_carton')
            .select('*')
            .order('numero_parte');
        
        if (error) throw error;
        
        productos = data;
        updateProductosTable();
    } catch (error) {
        console.error('Error loading productos:', error);
        showToast('Error cargando productos', 'error');
    }
}

async function loadInventario(filter = 'all') {
    try {
        let query = supabase
            .from('inventario')
            .select('*, producto:productos_carton(*)');
        
        if (filter === 'stock-bajo') {
            query = query.lte('cantidad_actual', supabase.rpc('get_cantidad_minima'));
        } else if (filter === 'sin-stock') {
            query = query.eq('cantidad_actual', 0);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        inventario = data;
        updateInventarioTable();
    } catch (error) {
        console.error('Error loading inventario:', error);
        showToast('Error cargando inventario', 'error');
    }
}

async function loadMovimientos() {
    try {
        const { data, error } = await supabase
            .from('movimientos_inventario')
            .select('*, producto:productos_carton(*)')
            .order('fecha_movimiento', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        movimientos = data;
        updateMovimientosTable();
    } catch (error) {
        console.error('Error loading movimientos:', error);
        showToast('Error cargando movimientos', 'error');
    }
}

// Update UI Functions
function updateDashboardStats() {
    const totalProductos = productos.length;
    const totalStock = inventario.reduce((sum, item) => sum + item.cantidad_actual, 0);
    const stockBajo = inventario.filter(item => item.cantidad_actual <= item.cantidad_minima).length;
    const sinStock = inventario.filter(item => item.cantidad_actual === 0).length;

    document.getElementById('total-productos').textContent = totalProductos;
    document.getElementById('total-stock').textContent = totalStock.toLocaleString();
    document.getElementById('stock-bajo').textContent = stockBajo;
    document.getElementById('sin-stock').textContent = sinStock;
}

function updateStockBajoList() {
    const stockBajoContainer = document.getElementById('stock-bajo-list');
    const stockBajoItems = inventario
        .filter(item => item.cantidad_actual <= item.cantidad_minima)
        .slice(0, 5);

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
            <div class="stock-quantity ${item.cantidad_actual === 0 ? 'text-danger' : 'text-warning'}">
                ${item.cantidad_actual} / ${item.cantidad_minima}
            </div>
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
    if (item.cantidad_actual <= item.cantidad_minima) return 'status-low';
    return 'status-normal';
}

function getStockStatusText(item) {
    if (item.cantidad_actual === 0) return 'Sin Stock';
    if (item.cantidad_actual <= item.cantidad_minima) return 'Stock Bajo';
    return 'Normal';
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

// Modal Functions
function showAddProductModal() {
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('add-product-modal').style.display = 'block';
    document.getElementById('movement-modal').style.display = 'none';
}


async function showEditProductModal(productId) {
    try {
        // Obtener datos del producto
        const response = await apiCall(`/productos/${productId}`);
        const producto = response.data;
        
        // Llenar el formulario con los datos actuales
        document.getElementById('edit-numero-parte').value = producto.numero_parte;
        document.getElementById('edit-descripcion').value = producto.descripcion;
        document.getElementById('edit-activo').value = producto.activo.toString();
        
        // Guardar el ID del producto que se está editando
        currentEditingProductId = productId;
        
        // Mostrar el modal
        document.getElementById('modal-overlay').style.display = 'flex';
        document.getElementById('edit-product-modal').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading product data:', error);
        showToast('Error al cargar los datos del producto', 'error');
    }
}



async function showMovementModal(type) {
    currentMovementType = type;
    
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
        activo: true
    };

    try {
        const { data, error } = await supabase
            .from('productos_carton')
            .insert([productData])
            .select();
        
        if (error) throw error;
        
        // Crear registro de inventario inicial
        const inventoryData = {
            producto_id: data[0].id,
            cantidad_actual: parseInt(formData.get('cantidad_inicial')) || 0,
            cantidad_minima: parseInt(formData.get('cantidad_minima')) || 10,
            cantidad_maxima: parseInt(formData.get('cantidad_maxima')) || 1000
        };
        
        await supabase.from('inventario').insert([inventoryData]);
        
        showToast('Producto creado exitosamente', 'success');
        closeModal();
        loadProductos();
        
        if (currentSection === 'dashboard') {
            loadDashboardData();
        }
    } catch (error) {
        console.error('Error creating product:', error);
        showToast('Error al crear producto', 'error');
    }
}

async function submitMovement() {
    const form = document.getElementById('movement-form');
    const formData = new FormData(form);
    
    const movementData = {
        producto_id: parseInt(formData.get('producto_id')),
        tipo_movimiento: currentMovementType,
        cantidad: parseInt(formData.get('cantidad')),
        motivo: formData.get('motivo'),
        usuario: formData.get('usuario'),
        numero_documento: formData.get('numero_documento'),
        observaciones: formData.get('observaciones')
    };

    try {
        const { error } = await supabase
            .from('movimientos_inventario')
            .insert([movementData]);
        
        if (error) throw error;
        
        // Actualizar inventario
        const updateOperation = currentMovementType === 'ENTRADA' ? 
            supabase.rpc('increment_inventory', {
                product_id: movementData.producto_id,
                amount: movementData.cantidad
            }) :
            supabase.rpc('decrement_inventory', {
                product_id: movementData.producto_id,
                amount: movementData.cantidad
            });
        
        await updateOperation;
        
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
        showToast('Error al registrar movimiento', 'error');
    }
}



// Make functions available globally
window.editProduct = editProduct;
window.toggleProductStatus = toggleProductStatus;
window.showAdjustModal = showAdjustModal;
window.showAddProductModal = showAddProductModal;
window.showMovementModal = showMovementModal;
window.closeModal = closeModal;
window.addProduct = addProduct;
window.submitMovement = submitMovement;
