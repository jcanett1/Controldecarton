// Configuración de Supabase
const supabaseUrl = 'https://bdrxcilsuxbkpmolfbgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcnhjaWxzdXhia3Btb2xmYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNTQ0NTcsImV4cCI6MjA2OTgzMDQ1N30.iSO9EoOMEoi_VARxPqMd2yMUvQvTmKJntxJvwAl-TVs';

// Inicialización del cliente Supabase
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
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
let currentEditingProductId = null;
let productos = [];
let inventario = [];
let movimientos = [];
let produccion = [];
let currentUser = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
});

// ===== FUNCIONES DE AUTENTICACIÓN =====

async function checkAuthentication() {
    console.log('🔍 Verificando autenticación...');
    
    try {
        // Verificar sesión actual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error verificando sesión:', error);
            redirectToLogin();
            return;
        }
        
        if (!session) {
            console.log('❌ No hay sesión activa');
            redirectToLogin();
            return;
        }
        
        // Verificar usuario en la base de datos
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single();
        
        if (userError || !userData) {
            console.error('Error obteniendo datos del usuario:', userError);
            await supabase.auth.signOut();
            redirectToLogin();
            return;
        }
        
        currentUser = userData;
        console.log('✅ Usuario autenticado:', currentUser);
        
        // Inicializar la aplicación
        initializeApp();
        setupUserInterface();
        
    } catch (error) {
        console.error('Error en verificación de autenticación:', error);
        redirectToLogin();
    }
}

function redirectToLogin() {
    console.log('🔄 Redirigiendo al login...');
    window.location.href = 'login.html';
}

function setupUserInterface() {
    if (!currentUser) return;
    
    console.log('🎨 Configurando interfaz para usuario:', currentUser.full_name);
    
    // Actualizar información del usuario en el header
    updateUserInfo();
    
    // Configurar permisos según el rol
    if (currentUser.role !== 'admin') {
        hideAdminFeatures();
    }
}

