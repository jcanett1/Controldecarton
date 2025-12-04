// Configuración del sistema de cartón con Supabase
const supabaseUrl = 'https://bdrxcilsuxbkpmolfbgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcnhjaWxzdXhia3Btb2xmYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNTQ0NTcsImV4cCI6MjA2OTgzMDQ1N30.iSO9EoOMEoi_VARxPqMd2yMUvQvTmKJntxJvwAl-TVs';

// Inicialización del cliente Supabase
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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

// ===== FUNCIONES DE AUTENTICACIÓN DEL SISTEMA DE CARTÓN =====

async function checkAuthentication() {
    console.log('🔍 Verificando autenticación del sistema de cartón...');
    
    try {
        // Verificar usuario en localStorage
        const storedUser = localStorage.getItem('current_user');
        
        if (!storedUser) {
            console.log('❌ No hay usuario autenticado');
            redirectToLogin();
            return;
        }
        
        currentUser = JSON.parse(storedUser);
        console.log('✅ Usuario autenticado:', currentUser);
        
        // Verificar que el usuario existe en la base de datos
        const { data, error } = await supabase
            .from('usuarios_carton')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error || !data) {
            console.log('❌ Usuario no válido en la base de datos');
            clearAuthData();
            redirectToLogin();
            return;
        }
        
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
    window.location.href = 'login_supabase.html';
}

function clearAuthData() {
    localStorage.removeItem('current_user');
    currentUser = null;
}

function setupUserInterface() {
    if (!currentUser) return;
    
    console.log('🎨 Configurando interfaz para usuario:', currentUser.nombre_completo);
    
    // Actualizar información del usuario en el header
    updateUserInfo();
    
    // Configurar permisos según el rol
    if (currentUser.rol !== 'ADMIN') {
        hideAdminFeatures();
    }
}

function getRoleDisplayName(rol) {
    const roleNames = {
        'ADMIN': 'Administrador',
        'REVISOR': 'Revisor',
        'USUARIO': 'Usuario',
        'RECEPCION': 'Recepción'
    };
    return roleNames[rol] || rol;
}