function updateUserInfo() {
    // Buscar o crear el contenedor de información del usuario
    const headerRight = document.querySelector('.header-right');
    
    // Crear información del usuario si no existe
    let userInfoContainer = document.getElementById('user-info-container');
    if (!userInfoContainer) {
        userInfoContainer = document.createElement('div');
        userInfoContainer.id = 'user-info-container';
        userInfoContainer.className = 'user-info-container';
        userInfoContainer.innerHTML = `
            <div class="user-details">
                <span class="user-name">${currentUser.full_name}</span>
                <span class="user-role ${currentUser.role}">${currentUser.role === 'admin' ? 'Administrador' : 'Visualizador'}</span>
            </div>
            <button class="btn btn-secondary btn-logout" onclick="handleLogout()">
                <i class="fas fa-sign-out-alt"></i>
                Cerrar Sesión
            </button>
        `;
        
        // Insertar antes del botón de actualizar
        const refreshBtn = document.getElementById('refresh-btn');
        headerRight.insertBefore(userInfoContainer, refreshBtn);
    }
    
    // Agregar estilos si no existen
    if (!document.getElementById('auth-styles')) {
        const style = document.createElement('style');
        style.id = 'auth-styles';
        style.textContent = `
            .user-info-container {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-right: 15px;
            }
            
            .user-details {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                text-align: right;
            }
            
            .user-name {
                font-weight: 600;
                color: #1e293b;
                font-size: 0.9rem;
            }
            
            .user-role {
                font-size: 0.75rem;
                padding: 2px 8px;
                border-radius: 12px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            .user-role.admin {
                background: #e3f2fd;
                color: #1976d2;
            }
            
            .user-role.viewer {
                background: #f3e5f5;
                color: #7b1fa2;
            }
            
            .btn-logout {
                background: linear-gradient(135deg, #6b7280, #4b5563);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .btn-logout:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
            }
            
            @media (max-width: 768px) {
                .user-info-container {
                    flex-direction: column;
                    gap: 8px;
                    margin-right: 8px;
                }
                
                .user-details {
                    align-items: center;
                    text-align: center;
                }
                
                .btn-logout {
                    font-size: 0.8rem;
                    padding: 6px 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function hideAdminFeatures() {
    console.log('🔒 Ocultando funciones de administrador para usuario viewer');
    
    // Ocultar botones de admin
    const adminButtons = [
        'button[onclick*="showAddProductModal"]',
        'button[onclick*="showMovementModal"]',
        'button[onclick*="addProduct"]',
        'button[onclick*="editProduct"]',
        'button[onclick*="toggleProductStatus"]',
        'button[onclick*="showAdjustModal"]',
        'button[onclick*="showReturnToInventoryModal"]',
        'button[onclick*="showAdjustProduccionModal"]',
        'button[onclick*="showAddInventoryModal"]'
    ];
    
    adminButtons.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.style.display = 'none';
            el.classList.add('admin-only');
        });
    });
    
    // Deshabilitar formularios para viewers
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea, button[type="submit"]');
        inputs.forEach(input => {
            if (input.type !== 'button' && !input.classList.contains('btn-logout')) {
                input.disabled = true;
                input.style.opacity = '0.6';
            }
        });
    });
}

async function handleLogout() {
    console.log('🚪 Cerrando sesión...');
    
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        try {
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                console.error('Error cerrando sesión:', error);
                showToast('Error al cerrar sesión', 'error');
                return;
            }
            
            console.log('✅ Sesión cerrada exitosamente');
            currentUser = null;
            
            // Redirigir al login
            window.location.href = 'login.html';
            
        } catch (error) {
            console.error('Error inesperado cerrando sesión:', error);
            showToast('Error inesperado al cerrar sesión', 'error');
        }
    }
}

// ===== FUNCIONES ORIGINALES DEL SISTEMA =====

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
    const inventarioFilter = document.getElementById('inventario-filter');
    if (inventarioFilter) {
        inventarioFilter.addEventListener('change', function() {
            loadInventario(this.value);
        });
    }

    // Modal close events
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
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
        produccion: { title: 'Producción', subtitle: 'Almacén en piso - Control de producción' },
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
        case 'produccion':
            loadProduccion();
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

// ===== FUNCIONES DE CARGA DE DATOS =====

async function loadDashboardData() {
    try {
        const [
            { data: productos, error: productosError },
            { data: inventario, error: inventarioError },
            { data: movimientos, error: movimientosError },
            { data: produccion, error: produccionError }
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
                .limit(10),
            supabase
                .from('produccion_almacen')
                .select('*, producto:productos_carton(*)')
        ]);

        if (productosError) throw productosError;
        if (inventarioError) throw inventarioError;
        if (movimientosError) throw movimientosError;
        if (produccionError) throw produccionError;

        window.productos = productos || [];
        window.inventario = inventario || [];
        window.movimientos = movimientos || [];
        window.produccion = produccion || [];

        updateDashboardStats();
        updateStockBajoList();
        updateMovimientosRecientes();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Error cargando datos del dashboard', 'error');
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
            .select('*, producto:productos_carton(*)')
            .order('ultima_actualizacion', { ascending: false }); // Changed to ultima_actualizacion
        
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

async function loadProduccion() {
    try {
        const { data, error } = await supabase
            .from('produccion_almacen')
            .select('*, producto:productos_carton(*)')
            .order('fecha_transferencia', { ascending: false });
        
        if (error) throw error;
        
        produccion = data;
        updateProduccionTable();
        updateProduccionStats();
    } catch (error) {
        console.error('Error loading produccion:', error);
        showToast('Error cargando datos de producción', 'error');
    }
}

// ===== FUNCIONES DE ACTUALIZACIÓN DE UI =====

function updateDashboardStats() {
    const totalProductos = productos.length;
    const totalStock = inventario.reduce((sum, item) => sum + item.cantidad_actual, 0);
    const stockBajo = inventario.filter(item => item.cantidad_actual <= item.cantidad_minima).length;
    const totalProduccion = produccion.reduce((sum, item) => sum + item.cantidad_produccion, 0);

    document.getElementById('total-productos').textContent = totalProductos;
    document.getElementById('total-stock').textContent = totalStock.toLocaleString();
    document.getElementById('stock-bajo').textContent = stockBajo;
    document.getElementById('total-produccion').textContent = totalProduccion.toLocaleString();
}

function updateProduccionStats() {
    const totalProductosProduccion = produccion.length;
    const totalCantidadProduccion = produccion.reduce((sum, item) => sum + item.cantidad_produccion, 0);

    const totalProductosElement = document.getElementById('total-productos-produccion');
    const totalCantidadElement = document.getElementById('total-cantidad-produccion');
    
    if (totalProductosElement) totalProductosElement.textContent = totalProductosProduccion;
    if (totalCantidadElement) totalCantidadElement.textContent = totalCantidadProduccion.toLocaleString();
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
            <td>${formatDate(producto.fecha_creacion || producto.created_at)}</td>
            <td>
                ${currentUser && currentUser.role === 'admin' ? `
                    <button class="action-btn edit" onclick="editProduct(${producto.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="action-btn delete" onclick="toggleProductStatus(${producto.id}, ${producto.activo})">
                        <i class="fas fa-${producto.activo ? 'ban' : 'check'}"></i> 
                        ${producto.activo ? 'Desactivar' : 'Activar'}
                    </button>
                ` : '<span class="text-muted">Solo lectura</span>'}
            </td>
        </tr>
    `).join('');
}

// ===== FUNCIÓN CORREGIDA: updateInventarioTable con fecha =====
function updateInventarioTable() {
    const tbody = document.getElementById('inventario-table-body');
    
    if (inventario.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No hay datos de inventario</td></tr>';
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
            <td>${formatDate(item.created_at || item.fecha_creacion)}</td>
            <td>
                ${currentUser && currentUser.role === 'admin' ? `
                    <button class="action-btn adjust" onclick="showAdjustModal(${item.producto_id})">
                        <i class="fas fa-cog"></i> Ajustar
                    </button>
                ` : '<span class="text-muted">Solo lectura</span>'}
            </td>
        </tr>
    `).join('');
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

function updateProduccionTable() {
    const tbody = document.getElementById('produccion-table-body');
    
    if (produccion.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No hay productos en producción</td></tr>';
        return;
    }

    tbody.innerHTML = produccion.map(item => `
        <tr>
            <td>
                <strong>${item.producto.numero_parte}</strong><br>
                <small>${item.producto.descripcion}</small>
            </td>
            <td><strong>${item.cantidad_produccion}</strong></td>
            <td>${formatDate(item.fecha_transferencia)}</td>
            <td>${item.transferido_por}</td>
            <td>${item.motivo}</td>
            <td>
                ${currentUser && currentUser.role === 'admin' ? `
                    <button class="action-btn warning" onclick="showReturnToInventoryModal(${item.producto_id})">
                        <i class="fas fa-undo"></i> Devolver
                    </button>
                    <button class="action-btn info" onclick="showAdjustProduccionModal(${item.producto_id})">
                        <i class="fas fa-cog"></i> Ajustar
                    </button>
                ` : '<span class="text-muted">Solo lectura</span>'}
            </td>
        </tr>
    `).join('');
}

// ===== FUNCIONES DE PRODUCTOS =====

function showAddProductModal() {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    // Limpiar formulario
    document.getElementById('add-product-form').reset();
    
    // Mostrar modal
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('add-product-modal').style.display = 'block';
    document.getElementById('edit-product-modal').style.display = 'none';
    document.getElementById('movement-modal').style.display = 'none';
    document.getElementById('adjust-modal').style.display = 'none';
    document.getElementById('return-inventory-modal').style.display = 'none';
    document.getElementById('adjust-produccion-modal').style.display = 'none';
    document.getElementById('add-inventory-modal').style.display = 'none';
}

// ===== NUEVA FUNCIÓN: showAddInventoryModal =====
function showAddInventoryModal() {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    console.log('🔄 Abriendo modal de agregar inventario...');
    
    // Limpiar formulario
    const form = document.getElementById('add-inventory-form');
    if (form) {
        form.reset();
    }
    
    // Cargar productos disponibles
    loadProductosForInventory();
    
    // Mostrar modal
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('add-inventory-modal').style.display = 'block';
    document.getElementById('add-product-modal').style.display = 'none';
    document.getElementById('edit-product-modal').style.display = 'none';
    document.getElementById('movement-modal').style.display = 'none';
    document.getElementById('adjust-modal').style.display = 'none';
    document.getElementById('return-inventory-modal').style.display = 'none';
    document.getElementById('adjust-produccion-modal').style.display = 'none';
    
    console.log('✅ Modal de agregar inventario abierto');
}

async function loadProductosForInventory() {
    try {
        // Obtener productos que NO tienen inventario
        const { data: productosConInventario, error: inventarioError } = await supabase
            .from('inventario')
            .select('producto_id');
        
        if (inventarioError) throw inventarioError;
        
        const productosConInventarioIds = productosConInventario.map(item => item.producto_id);
        
        let query = supabase
            .from('productos_carton')
            .select('*')
            .eq('activo', true);
        
        if (productosConInventarioIds.length > 0) {
            query = query.not('id', 'in', `(${productosConInventarioIds.join(',')})`);
        }
        
        const { data: productos, error: productosError } = await query;
        
        if (productosError) throw productosError;
        
        const selector = document.getElementById('inventory-producto');
        if (selector) {
            selector.innerHTML = '<option value="">Selecciona un producto</option>';
            
            productos.forEach(producto => {
                const option = document.createElement('option');
                option.value = producto.id;
                option.textContent = `${producto.numero_parte} - ${producto.descripcion}`;
                selector.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error cargando productos para inventario:', error);
        showToast('Error cargando productos disponibles', 'error');
    }
}

// ===== NUEVA FUNCIÓN: addInventory =====
async function addInventory() {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    console.log('🔄 Agregando inventario...');
    
    const form = document.getElementById('add-inventory-form');
    const formData = new FormData(form);
    
    const productoId = parseInt(formData.get('producto_id'));
    const cantidadInicial = parseInt(formData.get('cantidad_inicial')) || 0;
    const cantidadMinima = parseInt(formData.get('cantidad_minima')) || 10;
    const cantidadMaxima = parseInt(formData.get('cantidad_maxima')) || 1000;
    
    if (!productoId) {
        showToast('Por favor selecciona un producto', 'error');
        return;
    }
    
    if (cantidadMaxima <= cantidadMinima) {
        showToast('La cantidad máxima debe ser mayor que la mínima', 'error');
        return;
    }
    
    if (cantidadInicial < 0) {
        showToast('La cantidad inicial no puede ser negativa', 'error');
        return;
    }
    
    try {
        // Verificar si ya existe inventario para este producto
        const { data: existingInventory, error: checkError } = await supabase
            .from('inventario')
            .select('producto_id')
            .eq('producto_id', productoId)
            .single();
        
        if (existingInventory) {
            showToast('Ya existe inventario para este producto', 'error');
            return;
        }
        
        // Crear registro en inventario
        const { error: inventarioError } = await supabase
            .from('inventario')
            .insert([{
                producto_id: productoId,
                cantidad_actual: cantidadInicial,
                cantidad_minima: cantidadMinima,
                cantidad_maxima: cantidadMaxima,
                created_at: new Date().toISOString()
            }]);
        
        if (inventarioError) throw inventarioError;
        
        // Si hay cantidad inicial, registrar movimiento de entrada
        if (cantidadInicial > 0) {
            const { error: movimientoError } = await supabase
                .from('movimientos_inventario')
                .insert([{
                    producto_id: productoId,
                    tipo_movimiento: 'ENTRADA',
                    cantidad: cantidadInicial,
                    usuario: currentUser.full_name,
                    motivo: 'Stock inicial del inventario',
                    fecha_movimiento: new Date().toISOString()
                }]);
            
            if (movimientoError) throw movimientoError;
        }
        
        showToast('Inventario agregado exitosamente', 'success');
        closeModal();
        loadSectionData(currentSection);
        
        console.log('✅ Inventario agregado exitosamente');
        
    } catch (error) {
        console.error('Error agregando inventario:', error);
        if (error.code === '23505') {
            showToast('Ya existe inventario para este producto', 'error');
        } else {
            showToast('Error agregando inventario', 'error');
        }
    }
}

async function addProduct() {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    const form = document.getElementById('add-product-form');
    const formData = new FormData(form);
    
    const numeroParte = formData.get('numero_parte');
    const descripcion = formData.get('descripcion');
    const cantidadInicial = parseInt(formData.get('cantidad_inicial')) || 0;
    const cantidadMinima = parseInt(formData.get('cantidad_minima')) || 10;
    const cantidadMaxima = parseInt(formData.get('cantidad_maxima')) || 1000;
    
    if (!numeroParte || !descripcion) {
        showToast('Por favor completa todos los campos requeridos', 'error');
        return;
    }
    
    if (cantidadMaxima <= cantidadMinima) {
        showToast('La cantidad máxima debe ser mayor que la mínima', 'error');
        return;
    }
    
    try {
        // Verificar si el número de parte ya existe
        const { data: existingProduct, error: checkError } = await supabase
            .from('productos_carton')
            .select('numero_parte')
            .eq('numero_parte', numeroParte)
            .single();
        
        if (existingProduct) {
            showToast('Ya existe un producto con ese número de parte', 'error');
            return;
        }
        
        // Crear producto
        const { data: newProduct, error: productError } = await supabase
            .from('productos_carton')
            .insert([{
                numero_parte: numeroParte,
                descripcion: descripcion,
                activo: true,
                fecha_creacion: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (productError) throw productError;
        
        // Crear registro en inventario
        const { error: inventarioError } = await supabase
            .from('inventario')
            .insert([{
                producto_id: newProduct.id,
                cantidad_actual: cantidadInicial,
                cantidad_minima: cantidadMinima,
                cantidad_maxima: cantidadMaxima,
                created_at: new Date().toISOString()
            }]);
        
        if (inventarioError) throw inventarioError;
        
        // Si hay cantidad inicial, registrar movimiento de entrada
        if (cantidadInicial > 0) {
            const { error: movimientoError } = await supabase
                .from('movimientos_inventario')
                .insert([{
                    producto_id: newProduct.id,
                    tipo_movimiento: 'ENTRADA',
                    cantidad: cantidadInicial,
                    usuario: currentUser.full_name,
                    motivo: 'Stock inicial del producto',
                    fecha_movimiento: new Date().toISOString()
                }]);
            
            if (movimientoError) throw movimientoError;
        }
        
        showToast('Producto creado exitosamente', 'success');
        closeModal();
        loadSectionData(currentSection);
        
    } catch (error) {
        console.error('Error creando producto:', error);
        if (error.code === '23505') {
            showToast('Ya existe un producto con ese número de parte', 'error');
        } else {
            showToast('Error creando producto', 'error');
        }
    }
}

async function showEditProductModal(productId) {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    try {
        const { data: producto, error } = await supabase
            .from('productos_carton')
            .select('*')
            .eq('id', productId)
            .single();

        if (error) throw error;
        if (!producto) throw new Error('Producto no encontrado');

        document.getElementById('edit-product-id').value = producto.id;
        document.getElementById('edit-numero-parte').value = producto.numero_parte;
        document.getElementById('edit-descripcion').value = producto.descripcion;
        document.getElementById('edit-activo').value = producto.activo;
        
        document.getElementById('modal-overlay').style.display = 'flex';
        document.getElementById('edit-product-modal').style.display = 'block';
        document.getElementById('add-product-modal').style.display = 'none';
        document.getElementById('movement-modal').style.display = 'none';
        document.getElementById('adjust-modal').style.display = 'none';
        document.getElementById('return-inventory-modal').style.display = 'none';
        document.getElementById('adjust-produccion-modal').style.display = 'none';
        document.getElementById('add-inventory-modal').style.display = 'none';
        
    } catch (error) {
        console.error('Error al cargar los datos del producto:', error);
        showToast('Error al cargar los datos del producto', 'error');
    }
}

async function updateProduct() {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    const form = document.getElementById('edit-product-form');
    const formData = new FormData(form);
    
    const productId = document.getElementById('edit-product-id').value;
    const numeroParte = formData.get('numero_parte');
    const descripcion = formData.get('descripcion');
    const activo = formData.get('activo') === 'true';
    
    if (!numeroParte || !descripcion) {
        showToast('Por favor completa todos los campos requeridos', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('productos_carton')
            .update({
                numero_parte: numeroParte,
                descripcion: descripcion,
                activo: activo
            })
            .eq('id', productId);
        
        if (error) throw error;
        
        showToast('Producto actualizado exitosamente', 'success');
        closeModal();
        loadSectionData(currentSection);
        
    } catch (error) {
        console.error('Error actualizando producto:', error);
        if (error.code === '23505') {
            showToast('Ya existe un producto con ese número de parte', 'error');
        } else {
            showToast('Error actualizando producto', 'error');
        }
    }
}

async function toggleProductStatus(productId, currentStatus) {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    const action = currentStatus ? 'desactivar' : 'activar';
    
    if (!confirm(`¿Estás seguro de que quieres ${action} este producto?`)) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('productos_carton')
            .update({ activo: !currentStatus })
            .eq('id', productId);
        
        if (error) throw error;
        
        showToast(`Producto ${action}do exitosamente`, 'success');
        loadSectionData(currentSection);
        
    } catch (error) {
        console.error('Error cambiando estado del producto:', error);
        showToast('Error cambiando estado del producto', 'error');
    }
}

// ===== FUNCIONES DE MOVIMIENTOS Y PRODUCCIÓN =====

async function showMovementModal(type) {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    currentMovementType = type;
    
    // Configurar el modal según el tipo
    const modalTitle = document.getElementById('movement-modal-title');
    const salidaOptions = document.getElementById('salida-options');
    
    if (type === 'ENTRADA') {
        modalTitle.textContent = 'Registrar Entrada';
        salidaOptions.style.display = 'none';
    } else {
        modalTitle.textContent = 'Registrar Salida';
        salidaOptions.style.display = 'block';
    }
    
    // Limpiar formulario
    document.getElementById('movement-form').reset();
    document.getElementById('stock-info').style.display = 'none';
    
    // Cargar productos en el selector
    await loadProductosForMovement();
    
    // Mostrar modal
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('movement-modal').style.display = 'block';
    document.getElementById('add-product-modal').style.display = 'none';
    document.getElementById('edit-product-modal').style.display = 'none';
    document.getElementById('adjust-modal').style.display = 'none';
    document.getElementById('return-inventory-modal').style.display = 'none';
    document.getElementById('adjust-produccion-modal').style.display = 'none';
    document.getElementById('add-inventory-modal').style.display = 'none';
}

async function loadProductosForMovement() {
    try {
        const { data, error } = await supabase
            .from('inventario')
            .select('*, producto:productos_carton(*)')
            .gt('cantidad_actual', 0); // Solo productos con stock
        
        if (error) throw error;
        
        const selector = document.getElementById('movement-producto');
        selector.innerHTML = '<option value="">Selecciona un producto</option>';
        
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.producto_id;
            option.textContent = `${item.producto.numero_parte} - ${item.producto.descripcion}`;
            option.dataset.stock = item.cantidad_actual;
            option.dataset.minStock = item.cantidad_minima;
            selector.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        showToast('Error cargando productos', 'error');
    }
}

function updateStockInfo() {
    const selector = document.getElementById('movement-producto');
    const stockInfo = document.getElementById('stock-info');
    const currentStockSpan = document.getElementById('current-stock');
    const minStockSpan = document.getElementById('min-stock');
    const cantidadInput = document.getElementById('movement-cantidad');
    const cantidadHelp = document.getElementById('cantidad-help');
    
    if (selector.value) {
        const selectedOption = selector.options[selector.selectedIndex];
        const stock = parseInt(selectedOption.dataset.stock);
        const minStock = parseInt(selectedOption.dataset.minStock);
        
        currentStockSpan.textContent = stock;
        minStockSpan.textContent = minStock;
        stockInfo.style.display = 'block';
        
        // Configurar validación de cantidad
        if (currentMovementType === 'SALIDA') {
            cantidadInput.max = stock;
            cantidadHelp.textContent = `Máximo disponible: ${stock} unidades`;
        } else {
            cantidadInput.removeAttribute('max');
            cantidadHelp.textContent = '';
        }
    } else {
        stockInfo.style.display = 'none';
        cantidadInput.removeAttribute('max');
        cantidadHelp.textContent = '';
    }
}

async function registerMovement() {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    const form = document.getElementById('movement-form');
    const formData = new FormData(form);
    
    const productoId = parseInt(formData.get('producto_id'));
    const cantidad = parseInt(formData.get('cantidad'));
    const motivo = formData.get('motivo');
    const transferToProduction = document.getElementById('transfer-to-production').checked;
    
    if (!productoId || !cantidad || !motivo) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }
    
    try {
        // Obtener información del producto y stock actual
        const { data: inventarioItem, error: inventarioError } = await supabase
            .from('inventario')
            .select('*, producto:productos_carton(*)')
            .eq('producto_id', productoId)
            .single();
        
        if (inventarioError) throw inventarioError;
        
        // Validar stock suficiente para salidas
        if (currentMovementType === 'SALIDA' && cantidad > inventarioItem.cantidad_actual) {
            showToast('No hay suficiente stock disponible', 'error');
            return;
        }
        
        // Calcular nuevo stock
        let nuevoStock;
        if (currentMovementType === 'ENTRADA') {
            nuevoStock = inventarioItem.cantidad_actual + cantidad;
        } else {
            nuevoStock = inventarioItem.cantidad_actual - cantidad;
        }
        
        // Iniciar transacción
        const { error: movimientoError } = await supabase
            .from('movimientos_inventario')
            .insert([{
                producto_id: productoId,
                tipo_movimiento: currentMovementType,
                cantidad: cantidad,
                usuario: currentUser.full_name,
                motivo: motivo,
                fecha_movimiento: new Date().toISOString()
            }]);
        
        if (movimientoError) throw movimientoError;
        
        // Actualizar inventario
        const { error: updateError } = await supabase
            .from('inventario')
            .update({ cantidad_actual: nuevoStock })
            .eq('producto_id', productoId);
        
        if (updateError) throw updateError;
        
        // Si es salida y se debe transferir a producción
        if (currentMovementType === 'SALIDA' && transferToProduction) {
            await transferToProduccion(productoId, cantidad, motivo);
        }
        
        showToast(`${currentMovementType.toLowerCase()} registrada exitosamente`, 'success');
        closeModal();
        loadSectionData(currentSection);
        
    } catch (error) {
        console.error('Error registrando movimiento:', error);
        showToast('Error registrando movimiento', 'error');
    }
}

async function transferToProduccion(productoId, cantidad, motivo) {
    try {
        // Verificar si ya existe el producto en producción
        const { data: existingProduccion, error: checkError } = await supabase
            .from('produccion_almacen')
            .select('*')
            .eq('producto_id', productoId)
            .single();
        
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
            throw checkError;
        }
        
        if (existingProduccion) {
            // Actualizar cantidad existente
            const nuevaCantidad = existingProduccion.cantidad_produccion + cantidad;
            const { error: updateError } = await supabase
                .from('produccion_almacen')
                .update({ 
                    cantidad_produccion: nuevaCantidad,
                    fecha_transferencia: new Date().toISOString(),
                    transferido_por: currentUser.full_name,
                    motivo: motivo
                })
                .eq('producto_id', productoId);
            
            if (updateError) throw updateError;
        } else {
            // Crear nuevo registro en producción
            const { error: insertError } = await supabase
                .from('produccion_almacen')
                .insert([{
                    producto_id: productoId,
                    cantidad_produccion: cantidad,
                    fecha_transferencia: new Date().toISOString(),
                    transferido_por: currentUser.full_name,
                    motivo: motivo
                }]);
            
            if (insertError) throw insertError;
        }
        
        console.log('✅ Producto transferido a producción');
        
    } catch (error) {
        console.error('Error transfiriendo a producción:', error);
        throw error;
    }
}

// ===== FUNCIONES DE PRODUCCIÓN =====

async function showReturnToInventoryModal(productoId = null) {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    // Limpiar formulario
    document.getElementById('return-inventory-form').reset();
    document.getElementById('produccion-stock-info').style.display = 'none';
    
    // Cargar productos en producción
    await loadProductosForReturn();
    
    // Si se especifica un producto, seleccionarlo
    if (productoId) {
        document.getElementById('return-producto').value = productoId;
        updateProduccionStockInfo();
    }
    
    // Mostrar modal
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('return-inventory-modal').style.display = 'block';
    document.getElementById('movement-modal').style.display = 'none';
    document.getElementById('add-product-modal').style.display = 'none';
    document.getElementById('edit-product-modal').style.display = 'none';
    document.getElementById('adjust-modal').style.display = 'none';
    document.getElementById('adjust-produccion-modal').style.display = 'none';
    document.getElementById('add-inventory-modal').style.display = 'none';
}

async function loadProductosForReturn() {
    try {
        const { data, error } = await supabase
            .from('produccion_almacen')
            .select('*, producto:productos_carton(*)')
            .gt('cantidad_produccion', 0);
        
        if (error) throw error;
        
        const selector = document.getElementById('return-producto');
        selector.innerHTML = '<option value="">Selecciona un producto</option>';
        
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.producto_id;
            option.textContent = `${item.producto.numero_parte} - ${item.producto.descripcion}`;
            option.dataset.produccionStock = item.cantidad_produccion;
            selector.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error cargando productos en producción:', error);
        showToast('Error cargando productos en producción', 'error');
    }
}

function updateProduccionStockInfo() {
    const selector = document.getElementById('return-producto');
    const stockInfo = document.getElementById('produccion-stock-info');
    const produccionStockSpan = document.getElementById('produccion-stock');
    const cantidadInput = document.getElementById('return-cantidad');
    const cantidadHelp = document.getElementById('return-cantidad-help');
    
    if (selector.value) {
        const selectedOption = selector.options[selector.selectedIndex];
        const stock = parseInt(selectedOption.dataset.produccionStock);
        
        produccionStockSpan.textContent = stock;
        stockInfo.style.display = 'block';
        
        cantidadInput.max = stock;
        cantidadHelp.textContent = `Máximo disponible: ${stock} unidades`;
    } else {
        stockInfo.style.display = 'none';
        cantidadInput.removeAttribute('max');
        cantidadHelp.textContent = '';
    }
}

async function returnToInventory() {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    const form = document.getElementById('return-inventory-form');
    const formData = new FormData(form);
    
    const productoId = parseInt(formData.get('producto_id'));
    const cantidad = parseInt(formData.get('cantidad'));
    const motivo = formData.get('motivo');
    
    if (!productoId || !cantidad || !motivo) {
        showToast('Por favor completa todos los campos', 'error');
        return;
    }
    
    try {
        // Obtener información de producción
        const { data: produccionItem, error: produccionError } = await supabase
            .from('produccion_almacen')
            .select('*')
            .eq('producto_id', productoId)
            .single();
        
        if (produccionError) throw produccionError;
        
        // Validar cantidad disponible
        if (cantidad > produccionItem.cantidad_produccion) {
            showToast('No hay suficiente cantidad en producción', 'error');
            return;
        }
        
        // Obtener información del inventario
        const { data: inventarioItem, error: inventarioError } = await supabase
            .from('inventario')
            .select('*')
            .eq('producto_id', productoId)
            .single();
        
        if (inventarioError) throw inventarioError;
        
        // Calcular nuevas cantidades
        const nuevaCantidadProduccion = produccionItem.cantidad_produccion - cantidad;
        const nuevaCantidadInventario = inventarioItem.cantidad_actual + cantidad;
        
        // Registrar movimiento de entrada
        const { error: movimientoError } = await supabase
            .from('movimientos_inventario')
            .insert([{
                producto_id: productoId,
                tipo_movimiento: 'ENTRADA',
                cantidad: cantidad,
                usuario: currentUser.full_name,
                motivo: `Devolución de producción: ${motivo}`,
                fecha_movimiento: new Date().toISOString()
            }]);
        
        if (movimientoError) throw movimientoError;
        
        // Actualizar inventario
        const { error: updateInventarioError } = await supabase
            .from('inventario')
            .update({ cantidad_actual: nuevaCantidadInventario })
            .eq('producto_id', productoId);
        
        if (updateInventarioError) throw updateInventarioError;
        
        // Actualizar o eliminar de producción
        if (nuevaCantidadProduccion > 0) {
            const { error: updateProduccionError } = await supabase
                .from('produccion_almacen')
                .update({ cantidad_produccion: nuevaCantidadProduccion })
                .eq('producto_id', productoId);
            
            if (updateProduccionError) throw updateProduccionError;
        } else {
            const { error: deleteProduccionError } = await supabase
                .from('produccion_almacen')
                .delete()
                .eq('producto_id', productoId);
            
            if (deleteProduccionError) throw deleteProduccionError;
        }
        
        showToast('Producto devuelto al inventario exitosamente', 'success');
        closeModal();
        loadSectionData(currentSection);
        
    } catch (error) {
        console.error('Error devolviendo producto:', error);
        showToast('Error devolviendo producto al inventario', 'error');
    }
}

async function showAdjustProduccionModal(productoId = null) {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    if (productoId) {
        try {
            const { data: produccionItem, error } = await supabase
                .from('produccion_almacen')
                .select('*, producto:productos_carton(*)')
                .eq('producto_id', productoId)
                .single();
            
            if (error) throw error;
            
            document.getElementById('adjust-produccion-product-id').value = productoId;
            document.getElementById('adjust-produccion-product-name').textContent = 
                `${produccionItem.producto.numero_parte} - ${produccionItem.producto.descripcion}`;
            document.getElementById('adjust-produccion-current-stock').textContent = produccionItem.cantidad_produccion;
            document.getElementById('adjust-produccion-new-stock').value = produccionItem.cantidad_produccion;
            
        } catch (error) {
            console.error('Error cargando datos de producción:', error);
            showToast('Error cargando datos de producción', 'error');
            return;
        }
    }
    
    // Mostrar modal
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('adjust-produccion-modal').style.display = 'block';
    document.getElementById('movement-modal').style.display = 'none';
    document.getElementById('add-product-modal').style.display = 'none';
    document.getElementById('edit-product-modal').style.display = 'none';
    document.getElementById('adjust-modal').style.display = 'none';
    document.getElementById('return-inventory-modal').style.display = 'none';
    document.getElementById('add-inventory-modal').style.display = 'none';
}

async function adjustProduccionStock() {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    const form = document.getElementById('adjust-produccion-form');
    const formData = new FormData(form);
    
    const productoId = parseInt(document.getElementById('adjust-produccion-product-id').value);
    const nuevoStock = parseInt(formData.get('new_stock'));
    const motivo = formData.get('motivo');
    
    if (!productoId || nuevoStock < 0 || !motivo) {
        showToast('Por favor completa todos los campos correctamente', 'error');
        return;
    }
    
    try {
        if (nuevoStock === 0) {
            // Eliminar de producción
            const { error: deleteError } = await supabase
                .from('produccion_almacen')
                .delete()
                .eq('producto_id', productoId);
            
            if (deleteError) throw deleteError;
        } else {
            // Actualizar cantidad
            const { error: updateError } = await supabase
                .from('produccion_almacen')
                .update({ 
                    cantidad_produccion: nuevoStock,
                    motivo: motivo
                })
                .eq('producto_id', productoId);
            
            if (updateError) throw updateError;
        }
        
        showToast('Stock en producción ajustado exitosamente', 'success');
        closeModal();
        loadSectionData(currentSection);
        
    } catch (error) {
        console.error('Error ajustando stock en producción:', error);
        showToast('Error ajustando stock en producción', 'error');
    }
}

// ===== FUNCIONES AUXILIARES =====

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

function formatDate(dateString) {
    if (!dateString) return 'N/A';
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
    // Crear contenedor de toasts si no existe
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.cssText = `
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
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
function closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
    }
}

// Funciones adicionales que pueden estar en el código original
function editProduct(productId) {
    showEditProductModal(productId);
}

function showAdjustModal(productId) {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    // Implementar lógica del modal de ajuste
    showToast('Modal de ajuste - Función por implementar', 'info');
}

function generateReport(reportType) {
    showToast(`Generando reporte: ${reportType}`, 'info');
    // Implementar lógica de reportes
}

function exportReport() {
    showToast('Exportando reporte - Función por implementar', 'info');
}

// Agregar estilos de animación para toasts
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
    `;
    document.head.appendChild(style);
}