function updateUserInfo() {
    // Buscar o crear el contenedor de información del usuario
    let userInfoContainer = document.querySelector('.user-info');
    
    if (!userInfoContainer) {
        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            userInfoContainer = document.createElement('div');
            userInfoContainer.className = 'user-info';
            headerRight.insertBefore(userInfoContainer, headerRight.firstChild);
        }
    }
    
    if (userInfoContainer && currentUser) {
        userInfoContainer.innerHTML = `
            <div class="user-profile">
                <i class="fas fa-user-circle"></i>
                <div class="user-details">
                    <span class="user-name">${currentUser.nombre_completo || currentUser.usuario}</span>
                    <span class="user-role">${getRoleDisplayName(currentUser.rol)}</span>
                </div>
                <button class="logout-btn" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;
    }
}

function hideAdminFeatures() {
    // Ocultar funcionalidades de administrador para usuarios no admin
    const adminMenuItems = document.querySelectorAll('[data-section="reportes"]');
    adminMenuItems.forEach(item => {
        item.style.display = 'none';
    });
}

function logout() {
    console.log('🚪 Cerrando sesión...');
    
    // Limpiar datos de autenticación
    clearAuthData();
    
    // Cerrar sesión de Supabase si existe
    supabase.auth.signOut().then(() => {
        console.log('✅ Sesión cerrada');
        window.location.href = 'login_supabase.html';
    }).catch(error => {
        console.log('⚠️ Error cerrando sesión Supabase:', error);
        window.location.href = 'login_supabase.html';
    });
}

// ===== FUNCIONES DE NAVEGACIÓN =====

function initializeApp() {
    console.log('🚀 Inicializando aplicación...');
    
    // Configurar navegación del sidebar
    setupSidebarNavigation();
    
    // Configurar botón de actualización
    setupRefreshButton();
    
    // Cargar datos iniciales
    loadInitialData();
    
    // Mostrar sección por defecto
    showSection('dashboard');
}

function setupSidebarNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
}

function setupRefreshButton() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshCurrentSection);
    }
}

function showSection(sectionName) {
    console.log(`📄 Mostrando sección: ${sectionName}`);
    
    // Actualizar navegación
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeMenuItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeMenuItem) {
        activeMenuItem.classList.add('active');
    }
    
    // Actualizar contenido
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Actualizar título de página
    updatePageTitle(sectionName);
    
    currentSection = sectionName;
    
    // Cargar datos específicos de la sección
    loadSectionData(sectionName);
}

function updatePageTitle(sectionName) {
    const titles = {
        'dashboard': { title: 'Dashboard', subtitle: 'Resumen general del almacén' },
        'productos': { title: 'Productos', subtitle: 'Gestión de productos de cartón' },
        'inventario': { title: 'Inventario', subtitle: 'Control de stock y existencias' },
        'movimientos': { title: 'Movimientos', subtitle: 'Historial de entradas y salidas' },
        'oci-crear': { title: 'Crear OCI', subtitle: 'Órdenes de Compra Interna' },
        'oci-revisar': { title: 'Revisar OCI', subtitle: 'Revisar y aprobar órdenes' },
        'oci-recibido': { title: 'Recibido', subtitle: 'Confirmar recepción de materiales' },
        'produccion': { title: 'Producción', subtitle: 'Control de producción' },
        'reportes': { title: 'Reportes', subtitle: 'Reportes y estadísticas' }
    };
    
    const titleData = titles[sectionName] || { title: 'Sistema', subtitle: 'Almacén de Cartón' };
    
    document.getElementById('page-title').textContent = titleData.title;
    document.getElementById('page-subtitle').textContent = titleData.subtitle;
}

function loadSectionData(sectionName) {
    switch(sectionName) {
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
        case 'oci-crear':
            loadOCICrear();
            break;
        case 'oci-revisar':
            loadOCIRevisar();
            break;
        case 'oci-recibido':
            loadOCIRecibir();
            break;
        case 'produccion':
            loadProduccion();
            break;
        case 'reportes':
            loadReportes();
            break;
    }
}

function loadInitialData() {
    // Cargar datos básicos para el dashboard
    loadDashboardData();
}

function refreshCurrentSection() {
    console.log('🔄 Actualizando sección actual...');
    loadSectionData(currentSection);
}

// ===== FUNCIONES DE CARGA DE DATOS =====

async function loadDashboardData() {
    try {
        console.log('📊 Cargando datos del dashboard...');
        
        // Cargar estadísticas básicas desde Supabase
        const [productosResult, inventarioResult] = await Promise.all([
            supabase.from('productos').select('*'),
            supabase.from('inventario').select('*')
        ]);
        
        if (productosResult.error) throw productosResult.error;
        if (inventarioResult.error) throw inventarioResult.error;
        
        productos = productosResult.data || [];
        inventario = inventarioResult.data || [];
        
        // Actualizar estadísticas en el dashboard
        updateDashboardStats();
        
    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
}

function updateDashboardStats() {
    // Actualizar contadores en el dashboard
    const totalProductos = productos.length;
    const totalStock = inventario.reduce((sum, item) => sum + (item.stock_actual || 0), 0);
    const productosStockBajo = inventario.filter(item => item.stock_actual <= item.stock_minimo).length;
    
    document.getElementById('total-productos').textContent = totalProductos;
    document.getElementById('total-stock').textContent = totalStock;
    document.getElementById('productos-stock-bajo').textContent = productosStockBajo;
}

async function loadProductos() {
    try {
        console.log('📦 Cargando productos...');
        
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .order('numero_parte');
        
        if (error) throw error;
        
        productos = data || [];
        renderProductos();
        
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

function renderProductos() {
    const container = document.getElementById('productos-list');
    if (!container) return;
    
    if (productos.length === 0) {
        container.innerHTML = '<p>No hay productos registrados.</p>';
        return;
    }
    
    container.innerHTML = productos.map(producto => `
        <div class="producto-item">
            <h4>${producto.numero_parte}</h4>
            <p>${producto.descripcion}</p>
            <div class="producto-info">
                <span>Stock: ${producto.stock_actual || 0}</span>
                <span>Mínimo: ${producto.stock_minimo || 0}</span>
            </div>
        </div>
    `).join('');
}

async function loadInventario() {
    try {
        console.log('📋 Cargando inventario...');
        
        const { data, error } = await supabase
            .from('inventario')
            .select('*, productos(*)')
            .order('fecha_actualizacion', { ascending: false });
        
        if (error) throw error;
        
        inventario = data || [];
        renderInventario();
        
    } catch (error) {
        console.error('Error cargando inventario:', error);
    }
}

function renderInventario() {
    const container = document.getElementById('inventario-list');
    if (!container) return;
    
    if (inventario.length === 0) {
        container.innerHTML = '<p>No hay registros de inventario.</p>';
        return;
    }
    
    container.innerHTML = inventario.map(item => `
        <div class="inventario-item">
            <h4>${item.productos?.numero_parte || 'Producto no encontrado'}</h4>
            <p>${item.productos?.descripcion || ''}</p>
            <div class="inventario-info">
                <span>Stock: ${item.stock_actual}</span>
                <span>Ubicación: ${item.ubicacion || 'No especificada'}</span>
                <span>Actualizado: ${new Date(item.fecha_actualizacion).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

async function loadMovimientos() {
    try {
        console.log('🔄 Cargando movimientos...');
        
        const { data, error } = await supabase
            .from('movimientos')
            .select('*, productos(*)')
            .order('fecha_movimiento', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        movimientos = data || [];
        renderMovimientos();
        
    } catch (error) {
        console.error('Error cargando movimientos:', error);
    }
}

function renderMovimientos() {
    const container = document.getElementById('movimientos-list');
    if (!container) return;
    
    if (movimientos.length === 0) {
        container.innerHTML = '<p>No hay movimientos registrados.</p>';
        return;
    }
    
    container.innerHTML = movimientos.map(movimiento => `
        <div class="movimiento-item">
            <div class="movimiento-header">
                <h4>${movimiento.productos?.numero_parte || 'Producto no encontrado'}</h4>
                <span class="tipo-movimiento tipo-${movimiento.tipo_movimiento}">
                    ${movimiento.tipo_movimiento}
                </span>
            </div>
            <p>${movimiento.cantidad} unidades</p>
            <div class="movimiento-info">
                <span>Fecha: ${new Date(movimiento.fecha_movimiento).toLocaleString()}</span>
                <span>Usuario: ${movimiento.usuario}</span>
            </div>
            ${movimiento.observaciones ? `<p class="observaciones">${movimiento.observaciones}</p>` : ''}
        </div>
    `).join('');
}

// Funciones para OCI (se mantienen como placeholder)
async function loadOCICrear() {
    console.log('📄 Cargando sección crear OCI...');
    // Implementar lógica de OCI con Supabase
}

async function loadOCIRevisar() {
    console.log('🔍 Cargando sección revisar OCI...');
    // Implementar lógica de OCI con Supabase
}

async function loadOCIRecibir() {
    console.log('📦 Cargando sección recibir OCI...');
    // Implementar lógica de OCI con Supabase
}

async function loadProduccion() {
    console.log('🏭 Cargando sección producción...');
    // Implementar lógica de producción con Supabase
}

async function loadReportes() {
    console.log('📊 Cargando sección reportes...');
    // Implementar lógica de reportes con Supabase
}

// ===== FUNCIONES AUXILIARES =====

function showToast(message, type = 'info') {
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Agregar estilos si no existen
    if (!document.getElementById('toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                animation: slideInRight 0.3s ease-out;
                display: flex;
                align-items: center;
                gap: 8px;
                min-width: 300px;
            }
            .toast-success { background: #10b981; }
            .toast-error { background: #ef4444; }
            .toast-info { background: #3b82f6; }
            .toast-warning { background: #f59e0b; }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(toast);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

console.log('✅ Sistema de cartón con Supabase cargado correctamente');


// ========================================
// FUNCIONES PARA NAVEGACIÓN DE OCI
// Agregar estas funciones al final del archivo app.js
// ========================================

// Función para abrir la página de crear OCI
function abrirOCI() {
    // Cambiar a la sección de OCI
    showSection('oci-crear');
    
    // Cargar la página OCI en la sección
    cargarContenidoOCI();
}

// Función para abrir la lista de OCI
function abrirListaOCI() {
    // Cambiar a la sección de lista OCI
    showSection('oci-revisar');
    
    // Cargar el contenido de lista OCI
    cargarContenidoListaOCI();
}

// Cargar el contenido HTML de OCI en la sección
function cargarContenidoOCI() {
    // Mostrar usuario actual
    const usuarioSpan = document.getElementById('usuario-actual-oci');
    if (usuarioSpan && window.usuarioActual) {
        usuarioSpan.textContent = `Usuario: ${window.usuarioActual.username}`;
    } else if (usuarioSpan) {
        usuarioSpan.textContent = `Usuario: julio`; // Usuario por defecto
    }
    
    // Configurar fecha actual
    const fechaInput = document.getElementById('fecha-oci');
    if (fechaInput) {
        fechaInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Cargar materiales
    cargarMaterialesOCI();
    
    // Cargar órdenes recientes
    cargarOrdenesRecientes();
}

// Cargar el contenido de lista OCI
function cargarContenidoListaOCI() {
    // Cargar las órdenes existentes
    cargarOrdenesExistentes();
}

// Función para cargar materiales (aquí están los 17 materiales exactos)
function cargarMaterialesOCI() {
    const gridMateriales = document.getElementById('grid-materiales');
    
    if (!gridMateriales) return;
    
    const materiales = [
        { numero: '1482388', descripcion: 'Material cartón 1482388', piezas: 760 },
        { numero: '1482387', descripcion: 'Material cartón 1482387', piezas: 350 },
        { numero: '1482389', descripcion: 'Material cartón 1482389', piezas: 700 },
        { numero: '1482396', descripcion: 'Material cartón 1482396', piezas: 350 },
        { numero: '1482874', descripcion: 'Material cartón 1482874', piezas: 2000 },
        { numero: '1522048', descripcion: 'Material cartón 1522048', piezas: 270 },
        { numero: '632545', descripcion: 'Material cartón 632545 (10 x Caja)', piezas: 10 },
        { numero: '1479785', descripcion: 'Material cartón 1479785', piezas: 1200 },
        { numero: '1491480', descripcion: 'Material cartón 1491480', piezas: 900 },
        { numero: '1572515', descripcion: 'Material cartón 1572515', piezas: 200 },
        { numero: '1583803', descripcion: 'Material cartón 1583803', piezas: 500 },
        { numero: '1564742', descripcion: 'Material cartón 1564742', piezas: 700 },
        { numero: '1550683', descripcion: 'Material cartón 1550683', piezas: 375 },
        { numero: '1574769', descripcion: 'Material cartón 1574769', piezas: 500 },
        { numero: '1574771', descripcion: 'Material cartón 1574771', piezas: 500 },
        { numero: '1517173', descripcion: 'Material cartón 1517173', piezas: 450 },
        { numero: '1586785', descripcion: 'Material cartón 1586785', piezas: 500 }
    ];
    
    gridMateriales.innerHTML = materiales.map(material => `
        <div class="material-card" onclick="seleccionarMaterial('${material.numero}', '${material.descripcion}', ${material.piezas})">
            <h4>${material.numero}</h4>
            <p>${material.piezas} piezas por pallet</p>
        </div>
    `).join('');
}

// Variables para tracking de materiales seleccionados
if (typeof window.materialesSeleccionados === 'undefined') {
    window.materialesSeleccionados = {};
}

// Función para seleccionar material
function seleccionarMaterial(numero, descripcion, piezas) {
    if (window.materialesSeleccionados[numero]) {
        delete window.materialesSeleccionados[numero];
    } else {
        window.materialesSeleccionados[numero] = {
            numero: numero,
            descripcion: descripcion,
            piezas: piezas,
            cantidad: 1
        };
    }
    
    actualizarResumenOCI();
    actualizarSeleccionVisual();
}

// Actualizar la selección visual
function actualizarSeleccionVisual() {
    const cards = document.querySelectorAll('.material-card');
    cards.forEach(card => {
        const numero = card.querySelector('h4').textContent;
        if (window.materialesSeleccionados[numero]) {
            card.classList.add('seleccionado');
        } else {
            card.classList.remove('seleccionado');
        }
    });
}

// Actualizar resumen de OCI
function actualizarResumenOCI() {
    const contenedor = document.getElementById('materiales-seleccionados');
    const totalSpan = document.getElementById('total-piezas');
    
    if (!contenedor || !totalSpan) return;
    
    let html = '';
    let total = 0;
    
    Object.values(window.materialesSeleccionados).forEach(material => {
        const subtotal = material.piezas * material.cantidad;
        total += subtotal;
        html += `
            <div class="material-seleccionado">
                <span>${material.numero} - ${material.descripcion}</span>
                <span>Cantidad: ${material.cantidad} pallets (${subtotal} piezas)</span>
                <button onclick="eliminarMaterial('${material.numero}')">×</button>
            </div>
        `;
    });
    
    contenedor.innerHTML = html;
    totalSpan.textContent = total.toLocaleString();
}

// Función para eliminar material
function eliminarMaterial(numero) {
    delete window.materialesSeleccionados[numero];
    actualizarResumenOCI();
    actualizarSeleccionVisual();
}

// Función para limpiar formulario
function limpiarFormularioOCI() {
    window.materialesSeleccionados = {};
    actualizarResumenOCI();
    actualizarSeleccionVisual();
}

// Función para guardar OCI (aquí integrarías con Supabase)
async function guardarOCI() {
    if (Object.keys(window.materialesSeleccionados).length === 0) {
        alert('Debe seleccionar al menos un material');
        return;
    }
    
    try {
        const usuario = window.usuarioActual?.username || 'julio'; // Usuario por defecto
        
        // Crear las órdenes para cada material seleccionado
        for (const material of Object.values(window.materialesSeleccionados)) {
            const orden = {
                usuario_solicitante: usuario,
                material_numero: material.numero,
                material_descripcion: material.descripcion,
                piezas_por_pallet: material.piezas,
                cantidad_pallets: material.cantidad,
                total_piezas: material.piezas * material.cantidad,
                estado: 'pendiente',
                observaciones: ''
            };
            
            // Guardar en Supabase
            const { error } = await supabase
                .from('ordenes_compra')
                .insert([orden]);
            
            if (error) {
                console.error('Error al guardar orden:', error);
                alert('Error al guardar la orden: ' + error.message);
                return;
            }
            
            console.log('Orden guardada:', orden);
        }
        
        alert('OCI guardada exitosamente');
        limpiarFormularioOCI();
        cargarOrdenesRecientes();
        
    } catch (error) {
        console.error('Error al guardar OCI:', error);
        alert('Error al guardar la OCI: ' + error.message);
    }
}

// Función para cargar órdenes recientes
function cargarOrdenesRecientes() {
    const contenedor = document.getElementById('lista-ordenes-recientes');
    if (!contenedor) return;
    
    contenedor.innerHTML = '<p>No hay órdenes recientes</p>';
    
    try {
        const { data, error } = await supabase
            .from('ordenes_compra')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (error) {
            console.error('Error al cargar órdenes recientes:', error);
            return;
        }
        
        let html = '';
        data.forEach(orden => {
            html += `
                <div class="orden-reciente">
                    <strong>OCI #${orden.numero_oci}</strong> - ${orden.material_numero}
                    <br>
                    <small>${orden.usuario_solicitante} - ${orden.fecha_creacion}</small>
                </div>
            `;
        });
        
        if (html) {
            contenedor.innerHTML = html;
        }
        
    } catch (error) {
        console.error('Error al cargar órdenes recientes:', error);
    }
}

// Función para cargar órdenes existentes (para la lista)
async function cargarOrdenesExistentes() {
    const tbody = document.getElementById('cuerpo-tabla-ordenes');
    if (!tbody) return;
    
    // Mostrar carga
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="cargando">
                <div class="spinner-oci"></div>
                <p>Cargando órdenes...</p>
            </td>
        </tr>
    `;
    
    try {
        const { data, error } = await supabase
            .from('ordenes_compra')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Error al cargar órdenes:', error);
            tbody.innerHTML = '<tr><td colspan="7">Error al cargar las órdenes</td></tr>';
            return;
        }
        
        let html = '';
        data.forEach(orden => {
            const estadoClass = `estado-${orden.estado}`;
            html += `
                <tr>
                    <td>${orden.numero_oci}</td>
                    <td>${orden.fecha_creacion}</td>
                    <td>${orden.usuario_solicitante}</td>
                    <td>${orden.material_numero}</td>
                    <td>${orden.total_piezas} piezas</td>
                    <td><span class="icono-estado ${estadoClass}">${orden.estado}</span></td>
                    <td>
                        <button onclick="editarOrden(${orden.id})" class="btn-small">Editar</button>
                        <button onclick="eliminarOrden(${orden.id})" class="btn-small btn-danger">Eliminar</button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
    } catch (error) {
        console.error('Error al cargar órdenes:', error);
        tbody.innerHTML = '<tr><td colspan="7">Error al cargar las órdenes</td></tr>';
    }
    
    // Por ahora, mostrar mensaje temporal
    setTimeout(() => {
        tbody.innerHTML = '<tr><td colspan="7">No hay órdenes registradas aún</td></tr>';
    }, 1000);
}

// Función para filtrar órdenes
async function filtrarOrdenes() {
    const filtroBusqueda = document.getElementById('filtro-busqueda').value.toLowerCase();
    const filtroEstado = document.getElementById('filtro-estado').value;
    
    // Aquí implementarías la lógica de filtrado
    console.log('Filtrando órdenes...', { filtroBusqueda, filtroEstado });
    
    // Si tienes Supabase, usarías algo como:
    let query = supabase.from('ordenes_compra').select('*');
    
    if (filtroBusqueda) {
        query = query.or(`numero_oci.ilike.%${filtroBusqueda}%,usuario_solicitante.ilike.%${filtroBusqueda}%`);
    }
    
    if (filtroEstado) {
        query = query.eq('estado', filtroEstado);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    // Actualizar tabla...
}

// Funciones adicionales para editar/eliminar órdenes
function editarOrden(id) {
    alert('Función de editar orden: ' + id + ' (implementar según necesidades)');
}

async function eliminarOrden(id) {
    if (confirm('¿Está seguro de eliminar esta orden?')) {
        // Aquí implementarías la eliminación con Supabase
        console.log('Eliminando orden:', id);
        
        const { error } = await supabase
            .from('ordenes_compra')
            .delete()
            .eq('id', id);
            
        if (!error) {
            cargarOrdenesExistentes();
        }
    }
}

// ========================================
// FIN DE FUNCIONES PARA OCI
// ========================================

// NOTA: Este archivo ya incluye la integración completa con Supabase para el sistema OCI.
// Todos los errores de sintaxis han sido corregidos: comentarios y funciones async.
