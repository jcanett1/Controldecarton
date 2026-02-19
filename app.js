
// Configuración del sistema de cartón con Supabase
const supabaseUrl = 'https://bdrxcilsuxbkpmolfbgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcnhjaWxzdXhia3Btb2xmYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNTQ0NTcsImV4cCI6MjA2OTgzMDQ1N30.iSO9EoOMEoi_VARxPqMd2yMUvQvTmKJntxJvwAl-TVs';

if (!window.supabaseClient) {
  window.supabaseClient = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
  );
}

var supabase = window.supabaseClient;

// Variables globales
let currentSection = 'dashboard';
let currentMovementType = '';
let currentEditingProductId = null;
let productos = [];
let inventario = [];
let movimientos = [];
let produccion = [];
let currentUser = null;
// Variables globales ya declaradas arriba

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
        await initializeApp();
        setupUserInterface();
      verificarRetornoOCI();
        
    } catch (error) {
        console.error('Error en verificación de autenticación:', error);
        redirectToLogin();
    }
}

function redirectToLogin() {
    console.log('🔄 Redirigiendo al login...');
    window.location.href = 'login_completo.html';
}

function clearAuthData() {
    localStorage.removeItem('current_user');
    currentUser = null;
}

function logout() {
    console.log('🚪 Cerrando sesión...');
    
    // Limpiar datos de autenticación
    clearAuthData();
    
    // Cerrar sesión de Supabase si existe
    supabase.auth.signOut().then(() => {
        console.log('✅ Sesión cerrada');
        window.location.href = 'login_completo.html';
    }).catch(error => {
        console.log('⚠️ Error cerrando sesión Supabase:', error);
        window.location.href = 'login_completo.html';
    });
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



// ===== FUNCIONES ORIGINALES DEL SISTEMA =====

async function initializeApp() {
    setupEventListeners();
    setTimeout(async () => {
        await loadDashboardData();
    }, 100);
}

function setupEventListeners() {
    // Sidebar navigation - CORREGIDO
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        const section = this.dataset.section;
        
        // ✨ NUEVO: Verificar si es OCI - abrir como archivo standalone
        if (section === 'oci-crear') {
    abrirOCIStandalone(section);
}else if (section) {
            showSection(section);
        }
    });
});

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            refreshCurrentSection();
        });
    }

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

// Navigation - CORREGIDA
function showSection(sectionName) {
    console.log('🔄 Cambiando a sección:', sectionName);
    
    // Actualizar menú activo
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeMenuItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeMenuItem) {
        activeMenuItem.classList.add('active');
    }

    // Mostrar sección correspondiente
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    updateHeader(sectionName);
    currentSection = sectionName;
    loadSectionData(sectionName);
    
    console.log('✅ Sección cambiada a:', sectionName);
}

function updateHeader(sectionName) {
    const titles = {
        dashboard: { title: 'Dashboard', subtitle: 'Resumen general del almacén' },
        productos: { title: 'Productos', subtitle: 'Gestión de productos de cartón' },
        inventario: { title: 'Inventario', subtitle: 'Control de stock y niveles' },
        movimientos: { title: 'Movimientos', subtitle: 'Historial de entradas y salidas' },
        'oci-crear': { title: 'Crear OCI', subtitle: 'Generar nueva orden de compra interna' },
        'oci-revisar': { title: 'Revisar OCI', subtitle: 'Aprobar o rechazar órdenes pendientes' },
        'oci-recibido': { title: 'Recibido', subtitle: 'Confirmar recepción física de materiales' },
        balance: { title: 'Balance Veritiv', subtitle: 'Gestión de balances y órdenes de compra' },
        produccion: { title: 'Producción', subtitle: 'Almacén en piso - Control de producción' },
        reportes: { title: 'Reportes', subtitle: 'Análisis y estadísticas' }
    };

    const info = titles[sectionName] || { title: 'Sistema', subtitle: 'Gestión de almacén' };
    
    const titleElement = document.getElementById('page-title');
    const subtitleElement = document.getElementById('page-subtitle');
    
    if (titleElement) titleElement.textContent = info.title;
    if (subtitleElement) subtitleElement.textContent = info.subtitle;
}

async function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'productos':
            await loadProductos();
            break;
        case 'inventario':
            await loadInventario();
            break;
        case 'movimientos':
            await loadMovimientos();
            break;
       case 'oci-crear':
    // Ya no se carga aquí - se abre en archivo standalone
    console.log('ℹ️ OCI se abre en archivo standalone (oci_simple.html)');
    break;
        case 'oci-revisar':
    // Ya no se carga aquí - se abre en archivo standalone
    console.log('ℹ️ OCI se abre en archivo standalone (oci_simple.html)');
    break;
        case 'oci-recibido':
    // Ya no se carga aquí - se abre en archivo standalone
    console.log('ℹ️ OCI se abre en archivo standalone (oci_simple.html)');
    break;
        case 'produccion':
            await loadProduccion();
            break;
        case 'balance':
            await cargarBalances();
            break;
        case 'reportes':
            break;
    }
}

function refreshCurrentSection() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Actualizando...';
    }
    
    setTimeout(() => {
        loadSectionData(currentSection);
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
        }
        showToast('Datos actualizados correctamente', 'success');
    }, 1000);
}


// ===== FUNCIONES PARA ABRIR OCI COMO ARCHIVO STANDALONE =====

/**
 * Abre oci_simple.html como archivo independiente
 * @param {string} tipo - Tipo de OCI: 'oci-crear', 'oci-revisar', 'oci-recibido'
 */
function abrirOCIStandalone(tipo) {
    console.log('🔗 Abriendo OCI standalone:', tipo);
    
    try {
        // Guardar datos en localStorage
        localStorage.setItem('oci_tipo', tipo);
        localStorage.setItem('usuario_actual', JSON.stringify(currentUser));
        
        console.log('✅ Datos guardados en localStorage');
        console.log('📁 Abriendo oci_simple.html...');
        
        // Abrir el archivo
        window.location.href = 'oci_simple.html';
        
    } catch (error) {
        console.error('❌ Error abriendo OCI:', error);
        showToast('Error abriendo OCI. Intenta de nuevo.', 'error');
    }
}

/**
 * Abre OCI en nueva pestaña (alternativa)
 */
function abrirOCIEnNuevaPestaña(tipo) {
    console.log('🔗 Abriendo OCI en nueva pestaña:', tipo);
    
    try {
        localStorage.setItem('oci_tipo', tipo);
        localStorage.setItem('usuario_actual', JSON.stringify(currentUser));
        
        window.open('oci_simple.html', '_blank');
        
    } catch (error) {
        console.error('❌ Error abriendo OCI:', error);
        showToast('Error abriendo OCI. Intenta de nuevo.', 'error');
    }
}

/**
 * Volver desde oci_simple.html al index
 */
function volverDesdeOCI() {
    console.log('🔙 Volviendo al index desde OCI');
    
    try {
        localStorage.removeItem('oci_tipo');
        sincronizarDatosOCI();
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('❌ Error volviendo:', error);
        window.location.href = 'index.html';
    }
}

/**
 * Sincronizar datos de OCI
 */
function sincronizarDatosOCI() {
    console.log('🔄 Sincronizando datos de OCI');
    
    try {
        if (currentSection && currentSection.startsWith('oci-')) {
            loadSectionData(currentSection);
            showToast('Datos sincronizados correctamente', 'success');
        }
    } catch (error) {
        console.error('⚠️ Error sincronizando:', error);
    }
}

/**
 * Verificar si venimos de oci_simple.html
 */
function verificarRetornoOCI() {
    console.log('🔍 Verificando retorno de OCI...');
    
    const ociTipo = localStorage.getItem('oci_tipo');
    
    if (ociTipo) {
        console.log('✅ Retorno detectado de OCI tipo:', ociTipo);
        showToast('Retorno desde OCI', 'info');
        sincronizarDatosOCI();
        localStorage.removeItem('oci_tipo');
    }
}


function abrirRevisarOCI() {
    console.log('🔗 Abriendo revisor de OCI');
    localStorage.setItem('usuario_actual', JSON.stringify(currentUser));
    window.location.href = 'oci_revisar.html';
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

// ===== FUNCIÓN loadInventario CON VALIDACIÓN DE DOM =====

async function loadInventario(filter = 'all') {
    try {
        console.log('🔄 Cargando inventario con filtro:', filter);
        
        // Validación: Verificar que tu elemento inventario-list existe
        const inventarioList = document.getElementById('inventario-list');
        
        if (!inventarioList) {
            console.error('❌ Elemento inventario-list no encontrado');
            showToast('Error: Elemento de inventario no encontrado', 'error');
            return;
        }
        
        // Mostrar estado de carga en tu estructura
        inventarioList.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Cargando inventario...</p>
            </div>
        `;
        
        // Preparar consulta (mantén tu código actual de Supabase)
        let query = supabase
            .from('inventario')
            .select(`
                id,
                producto_id,
                cantidad_actual,
                cantidad_minima,
                cantidad_maxima,
                ultima_actualizacion,
                producto:productos_carton(*)
            `)
            .order('ultima_actualizacion', { ascending: false });
        
        // Filtros
        if (filter === 'stock-bajo') {
            const { data: allData, error } = await query;
            if (error) throw error;
            
            const filteredData = allData.filter(item => 
                item.cantidad_actual <= item.cantidad_minima
            );
            inventario = filteredData;
            updateInventarioTable();
            console.log('✅ Inventario de stock bajo cargado:', filteredData.length, 'items');
            return;
        } else if (filter === 'sin-stock') {
            query = query.eq('cantidad_actual', 0);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        inventario = data || [];
        updateInventarioTable();
        
    } catch (error) {
        console.error('❌ Error cargando inventario:', error);
        
        // Mostrar error en tu estructura
        const inventarioList = document.getElementById('inventario-list');
        if (inventarioList) {
            inventarioList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error cargando inventario</h4>
                    <p>${error.message}</p>
                    <button class="btn-retry" onclick="loadInventario()">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }
        
        showToast('Error cargando inventario: ' + error.message, 'error');
    }
}
// ===== FUNCIÓN MEJORADA DE DIAGNÓSTICO COMPLETO =====

async function diagnosticoCompletoInventario() {
    console.clear();
    console.log('🚀 === DIAGNÓSTICO COMPLETO DE INVENTARIO ===');
    console.log('Fecha:', new Date().toLocaleString());
    console.log('URL:', window.location.href);
    console.log('');
    
    const resultados = {
        fecha: new Date().toISOString(),
        problemas: [],
        advertencias: [],
        exitosos: [],
        estado: 'OK'
    };
    
    try {
        // 1. Diagnóstico de DOM
        console.log('🔍 1. DIAGNÓSTICO DE DOM');
        const elementos = [
            'inventario-section',
            'inventario-table-body', 
            'inventario-filter',
            'page-title',
            'page-subtitle'
        ];
        
        elementos.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                console.log(`  ✅ ${id}: Encontrado (${elemento.tagName})`);
                resultados.exitosos.push(`Elemento ${id} disponible`);
            } else {
                console.log(`  ❌ ${id}: NO ENCONTRADO`);
                resultados.problemas.push(`Elemento DOM ${id} no existe`);
            }
        });
        
        // 2. Diagnóstico de JavaScript
        console.log('\n🔍 2. DIAGNÓSTICO DE JAVASCRIPT');
        const variables = ['inventario', 'currentUser', 'supabase'];
        const funciones = ['loadInventario', 'updateInventarioTable', 'showToast', 'formatDate'];
        
        variables.forEach(variable => {
            if (typeof window[variable] !== 'undefined') {
                console.log(`  ✅ Variable ${variable}: ${typeof window[variable]}`);
                if (variable === 'inventario' && Array.isArray(window[variable])) {
                    console.log(`     Elementos: ${window[variable].length}`);
                }
                resultados.exitosos.push(`Variable ${variable} disponible`);
            } else {
                console.log(`  ❌ Variable ${variable}: NO DEFINIDA`);
                resultados.problemas.push(`Variable ${variable} no definida`);
            }
        });
        
        funciones.forEach(funcion => {
            if (typeof window[funcion] === 'function') {
                console.log(`  ✅ Función ${funcion}: Disponible`);
                resultados.exitosos.push(`Función ${funcion} disponible`);
            } else {
                console.log(`  ❌ Función ${funcion}: NO ENCONTRADA`);
                resultados.problemas.push(`Función ${funcion} no disponible`);
            }
        });
        
        // 3. Diagnóstico de Supabase
        console.log('\n🔍 3. DIAGNÓSTICO DE SUPABASE');
        try {
            const { data, error } = await supabase
                .from('inventario')
                .select('count', { count: 'exact', head: true });
                
            if (error) {
                console.log(`  ❌ Error de conexión: ${error.message}`);
                resultados.problemas.push(`Error de Supabase: ${error.message}`);
            } else {
                console.log(`  ✅ Conexión OK - Registros: ${data}`);
                resultados.exitosos.push(`Conexión Supabase OK (${data} registros)`);
            }
        } catch (error) {
            console.log(`  ❌ Error de red: ${error.message}`);
            resultados.problemas.push(`Error de red: ${error.message}`);
        }
        
        // 4. Diagnóstico de estructura HTML
        console.log('\n🔍 4. DIAGNÓSTICO DE ESTRUCTURA HTML');
        const inventarioSection = document.getElementById('inventario-section');
        if (inventarioSection) {
            const tablas = inventarioSection.querySelectorAll('table');
            console.log(`  ✅ Tablas en inventario-section: ${tablas.length}`);
            
            tablas.forEach((tabla, i) => {
                const thead = tabla.querySelector('thead');
                const tbody = tabla.querySelector('tbody');
                const tbodyId = tbody?.id;
                
                console.log(`  Tabla ${i + 1}:`);
                console.log(`    - thead: ${thead ? '✅' : '❌'}`);
                console.log(`    - tbody: ${tbody ? '✅' : '❌'}`);
                console.log(`    - tbody.id: ${tbodyId || 'NINGUNO'}`);
                
                if (!thead || !tbody) {
                    resultados.problemas.push(`Tabla ${i + 1} incompleta`);
                }
                
                if (tbodyId !== 'inventario-table-body') {
                    resultados.advertencias.push(`ID de tbody incorrecto: "${tbodyId}"`);
                }
            });
        }
        
        // 5. Probar función loadInventario
        console.log('\n🔍 5. PROBANDO FUNCIÓN LOADINVENTARIO');
        try {
            await loadInventario();
            console.log('  ✅ loadInventario() ejecutada exitosamente');
            resultados.exitosos.push('Función loadInventario ejecutada');
        } catch (error) {
            console.log(`  ❌ Error en loadInventario(): ${error.message}`);
            resultados.problemas.push(`Error en loadInventario: ${error.message}`);
        }
        
        // 6. Resumen final
        console.log('\n📊 === RESUMEN FINAL ===');
        console.log(`Estado general: ${resultados.estado}`);
        console.log(`Problemas: ${resultados.problemas.length}`);
        console.log(`Advertencias: ${resultados.advertencias.length}`);
        console.log(`Exitosos: ${resultados.exitosos.length}`);
        
        if (resultados.problemas.length > 0) {
            console.log('\n❌ PROBLEMAS ENCONTRADOS:');
            resultados.problemas.forEach((problema, i) => {
                console.log(`  ${i + 1}. ${problema}`);
            });
        }
        
        if (resultados.advertencias.length > 0) {
            console.log('\n⚠️ ADVERTENCIAS:');
            resultados.advertencias.forEach((advertencia, i) => {
                console.log(`  ${i + 1}. ${advertencia}`);
            });
        }
        
        // Mostrar resultado final
        if (resultados.problemas.length === 0) {
            console.log('\n🎉 ¡DIAGNÓSTICO COMPLETADO - TODO OK!');
            showToast('Diagnóstico completado - Sistema funcionando correctamente', 'success');
        } else {
            console.log('\n🚨 DIAGNÓSTICO COMPLETADO - SE ENCONTRARON PROBLEMAS');
            showToast(`Diagnóstico: ${resultados.problemas.length} problemas encontrados`, 'error');
        }
        
        return resultados;
        
    } catch (error) {
        console.error('💥 ERROR DURANTE EL DIAGNÓSTICO:', error);
        resultados.problemas.push('Error durante diagnóstico: ' + error.message);
        resultados.estado = 'ERROR';
        return resultados;
    }
}

// ===== EXPORTAR FUNCIONES =====
window.loadInventario = loadInventario;
window.diagnosticoCompletoInventario = diagnosticoCompletoInventario;

async function loadProductosForMovement() {
    try {
        const { data, error } = await supabase
            .from('inventario')
            .select('*, producto:productos_carton(*)')
            .gt('cantidad_actual', 0); // Solo productos con stock

        if (error) throw error;

        const selector = document.getElementById('movement-producto');
        if (selector) {
            selector.innerHTML = '<option value="">Selecciona un producto</option>';
            
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.producto_id;
                option.textContent = `${item.producto.numero_parte} - ${item.producto.descripcion}`;
                option.dataset.stock = item.cantidad_actual;
                option.dataset.minStock = item.cantidad_minima;
                selector.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
        showToast('Error cargando productos', 'error');
    }
}






async function showMovementModal(type) {
    if (currentUser && currentUser.rol !== 'ADMIN') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }

    currentMovementType = type;
    
    // Configurar el modal según el tipo
    const modalTitle = document.getElementById('movement-modal-title');
    const salidaOptions = document.getElementById('salida-options');
    
    if (modalTitle && salidaOptions) {
        if (type === 'ENTRADA') {
            modalTitle.textContent = 'Registrar Entrada';
            salidaOptions.style.display = 'none';
        } else {
            modalTitle.textContent = 'Registrar Salida';
            salidaOptions.style.display = 'block';
        }
    }

    // Limpiar formulario
    const movementForm = document.getElementById('movement-form');
    if (movementForm) {
        movementForm.reset();
    }
    
    const stockInfo = document.getElementById('stock-info');
    if (stockInfo) {
        stockInfo.style.display = 'none';
    }

    // Cargar productos en el selector
    await loadProductosForMovement();

    // Mostrar modal de forma segura
    const modalOverlay = document.getElementById('modal-overlay');
    const movementModal = document.getElementById('movement-modal');
    
    if (modalOverlay) {
        modalOverlay.style.display = 'flex';
    }
    
    if (movementModal) {
        movementModal.style.display = 'block';
    }

    // Ocultar otros modales de forma segura
    const otherModals = [
        'add-product-modal',
        'edit-product-modal',
        'adjust-modal',
        'return-inventory-modal',
        'adjust-produccion-modal',
        'add-inventory-modal'
    ];
    
    otherModals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    });
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

    const totalProductosEl = document.getElementById('total-productos');
    const totalStockEl = document.getElementById('total-stock');
    const stockBajoEl = document.getElementById('stock-bajo');
    const totalProduccionEl = document.getElementById('total-produccion');

    if (totalProductosEl) totalProductosEl.textContent = totalProductos;
    if (totalStockEl) totalStockEl.textContent = totalStock.toLocaleString();
    if (stockBajoEl) stockBajoEl.textContent = stockBajo;
    if (totalProduccionEl) totalProduccionEl.textContent = totalProduccion.toLocaleString();
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
    if (!stockBajoContainer) return;
    
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
                <h4>${item.producto?.numero_parte || 'N/A'}</h4>
                <p>${item.producto?.descripcion || 'Sin descripción'}</p>
            </div>
            <div class="stock-quantity ${item.cantidad_actual === 0 ? 'text-danger' : 'text-warning'}">
                ${item.cantidad_actual} / ${item.cantidad_minima}
            </div>
        </div>
    `).join('');
}

function updateMovimientosRecientes() {
    const movimientosContainer = document.getElementById('movimientos-recientes');
    if (!movimientosContainer) return;
    
    if (movimientos.length === 0) {
        movimientosContainer.innerHTML = '<p class="text-center text-gray-500">No hay movimientos recientes</p>';
        return;
    }

    movimientosContainer.innerHTML = movimientos.slice(0, 5).map(mov => `
        <div class="movement-item">
            <div class="movement-item-info">
                <h4>${mov.producto?.numero_parte || 'N/A'}</h4>
                <p>${formatDate(mov.fecha_movimiento)} - ${mov.usuario}</p>
            </div>
            <div class="movement-${mov.tipo_movimiento.toLowerCase()}">
                ${mov.tipo_movimiento === 'ENTRADA' ? '+' : '-'}${mov.cantidad}
            </div>
        </div>
    `).join('');
}

async function updateProduct() {
    if (currentUser && currentUser.rol !== 'ADMIN') {
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



function updateProductosTable() {
    const tbody = document.getElementById('productos-table-body');
    if (!tbody) return;
    
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
                ${currentUser && currentUser.rol === 'ADMIN' ? `
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

// ===== FUNCIÓN updateInventarioTable CORREGIDA =====

function updateInventarioTable() {
    console.log('🔄 Actualizando tabla de inventario...');
    
    // Usar tu elemento específico inventario-list
    const inventarioList = document.getElementById('inventario-list');
    
    if (!inventarioList) {
        console.error('❌ Elemento inventario-list no encontrado en el DOM');
        return;
    }
    
    console.log('✅ Elemento inventario-list encontrado');
    
    if (inventario.length === 0) {
        inventarioList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-boxes"></i>
                <p>No hay productos en el inventario</p>
                <small>Agrega productos para comenzar a gestionar tu inventario</small>
            </div>
        `;
        return;
    }

    // Generar HTML compatible con tu estructura
    const htmlContent = `
        <div class="inventory-table">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad Actual</th>
                        <th>Stock Mínimo</th>
                        <th>Stock Máximo</th>
                        <th>Estado</th>
                        <th>Última Actualización</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${inventario.map(item => `
                        <tr>
                            <td>
                                <div class="product-info">
                                    <strong>${item.producto?.numero_parte || 'N/A'}</strong><br>
                                    <small>${item.producto?.descripcion || 'Sin descripción'}</small>
                                </div>
                            </td>
                            <td>
                                <span class="quantity-badge ${getStockStatus(item)}">
                                    ${item.cantidad_actual}
                                </span>
                            </td>
                            <td>${item.cantidad_minima}</td>
                            <td>${item.cantidad_maxima}</td>
                            <td>
                                <span class="status-badge ${getStockStatus(item)}">
                                    ${getStockStatusText(item)}
                                </span>
                            </td>
                            <td>
                                <small>${formatDate(item.ultima_actualizacion)}</small>
                            </td>
                            <td>
                                <div class="inventory-actions">
                                    ${currentUser && currentUser.rol === 'ADMIN' ? `
                                        <button class="btn-action adjust" onclick="showAdjustModal(${item.producto_id})" title="Ajustar inventario">
                                            <i class="fas fa-cog"></i>
                                        </button>
                                    ` : '<span class="text-muted">Solo lectura</span>'}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    inventarioList.innerHTML = htmlContent;
    console.log('✅ Tabla de inventario actualizada con', inventario.length, 'items');
}

// ===== FUNCIÓN AUXILIAR: Crear tabla si no existe =====
function crearTablaInventarioSiNoExiste() {
    console.log('🔧 Creando estructura de tabla de inventario...');
    
    // Buscar el contenedor de la sección inventario
    const inventarioSection = document.getElementById('inventario-section');
    
    if (!inventarioSection) {
        console.error('❌ No se encontró la sección inventario-section');
        showToast('Error: Sección de inventario no encontrada en el DOM', 'error');
        return;
    }
    
    // Crear la tabla completa
    const tablaHTML = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad Actual</th>
                        <th>Stock Mínimo</th>
                        <th>Stock Máximo</th>
                        <th>Estado</th>
                        <th>Última Actualización</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="inventario-table-body">
                    <tr><td colspan="7" class="loading">Cargando inventario...</td></tr>
                </tbody>
            </table>
        </div>
    `;
    
    // Insertar la tabla en la sección
    inventarioSection.insertAdjacentHTML('beforeend', tablaHTML);
    console.log('✅ Tabla de inventario creada automáticamente');
    
    // Intentar actualizar la tabla nuevamente
    setTimeout(() => {
        updateInventarioTable();
    }, 100);
}

// ===== FUNCIÓN DE DIAGNÓSTICO MEJORADA =====
async function diagnosticarTablaInventario() {
    console.log('🔍 === DIAGNÓSTICO DE TABLA DE INVENTARIO ===');
    
    const problemas = [];
    
    // 1. Verificar elementos del DOM
    console.log('1️⃣ Verificando elementos del DOM...');
    const elementosRequeridos = [
        'inventario-section',
        'inventario-table-body',
        'inventario-filter'
    ];
    
    elementosRequeridos.forEach(elementoId => {
        const elemento = document.getElementById(elementoId);
        if (elemento) {
            console.log(`✅ ${elementoId}: Encontrado (${elemento.tagName})`);
        } else {
            console.warn(`⚠️ ${elementoId}: NO ENCONTRADO`);
            problemas.push(`Elemento ${elementoId} no existe en el DOM`);
        }
    });
    
    // 2. Verificar estructura HTML
    console.log('2️⃣ Verificando estructura HTML...');
    const inventarioSection = document.getElementById('inventario-section');
    if (inventarioSection) {
        const tablas = inventarioSection.querySelectorAll('table');
        console.log(`✅ Tablas encontradas en inventario-section: ${tablas.length}`);
        
        tablas.forEach((tabla, i) => {
            const tbody = tabla.querySelector('tbody');
            const thead = tabla.querySelector('thead');
            console.log(`  Tabla ${i + 1}: thead=${!!thead}, tbody=${!!tbody}`);
            
            if (!thead) {
                console.warn(`⚠️ Tabla ${i + 1}: Sin thead`);
                problemas.push(`Tabla ${i + 1} sin thead`);
            }
            
            if (!tbody) {
                console.warn(`⚠️ Tabla ${i + 1}: Sin tbody`);
                problemas.push(`Tabla ${i + 1} sin tbody`);
            }
        });
    }
    
    // 3. Verificar variables JavaScript
    console.log('3️⃣ Verificando variables JavaScript...');
    console.log(`✅ Variable inventario: ${typeof inventario} con ${inventario?.length || 0} elementos`);
    console.log(`✅ Variable currentUser: ${typeof currentUser} (${currentUser?.rol || 'sin rol'})`);
    
    // 4. Verificar funciones
    console.log('4️⃣ Verificando funciones...');
    const funciones = ['updateInventarioTable', 'loadInventario', 'formatDate', 'getStockStatus'];
    funciones.forEach(funcion => {
        if (typeof window[funcion] === 'function' || typeof eval(funcion) === 'function') {
            console.log(`✅ ${funcion}: Disponible`);
        } else {
            console.warn(`⚠️ ${funcion}: NO ENCONTRADA`);
            problemas.push(`Función ${funcion} no disponible`);
        }
    });
    
    // 5. Verificar datos en Supabase
    console.log('5️⃣ Verificando datos en Supabase...');
    try {
        const { data, error } = await supabase
            .from('inventario')
            .select('count', { count: 'exact', head: true });
            
        if (error) {
            console.error('❌ Error consultando inventario:', error);
            problemas.push('Error consultando inventario en Supabase: ' + error.message);
        } else {
            console.log(`✅ Datos en inventario: ${data} registros`);
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        problemas.push('Error de conexión con Supabase');
    }
    
    // 6. Resumen final
    console.log('📊 === RESUMEN ===');
    if (problemas.length === 0) {
        console.log('✅ No se encontraron problemas');
        showToast('Diagnóstico completado - Todo OK', 'success');
    } else {
        console.log(`❌ ${problemas.length} problemas encontrados:`);
        problemas.forEach((problema, i) => {
            console.log(`  ${i + 1}. ${problema}`);
        });
        showToast(`Diagnóstico completado - ${problemas.length} problemas encontrados`, 'error');
    }
    
    return problemas;
}

// ===== FUNCIÓN PARA FORZAR CREACIÓN DE TABLA =====
function forzarCreacionTabla() {
    console.log('🔧 Forzando creación de tabla de inventario...');
    
    // Eliminar tabla existente si hay problemas
    const tablaExistente = document.querySelector('#inventario-section table');
    if (tablaExistente) {
        console.log('🗑️ Eliminando tabla existente con problemas...');
        tablaExistente.remove();
    }
    
    // Crear nueva tabla
    crearTablaInventarioSiNoExiste();
    
    showToast('Tabla de inventario recreada', 'success');
}

// ===== FUNCIONES DE DIAGNÓSTICO PARA LA CONSOLA =====
window.diagnosticoTablaInventario = diagnosticarTablaInventario;
window.forzarCreacionTabla = forzarCreacionTabla;
window.crearTablaInventarioSiNoExiste = crearTablaInventarioSiNoExiste;
function updateMovimientosTable() {
    const tbody = document.getElementById('movimientos-table-body');
    if (!tbody) return;
    
    if (movimientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No hay movimientos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = movimientos.map(mov => `
        <tr>
            <td>${formatDate(mov.fecha_movimiento)}</td>
            <td>
                <strong>${mov.producto?.numero_parte || 'N/A'}</strong><br>
                <small>${mov.producto?.descripcion || 'Sin descripción'}</small>
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
    if (!tbody) return;
    
    if (produccion.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No hay productos en producción</td></tr>';
        return;
    }

    tbody.innerHTML = produccion.map(item => `
        <tr>
            <td>
                <strong>${item.producto?.numero_parte || 'N/A'}</strong><br>
                <small>${item.producto?.descripcion || 'Sin descripción'}</small>
            </td>
            <td><strong>${item.cantidad_produccion}</strong></td>
            <td>${formatDate(item.fecha_transferencia)}</td>
            <td>${item.transferido_por}</td>
            <td>${item.motivo}</td>
            <td>
                ${currentUser && currentUser.rol === 'ADMIN' ? `
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
    if (currentUser && currentUser.rol !== 'ADMIN') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    console.log('🔄 Abriendo modal de agregar producto...');
    
    // Cerrar todos los modales primero
    closeAllModals();
    
    // Limpiar formulario
    const form = document.getElementById('add-product-form');
    if (form) {
        form.reset();
    }
    
    // Mostrar modal específico
    const modalOverlay = document.getElementById('modal-overlay');
    const addProductModal = document.getElementById('add-product-modal');
    
    if (modalOverlay && addProductModal) {
        modalOverlay.style.display = 'flex';
        addProductModal.style.display = 'block';
    }
    
    console.log('✅ Modal de agregar producto abierto');
}

// ===== FUNCIÓN CORREGIDA: showAddInventoryModal =====
async function showAddInventoryModal() {
    if (currentUser && currentUser.rol !== 'ADMIN') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    console.log('🔄 Abriendo modal de agregar inventario...');
    
    // Cerrar todos los modales primero
    closeAllModals();
    
    // Limpiar formulario
    const form = document.getElementById('add-inventory-form');
    if (form) {
        form.reset();
        console.log('✅ Formulario de inventario limpiado');
    } else {
        console.error('❌ No se encontró el formulario add-inventory-form');
    }
    
    // Cargar productos disponibles
    await loadProductosForInventory();
    
    // Mostrar modal específico
    const modalOverlay = document.getElementById('modal-overlay');
    const addInventoryModal = document.getElementById('add-inventory-modal');
    
    if (modalOverlay && addInventoryModal) {
        modalOverlay.style.display = 'flex';
        addInventoryModal.style.display = 'block';
        console.log('✅ Modal de agregar inventario abierto');
    } else {
        console.error('❌ No se encontraron los elementos del modal:', {
            modalOverlay: !!modalOverlay,
            addInventoryModal: !!addInventoryModal
        });
        showToast('Error: Modal no encontrado en el DOM', 'error');
    }
}

// ===== FUNCIÓN NUEVA: closeAllModals =====
function closeAllModals() {
    // Ocultar overlay
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
    }
    
    // Ocultar todos los modales específicos
    const modals = [
        'add-product-modal',
        'add-inventory-modal',
        'edit-product-modal',
        'movement-modal',
        'adjust-modal',
        'return-inventory-modal',
        'adjust-produccion-modal'
    ];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    });
}

// ===== FUNCIÓN CORREGIDA: loadProductosForInventory =====
async function loadProductosForInventory() {
    try {
        console.log('🔄 Cargando productos disponibles para inventario...');
        
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
            selector.innerHTML = '<option value="">Selecciona un producto...</option>';
            
            productos.forEach(producto => {
                const option = document.createElement('option');
                option.value = producto.id;
                option.textContent = `${producto.numero_parte} - ${producto.descripcion}`;
                selector.appendChild(option);
            });
            
            console.log(`✅ ${productos.length} productos cargados en el selector`);
        } else {
            console.error('❌ No se encontró el elemento inventory-producto');
            showToast('Error: Selector de productos no encontrado', 'error');
        }
        
    } catch (error) {
        console.error('Error cargando productos para inventario:', error);
        showToast('Error cargando productos disponibles', 'error');
    }
}


// ===== FUNCIÓN CORREGIDA: addInventory =====
async function addInventory() {
    if (currentUser && currentUser.rol !== 'ADMIN') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    console.log('🔄 Agregando inventario...');
    
    const form = document.getElementById('add-inventory-form');
    if (!form) {
        console.error('❌ No se encontró el formulario add-inventory-form');
        showToast('Error: Formulario no encontrado', 'error');
        return;
    }
    
    const formData = new FormData(form);
    
    // Revisar nombres de los campos del formulario
    const productoId = parseInt(formData.get('producto_id')) || parseInt(formData.get('inventory_producto'));
    const cantidadInicial = parseInt(formData.get('cantidad_inicial')) || parseInt(formData.get('initial_quantity')) || 0;
    const cantidadMinima = parseInt(formData.get('cantidad_minima')) || parseInt(formData.get('min_quantity')) || 10;
    const cantidadMaxima = parseInt(formData.get('cantidad_maxima')) || parseInt(formData.get('max_quantity')) || 1000;
    
    console.log('📝 Datos del formulario:', {
        productoId,
        cantidadInicial,
        cantidadMinima,
        cantidadMaxima
    });
    
    // Validaciones
    if (!productoId || isNaN(productoId)) {
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
            .maybeSingle(); // Usar maybeSingle() en lugar de single()
        
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 es "no rows returned"
            throw checkError;
        }
        
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
                ultima_actualizacion: new Date().toISOString()
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
                    usuario: currentUser.nombre_completo,
                    motivo: 'Stock inicial del inventario',
                    fecha_movimiento: new Date().toISOString()
                }]);
            
            if (movimientoError) {
                console.warn('Error registrando movimiento inicial:', movimientoError);
                // No fallar la operación completa por este error
            }
        }
        
        showToast('Inventario agregado exitosamente', 'success');
        closeModal();
        
        // Recargar datos si estamos en la sección correspondiente
        if (currentSection === 'inventario') {
            loadInventario();
        } else {
            loadDashboardData();
        }
        
        console.log('✅ Inventario agregado exitosamente');
        
    } catch (error) {
        console.error('Error agregando inventario:', error);
        if (error.code === '23505') {
            showToast('Ya existe inventario para este producto', 'error');
        } else {
            showToast(`Error agregando inventario: ${error.message}`, 'error');
        }
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

// Modal Functions - CORREGIDAS
function closeModal() {
    closeAllModals();
}


async function showEditProductModal(productId) {
    if (currentUser && currentUser.rol !== 'ADMIN') {
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

        // Mostrar modal overlay
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'flex';
        }

        // Mostrar modal de edición
        const editModal = document.getElementById('edit-product-modal');
        if (editModal) {
            editModal.style.display = 'block';
        }

        // Ocultar otros modales de forma segura
        const modalsToHide = [
            'add-product-modal',
            'movement-modal', // Corregí el typo de 'movement-modal'
            'adjust-modal',
            'return-inventory-modal',
            'adjust-produccion-modal',
            'add-inventory-modal'
        ];
        
        modalsToHide.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        });

    } catch (error) {
        console.error('Error al cargar los datos del producto:', error);
        showToast('Error al cargar los datos del producto', 'error');
    }
}






// Funciones adicionales que pueden estar en el código original
function editProduct(productId) {
    showEditProductModal(productId);
}

function showAdjustModal(productId) {
    if (currentUser && currentUser.rol !== 'ADMIN') {
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

// ===== FUNCIONES PARA OCI (ORDENES DE COMPRA INTERNAS) =====

// Variables globales para OCI
let detallesOCI = [];
let facturaFile = null;

// Inicializar sección OCI
async function initializeOCISection() {
    if (currentSection === 'oci-crear') {
        // Establecer fecha actual
        const now = new Date();
        const fechaISO = now.toISOString().slice(0, 16);
        document.getElementById('fecha-oci').value = fechaISO;
        
        // Cargar materiales de cartón
        await cargarMaterialesOCICarton();
        
        // Limpiar detalles
        detallesOCI = [];
        actualizarListaDetallesOCI();
        
        // Cargar órdenes recientes
        await cargarOrdenesRecientes();
        
    } else if (currentSection === 'oci-revisar') {
        await cargarOCIPendientes();
    } else if (currentSection === 'oci-recibido') {
        await cargarOCIPendientesRecibir();
    }
}

// Función para agregar detalle OCI
async function agregarDetalleOCI() {
    const container = document.getElementById('detalles-oci-container');
    
    // Eliminar estado vacío si existe
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    const detalleId = Date.now(); // ID temporal
    
    const detalleHTML = `
        <div class="detalle-oci-item" id="detalle-${detalleId}">
            <div class="detalle-header">
                <div class="detalle-producto">Producto</div>
                <div class="detalle-controls">
                    <button type="button" class="btn btn-sm btn-outline" onclick="eliminarDetalleOCI(${detalleId})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="detalle-grid">
                <div class="form-group">
                    <label>Producto</label>
                    <select id="producto-${detalleId}" class="form-control" required>
                        <option value="">Seleccionar producto...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Cantidad Tarimas</label>
                    <input type="number" id="tarimas-${detalleId}" class="form-control" 
                           min="1" value="1" required onchange="calcularTotalOCI(${detalleId})">
                </div>
                <div class="form-group">
                    <label>Unidades/Tarima</label>
                    <input type="number" id="unidades-tarima-${detalleId}" class="form-control" 
                           value="250" min="1" required onchange="calcularTotalOCI(${detalleId})">
                </div>
                <div class="form-group">
                    <label>Total Unidades</label>
                    <input type="number" id="total-unidades-${detalleId}" class="form-control" 
                           readonly>
                </div>
            </div>
            <div class="form-group">
                <label>Observaciones</label>
                <textarea id="observaciones-${detalleId}" class="form-control" 
                         rows="2" placeholder="Comentarios para este producto..."></textarea>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', detalleHTML);
    await cargarProductosParaDetalle(detalleId);
}

// Función para cargar productos en select
async function cargarProductosParaDetalle(detalleId) {
    const select = document.getElementById(`producto-${detalleId}`);
    
    if (productos.length === 0) {
        // Cargar productos si no están cargados
        await loadProductos();
        populateSelect(select);
    } else {
        populateSelect(select);
    }
    
    function populateSelect(selectElement) {
        selectElement.innerHTML = '<option value="">Seleccionar producto...</option>';
        productos.filter(p => p.activo).forEach(producto => {
            const option = document.createElement('option');
            option.value = producto.id;
            option.textContent = `${producto.numero_parte} - ${producto.descripcion}`;
            selectElement.appendChild(option);
        });
    }
}

// Función para calcular total unidades
function calcularTotalOCI(detalleId) {
    const tarimas = parseInt(document.getElementById(`tarimas-${detalleId}`).value) || 0;
    const unidadesTarima = parseInt(document.getElementById(`unidades-tarima-${detalleId}`).value) || 0;
    const total = tarimas * unidadesTarima;
    
    document.getElementById(`total-unidades-${detalleId}`).value = total;
}

// Función para eliminar detalle OCI
function eliminarDetalleOCI(detalleId) {
    const elemento = document.getElementById(`detalle-${detalleId}`);
    if (elemento) {
        elemento.remove();
        
        // Mostrar estado vacío si no hay más detalles
        const container = document.getElementById('detalles-oci-container');
        if (container.children.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plus-circle"></i>
                    <p>No hay productos agregados</p>
                    <small>Haga clic en "Agregar Producto" para comenzar</small>
                </div>
            `;
        }
    }
}

// Función para actualizar lista de detalles
function actualizarListaDetallesOCI() {
    // Esta función ya está implementada en las otras funciones
}

// Función para manejar subida de factura
function handleFacturaUpload() {
    const fileInput = document.getElementById('oci-factura');
    const file = fileInput.files[0];
    
    if (file) {
        if (file.type !== 'application/pdf') {
            showToast('Solo se permiten archivos PDF', 'error');
            fileInput.value = '';
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB
            showToast('El archivo no puede ser mayor a 10MB', 'error');
            fileInput.value = '';
            return;
        }
        
        facturaFile = file;
        document.getElementById('factura-name').textContent = file.name;
        document.getElementById('factura-info').style.display = 'block';
        showToast('Factura seleccionada correctamente', 'success');
    }
}

// Función para remover factura
function removerFactura() {
    document.getElementById('oci-factura').value = '';
    document.getElementById('factura-info').style.display = 'none';
    facturaFile = null;
    showToast('Factura removida', 'info');
}

// Función para crear OCI
// Función para guardar OCI usando Supabase
async function guardarOCI() {
    // Verificar que hay un usuario autenticado
    if (!currentUser) {
        showToast('Debe estar autenticado para crear una OCI', 'error');
        return;
    }
    
    // Verificar que hay materiales seleccionados
    if (detallesOCI.length === 0) {
        showToast('Debe seleccionar al menos un material', 'error');
        return;
    }
    
    try {
        // Generar número de OCI automático
        const fecha = new Date();
        const año = fecha.getFullYear().toString().slice(-2);
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const dia = fecha.getDate().toString().padStart(2, '0');
        const timestamp = Date.now().toString().slice(-6);
        const numero_oci = `OCI-${año}${mes}${dia}-${timestamp}`;
        
        // Crear las OCI para cada material seleccionado
        for (const detalle of detallesOCI) {
            const { material_numero, material_descripcion, piezas_por_pallet, cantidad_pallets } = detalle;
            
            const { data, error } = await supabase
                .from('ordenes_compra')
                .insert({
                    numero_oci: numero_oci,
                    usuario_solicitante_id: currentUser.id,
                    material_numero: material_numero,
                    piezas_por_pallet: piezas_por_pallet,
                    cantidad_pallets: cantidad_pallets,
                    estado: 'PENDIENTE',
                    observaciones: ''
                });
            
            if (error) {
                console.error('Error insertando OCI:', error);
                showToast(`Error al crear OCI: ${error.message}`, 'error');
                return;
            }
        }
        
        showToast('OCI(s) creada(s) exitosamente', 'success');
        
        // Limpiar formulario
        limpiarFormularioOCI();
        
        // Actualizar la lista de órdenes recientes si estamos en esa sección
        if (currentSection === 'oci-crear') {
            await cargarOrdenesRecientes();
        }
        
    } catch (error) {
        console.error('Error creando OCI:', error);
        showToast('Error al crear la OCI', 'error');
    }
}

// Función para subir factura OCI
async function subirFacturaOCI(ociId) {
    try {
        const formData = new FormData();
        formData.append('factura', facturaFile);
        formData.append('usuario', document.getElementById('oci-usuario').value.trim());
        
        const response = await fetch(`/api/oci/${ociId}/factura`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Factura subida exitosamente', 'success');
        } else {
            showToast(`Error subiendo factura: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error subiendo factura:', error);
        showToast('Error de conexión al subir factura', 'error');
    }
}

// Función para limpiar formulario OCI
function limpiarFormularioOCI() {
    document.getElementById('oci-form').reset();
    document.getElementById('detalles-oci-container').innerHTML = `
        <div class="empty-state">
            <i class="fas fa-plus-circle"></i>
            <p>No hay productos agregados</p>
            <small>Haga clic en "Agregar Producto" para comenzar</small>
        </div>
    `;
    removerFactura();
    detallesOCI = [];
}

// Función para cargar OCI pendientes
async function cargarOCIPendientes() {
    const container = document.getElementById('cuerpo-tabla-ordenes');
    
    try {
        // Consultar OCI pendientes de Supabase
        const { data: ordenes, error } = await supabase
            .from('ordenes_compra')
            .select(`
                *,
                usuarios_carton!ordenes_compra_usuario_solicitante_id_fkey (
                    username,
                    nombre_completo
                )
            `)
            .eq('estado', 'PENDIENTE')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error cargando OCI pendientes:', error);
            showToast(`Error cargando OCI: ${error.message}`, 'error');
            return;
        }
        
        mostrarListaOCIPendientes(ordenes || []);
        actualizarEstadisticasOCI(ordenes || []);
        
    } catch (error) {
        console.error('Error cargando OCI pendientes:', error);
        showToast('Error de conexión', 'error');
    }
}

// Función para mostrar lista OCI pendientes en tabla
function mostrarListaOCIPendientes(ociList) {
    const container = document.getElementById('cuerpo-tabla-ordenes');
    
    if (ociList.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="cargando">
                    <i class="fas fa-check-circle"></i>
                    <p>No hay OCI pendientes</p>
                    <small>Todas las órdenes han sido procesadas</small>
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = ociList.map(oci => {
        const usuario = oci.usuarios_carton;
        const usuarioNombre = usuario ? usuario.nombre_completo || usuario.username : 'Desconocido';
        const fechaCreacion = new Date(oci.fecha_creacion).toLocaleDateString();
        
        return `
            <tr>
                <td>${oci.numero_oci}</td>
                <td>${fechaCreacion}</td>
                <td>${usuarioNombre}</td>
                <td>${oci.material_numero}</td>
                <td>${oci.cantidad_pallets} pallets</td>
                <td><span class="icono-estado estado-pendiente">${oci.estado}</span></td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="aceptarOCI(${oci.id})">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="rechazarOCI(${oci.id})">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="verDetalleOCI(${oci.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Función para aceptar OCI
async function aceptarOCI(ociId) {
    const observaciones = prompt('Observaciones para la aprobación (opcional):') || '';
    
    try {
        const { data, error } = await supabase
            .from('ordenes_compra')
            .update({
                estado: 'APROBADA',
                observaciones: observaciones,
                updated_at: new Date().toISOString()
            })
            .eq('id', ociId);
        
        if (error) {
            console.error('Error aceptando OCI:', error);
            showToast(`Error al aceptar OCI: ${error.message}`, 'error');
            return;
        }
        
        showToast('OCI aceptada exitosamente', 'success');
        await cargarOCIPendientes();
        
    } catch (error) {
        console.error('Error aceptando OCI:', error);
        showToast('Error al aceptar la OCI', 'error');
    }
}

// Función para rechazar OCI
async function rechazarOCI(ociId) {
    const observaciones = prompt('Motivo del rechazo:');
    if (!observaciones) {
        showToast('El motivo del rechazo es requerido', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('ordenes_compra')
            .update({
                estado: 'RECHAZADA',
                observaciones: observaciones,
                updated_at: new Date().toISOString()
            })
            .eq('id', ociId);
        
        if (error) {
            console.error('Error rechazando OCI:', error);
            showToast(`Error al rechazar OCI: ${error.message}`, 'error');
            return;
        }
        
        showToast('OCI rechazada', 'info');
        await cargarOCIPendientes();
        
    } catch (error) {
        console.error('Error rechazando OCI:', error);
        showToast('Error al rechazar la OCI', 'error');
    }
}

// Función para cargar OCI pendientes de recibir
async function cargarOCIPendientesRecibir() {
    const container = document.getElementById('oci-recibir-container');
    
    try {
        const response = await fetch('/api/recibido/aceptados');
        const result = await response.json();
        
        if (result.success) {
            mostrarListaOCIAceptadas(result.data);
            actualizarEstadisticasRecibido(result.data);
        } else {
            showToast(`Error cargando OCI: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error cargando OCI para recibir:', error);
        showToast('Error de conexión', 'error');
    }
}

// Función para mostrar lista OCI aceptadas
function mostrarListaOCIAceptadas(ociList) {
    const container = document.getElementById('oci-recibir-container');
    
    if (ociList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-truck"></i>
                <p>No hay OCI pendientes de recibir</p>
                <small>Todas las órdenes aceptadas han sido procesadas</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = ociList.map(oci => `
        <div class="oci-card">
            <div class="oci-header">
                <div class="oci-info">
                    <div class="oci-numero">${oci.numero_oci}</div>
                    <div class="oci-meta">
                        Creado por: ${oci.usuario_creador} | 
                        Aceptado por: ${oci.usuario_revisor} | 
                        Fecha: ${new Date(oci.fecha_revision).toLocaleString()}
                    </div>
                </div>
                <div class="oci-actions">
                    <button class="btn btn-sm btn-info" onclick="verDetalleOCI(${oci.id})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </div>
            </div>
            <div class="oci-detalles">
                <h4>Productos a Recibir:</h4>
                ${oci.detalles.map(detalle => `
                    <div class="detalle-item">
                        <div><strong>${detalle.producto.numero_parte}</strong></div>
                        <div>${detalle.producto.descripcion}</div>
                        <div>${detalle.cantidad_tarimas} tarimas</div>
                        <div>${detalle.total_unidades} unidades</div>
                    </div>
                `).join('')}
            </div>
            <div class="recibir-form" id="recibir-form-${oci.id}">
                <h4><i class="fas fa-check-double"></i> Confirmar Recepción</h4>
                <div class="cantidad-recibida">
                    ${oci.detalles.map((detalle, index) => `
                        <div class="form-group">
                            <label>${detalle.producto.numero_parte}</label>
                            <input type="number" id="cantidad-recibida-${oci.id}-${index}" 
                                   class="form-control" min="0" max="${detalle.total_unidades}" 
                                   value="${detalle.total_unidades}" required>
                            <small class="form-help">Stock actual: ${detalle.inventario_actual ? detalle.inventario_actual.cantidad_actual : 0}</small>
                        </div>
                    `).join('')}
                </div>
                <div class="form-group">
                    <label>Observaciones de Recepción</label>
                    <textarea id="observaciones-recepcion-${oci.id}" class="form-control" 
                             rows="2" placeholder="Estado de los materiales recibidos..."></textarea>
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="confirmarRecepcionOCI(${oci.id})">
                        <i class="fas fa-check-double"></i> Confirmar Recepción
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Función para confirmar recepción OCI
async function confirmarRecepcionOCI(ociId) {
    const usuario = prompt('Ingrese su nombre para confirmar la recepción:');
    if (!usuario) return;
    
    const observaciones = document.getElementById(`observaciones-recepcion-${ociId}`).value;
    
    // Recopilar cantidades recibidas
    const detallesRecibidos = [];
    const form = document.getElementById(`recibir-form-${ociId}`);
    const cantidadInputs = form.querySelectorAll('input[id^="cantidad-recibida-"]');
    
    cantidadInputs.forEach((input, index) => {
        const cantidad = parseInt(input.value) || 0;
        if (cantidad > 0) {
            detallesRecibidos.push({
                detalle_id: index + 1, // Esto debería ser el ID real del detalle
                cantidad_recibida: cantidad
            });
        }
    });
    
    if (detallesRecibidos.length === 0) {
        showToast('Debe especificar al menos una cantidad recibida', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/recibido/${ociId}/confirmar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario_receptor: usuario,
                observaciones: observaciones,
                detalles_recibidos: detallesRecibidos,
                verificar_fisicamente: true
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Recepción confirmada exitosamente', 'success');
            await cargarOCIPendientesRecibir();
        } else {
            showToast(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error confirmando recepción:', error);
        showToast('Error de conexión', 'error');
    }
}

// Función para ver detalle OCI
async function verDetalleOCI(ociId) {
    try {
        const { data: oci, error } = await supabase
            .from('ordenes_compra')
            .select(`
                id,
                numero_oci,
                estado,
                fecha_creacion,
                observaciones,
                usuario_creador,
                usuario_revisor,
                usuario_receptor,
                detalles:ordenes_compra_detalles (
                    cantidad_tarimas,
                    cantidad_unidades_por_tarima,
                    total_unidades,
                    producto:productos_carton (
                        numero_parte,
                        descripcion
                    )
                ),
                facturas:oci_facturas (
                    nombre_archivo,
                    nombre_original,
                    usuario_subida
                )
            `)
            .eq('id', ociId)
            .single();

        if (error) throw error;

        // 👉 reutilizamos TU HTML (no lo rompemos)
        renderDetalleOCIModal(oci);

    } catch (error) {
        console.error('Error cargando detalle OCI:', error);
        showToast('Error cargando detalle OCI', 'error');
    }
}

// Función para renderizar modal con detalles OCI
function renderDetalleOCIModal(oci) {
    // Crear el HTML del modal
    const detallesHTML = oci.detalles && oci.detalles.length > 0 ? oci.detalles.map(detalle => `
        <div class="detalle-item" style="border-bottom: 1px solid #eee; padding: 12px 0;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <strong style="color: #333;">Número de Parte:</strong>
                    <p style="margin: 5px 0; color: #666;">${detalle.producto?.numero_parte || 'N/A'}</p>
                </div>
                <div>
                    <strong style="color: #333;">Descripción:</strong>
                    <p style="margin: 5px 0; color: #666;">${detalle.producto?.descripcion || 'N/A'}</p>
                </div>
                <div>
                    <strong style="color: #333;">Cantidad de Tarimas:</strong>
                    <p style="margin: 5px 0; color: #666;">${detalle.cantidad_tarimas || 0}</p>
                </div>
                <div>
                    <strong style="color: #333;">Unidades por Tarima:</strong>
                    <p style="margin: 5px 0; color: #666;">${detalle.cantidad_unidades_por_tarima || 0}</p>
                </div>
                <div>
                    <strong style="color: #333;">Total de Unidades:</strong>
                    <p style="margin: 5px 0; color: #28a745; font-weight: bold;">${detalle.total_unidades || 0}</p>
                </div>
            </div>
        </div>
    `).join('') : '<p style="color: #999; text-align: center; padding: 20px;">No hay detalles de productos</p>';

    const facturasHTML = oci.facturas && oci.facturas.length > 0 ? oci.facturas.map(factura => `
        <div style="padding: 10px; background: #f8f9fa; border-radius: 4px; margin-bottom: 8px;">
            <i class="fas fa-file-pdf" style="color: #dc3545; margin-right: 8px;"></i>
            <strong>${factura.nombre_original || factura.nombre_archivo}</strong>
            <small style="color: #999; display: block; margin-top: 4px;">Subido por: ${factura.usuario_subida || 'Desconocido'}</small>
        </div>
    `).join('') : '<p style="color: #999; text-align: center; padding: 20px;">No hay facturas adjuntas</p>';

    const estadoClase = oci.estado === 'PENDIENTE' ? 'estado-pendiente' : 
                       oci.estado === 'APROBADA' ? 'estado-aprobada' : 
                       oci.estado === 'RECHAZADA' ? 'estado-rechazada' : 'estado-recibida';

    const modalHTML = `
        <div class="modal-detalle-oci" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 20px;
        ">
            <div style="
                background: white;
                border-radius: 8px;
                max-width: 900px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            ">
                <!-- Header del Modal -->
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 8px 8px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div>
                        <h2 style="margin: 0; font-size: 24px; font-weight: bold;">OCI #${oci.numero_oci}</h2>
                        <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Detalles de la Orden de Compra Interna</p>
                    </div>
                    <button onclick="cerrarModalDetalle()" style="
                        background: rgba(255, 255, 255, 0.2);
                        border: none;
                        color: white;
                        font-size: 24px;
                        cursor: pointer;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: background 0.3s;
                    " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- Contenido del Modal -->
                <div style="padding: 30px;">
                    <!-- Información General -->
                    <div style="margin-bottom: 30px;">
                        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                            <i class="fas fa-info-circle" style="margin-right: 8px;"></i>Información General
                        </h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div>
                                <strong style="color: #666; font-size: 12px; text-transform: uppercase;">Estado</strong>
                                <p style="margin: 8px 0; font-size: 16px;">
                                    <span class="icono-estado ${estadoClase}" style="padding: 6px 12px; border-radius: 4px; display: inline-block;">${oci.estado}</span>
                                </p>
                            </div>
                            <div>
                                <strong style="color: #666; font-size: 12px; text-transform: uppercase;">Fecha de Creación</strong>
                                <p style="margin: 8px 0; font-size: 16px; color: #333;">${new Date(oci.fecha_creacion).toLocaleString()}</p>
                            </div>
                            <div>
                                <strong style="color: #666; font-size: 12px; text-transform: uppercase;">Usuario Creador</strong>
                                <p style="margin: 8px 0; font-size: 16px; color: #333;">${oci.usuario_creador || 'N/A'}</p>
                            </div>
                            <div>
                                <strong style="color: #666; font-size: 12px; text-transform: uppercase;">Usuario Revisor</strong>
                                <p style="margin: 8px 0; font-size: 16px; color: #333;">${oci.usuario_revisor || 'Pendiente'}</p>
                            </div>
                            <div>
                                <strong style="color: #666; font-size: 12px; text-transform: uppercase;">Usuario Receptor</strong>
                                <p style="margin: 8px 0; font-size: 16px; color: #333;">${oci.usuario_receptor || 'Pendiente'}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Detalles de Productos -->
                    <div style="margin-bottom: 30px;">
                        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                            <i class="fas fa-box" style="margin-right: 8px;"></i>Detalles de Productos
                        </h3>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                            ${detallesHTML}
                        </div>
                    </div>

                    <!-- Facturas -->
                    <div style="margin-bottom: 30px;">
                        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                            <i class="fas fa-file-invoice" style="margin-right: 8px;"></i>Facturas Adjuntas
                        </h3>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                            ${facturasHTML}
                        </div>
                    </div>

                    <!-- Observaciones -->
                    ${oci.observaciones ? `
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                            <i class="fas fa-sticky-note" style="margin-right: 8px;"></i>Observaciones
                        </h3>
                        <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 4px; color: #333;">
                            ${oci.observaciones}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Botones de Acción -->
                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <button onclick="cerrarModalDetalle()" style="
                            background: #6c757d;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 500;
                            transition: background 0.3s;
                        " onmouseover="this.style.background='#5a6268'" onmouseout="this.style.background='#6c757d'">
                            <i class="fas fa-times" style="margin-right: 8px;"></i>Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Insertar modal en el DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Función para cerrar modal detalle
function cerrarModalDetalle() {
    const modal = document.querySelector('.modal-detalle-oci');
    if (modal) {
        modal.remove();
    }
}

// Función para actualizar estadísticas OCI
function actualizarEstadisticasOCI(ordenes) {
    const total = document.getElementById('oci-total');
    const pendientes = document.getElementById('oci-pendientes');
    const aprobadas = document.getElementById('oci-aprobadas');

    // ⛔ SI NO EXISTE LA UI, NO EXPLOTES
    if (!total || !pendientes || !aprobadas) {
        console.warn('⚠️ Estadísticas OCI no existen en esta vista');
        return;
    }

    total.textContent = ordenes.length;
    pendientes.textContent = ordenes.filter(o => o.estado === 'PENDIENTE').length;
    aprobadas.textContent = ordenes.filter(o => o.estado === 'APROBADA').length;
}

// Función para actualizar estadísticas recibido
function actualizarEstadisticasRecibido(ociList) {
    // Implementar lógica para actualizar contadores
    const pendientes = ociList.length;
    document.getElementById('oci-pendientes-recibir-count').textContent = pendientes;
}

// Función para refrescar listas OCI
async function refrescarListaOCI() {
    await cargarOCIPendientes();
}

async function refrescarListaRecibidos() {
    await cargarOCIPendientesRecibir();
}
// Función para cargar órdenes recientes
async function cargarOrdenesRecientes() {
    const container = document.getElementById('lista-ordenes-recientes');
    
    try {
        const { data: ordenes, error } = await supabase
            .from('ordenes_compra')
            .select(`
                *,
                usuarios_carton!ordenes_compra_usuario_solicitante_id_fkey (
                    username,
                    nombre_completo
                )
            `)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) {
            console.error('Error cargando órdenes recientes:', error);
            return;
        }
        
        if (!ordenes || ordenes.length === 0) {
            container.innerHTML = `
                <div class="cargando">
                    <p>No hay órdenes recientes</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = ordenes.map(oci => {
            const usuario = oci.usuarios_carton;
            const usuarioNombre = usuario ? usuario.nombre_completo || usuario.username : 'Desconocido';
            const fechaCreacion = new Date(oci.created_at).toLocaleDateString();
            
            return `
                <div class="orden-reciente">
                    <div class="orden-info">
                        <strong>${oci.numero_oci}</strong>
                        <span>Material: ${oci.material_numero}</span>
                        <span>Usuario: ${usuarioNombre}</span>
                        <span>Fecha: ${fechaCreacion}</span>
                    </div>
                    <div class="orden-estado">
                        <span class="icono-estado estado-${oci.estado.toLowerCase()}">${oci.estado}</span>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error cargando órdenes recientes:', error);
    }
}

// Función para cargar materiales de cartón
async function cargarMaterialesOCICarton() {
    const container = document.getElementById('grid-materiales');
    
    try {
        // Materiales de cartón predefinidos
        const materialesCarton = [
            { numero: '1482388', descripcion: 'Material cartón 1482388', piezas_por_pallet: 760 },
            { numero: '1482387', descripcion: 'Material cartón 1482387', piezas_por_pallet: 350 },
            { numero: '632545', descripcion: 'Material cartón 632545 (10 x Caja)', piezas_por_pallet: 10 },
            { numero: '1482386', descripcion: 'Material cartón 1482386', piezas_por_pallet: 500 },
            { numero: '1482385', descripcion: 'Material cartón 1482385', piezas_por_pallet: 600 },
            { numero: '1482384', descripcion: 'Material cartón 1482384', piezas_por_pallet: 800 },
            { numero: '1482383', descripcion: 'Material cartón 1482383', piezas_por_pallet: 400 },
            { numero: '1482382', descripcion: 'Material cartón 1482382', piezas_por_pallet: 550 },
            { numero: '1482381', descripcion: 'Material cartón 1482381', piezas_por_pallet: 700 },
            { numero: '1482380', descripcion: 'Material cartón 1482380', piezas_por_pallet: 450 },
            { numero: '1482379', descripcion: 'Material cartón 1482379', piezas_por_pallet: 650 },
            { numero: '1482378', descripcion: 'Material cartón 1472378', piezas_por_pallet: 750 },
            { numero: '1482377', descripcion: 'Material cartón 1472377', piezas_por_pallet: 520 },
            { numero: '1482376', descripcion: 'Material cartón 1472376', piezas_por_pallet: 680 },
            { numero: '1482375', descripcion: 'Material cartón 1472375', piezas_por_pallet: 580 },
            { numero: '1482374', descripcion: 'Material cartón 1472374', piezas_por_pallet: 720 },
            { numero: '1482373', descripcion: 'Material cartón 1472373', piezas_por_pallet: 480 }
        ];
        
        container.innerHTML = materialesCarton.map(material => `
            <div class="material-card" onclick="toggleMaterialOCI('${material.numero}')">
                <h4>${material.numero}</h4>
                <p>${material.descripcion}</p>
                <p><strong>${material.piezas_por_pallet} piezas por pallet</strong></p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando materiales:', error);
        container.innerHTML = '<p>Error cargando materiales</p>';
    }
}

// Función para toggle de selección de material
function toggleMaterialOCI(materialNumero) {
    // Buscar el material en el array de materiales predefinidos
    const materialesCarton = [
        { numero: '1482388', descripcion: 'Material cartón 1482388', piezas_por_pallet: 760 },
        { numero: '1482387', descripcion: 'Material cartón 1482387', piezas_por_pallet: 350 },
        { numero: '632545', descripcion: 'Material cartón 632545 (10 x Caja)', piezas_por_pallet: 10 },
        { numero: '1482386', descripcion: 'Material cartón 1482386', piezas_por_pallet: 500 },
        { numero: '1482385', descripcion: 'Material cartón 1482385', piezas_por_pallet: 600 },
        { numero: '1482384', descripcion: 'Material cartón 1482384', piezas_por_pallet: 800 },
        { numero: '1482383', descripcion: 'Material cartón 1482383', piezas_por_pallet: 400 },
        { numero: '1482382', descripcion: 'Material cartón 1482382', piezas_por_pallet: 550 },
        { numero: '1482381', descripcion: 'Material cartón 1482381', piezas_por_pallet: 700 },
        { numero: '1482380', descripcion: 'Material cartón 1482380', piezas_por_pallet: 450 },
        { numero: '1482379', descripcion: 'Material cartón 1482379', piezas_por_pallet: 650 },
        { numero: '1482378', descripcion: 'Material cartón 1472378', piezas_por_pallet: 750 },
        { numero: '1482377', descripcion: 'Material cartón 1472377', piezas_por_pallet: 520 },
        { numero: '1482376', descripcion: 'Material cartón 1472376', piezas_por_pallet: 680 },
        { numero: '1482375', descripcion: 'Material cartón 1472375', piezas_por_pallet: 580 },
        { numero: '1482374', descripcion: 'Material cartón 1472374', piezas_por_pallet: 720 },
        { numero: '1482373', descripcion: 'Material cartón 1472373', piezas_por_pallet: 480 }
    ];
    
    const material = materialesCarton.find(m => m.numero === materialNumero);
    if (!material) return;
    
    // Verificar si ya está seleccionado
    const existente = detallesOCI.find(d => d.material_numero === materialNumero);
    
    if (existente) {
        // Remover de la selección
        detallesOCI = detallesOCI.filter(d => d.material_numero !== materialNumero);
    } else {
        // Agregar a la selección
        const cantidad = prompt(`Cantidad de pallets para ${material.numero}:`, '1');
        const cantidadPallets = parseInt(cantidad) || 1;
        
        detallesOCI.push({
            material_numero: material.numero,
            material_descripcion: material.descripcion,
            piezas_por_pallet: material.piezas_por_pallet,
            cantidad_pallets: cantidadPallets
        });
    }
    
    // Actualizar la interfaz
    actualizarListaDetallesOCI();
    actualizarGridMateriales();
}

// Función para actualizar el grid de materiales
function actualizarGridMateriales() {
    const materialCards = document.querySelectorAll('.material-card');
    materialCards.forEach(card => {
        const numeroMaterial = card.querySelector('h4').textContent;
        const isSelected = detallesOCI.some(d => d.material_numero === numeroMaterial);
        
        if (isSelected) {
            card.classList.add('seleccionado');
        } else {
            card.classList.remove('seleccionado');
        }
    });
}

// Función para actualizar la lista de detalles OCI
function actualizarListaDetallesOCI() {
    const container = document.getElementById('materiales-seleccionados');
    const totalContainer = document.getElementById('total-piezas');
    
    if (detallesOCI.length === 0) {
        container.innerHTML = '<p>No hay materiales seleccionados</p>';
        totalContainer.textContent = '0';
        return;
    }
    
    container.innerHTML = detallesOCI.map((detalle, index) => `
        <div class="material-seleccionado">
            <span>${detalle.material_numero}</span>
            <span>${detalle.cantidad_pallets} pallets</span>
            <button onclick="removerMaterialOCI('${detalle.material_numero}')">×</button>
        </div>
    `).join('');
    
    // Calcular total
    const totalPiezas = detallesOCI.reduce((sum, detalle) => {
        return sum + (detalle.piezas_por_pallet * detalle.cantidad_pallets);
    }, 0);
    
    totalContainer.textContent = totalPiezas;
}

// Función para remover material de la OCI
function removerMaterialOCI(materialNumero) {
    detallesOCI = detallesOCI.filter(d => d.material_numero !== materialNumero);
    actualizarListaDetallesOCI();
    actualizarGridMateriales();
}

// Función para limpiar formulario OCI
function limpiarFormularioOCI() {
    detallesOCI = [];
    actualizarListaDetallesOCI();
    actualizarGridMateriales();
    
    // Limpiar fecha y número
    const now = new Date();
    const fechaISO = now.toISOString().slice(0, 16);
    document.getElementById('fecha-oci').value = fechaISO;
    document.getElementById('numero-oci').value = '';
    
    showToast('Formulario limpiado', 'info');
}

// ===== FUNCIONES PARA BALANCE VERITIV =====

let balances = [];
let balanceEditando = null;

/**
 * Cargar todos los balances desde la base de datos
 */
async function cargarBalances() {
    try {
        console.log('🔄 Cargando balances...');
        
        const { data, error } = await supabase
            .from('balances_veritiv')
            .select(`
                *,
                producto:productos_carton(id, numero_parte, descripcion)
            `)
            .eq('activo', true)
            .order('fecha_creacion', { ascending: false });
        
        if (error) {
            console.error('❌ Error cargando balances:', error);
            mostrarErrorBalances('Error al cargar balances');
            return;
        }
        
        balances = data || [];
        console.log('✅ Balances cargados:', balances.length);
        renderizarBalances(balances);
        
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarErrorBalances('Error al cargar balances');
    }
}

/**
 * Renderizar la tabla de balances
 */
function renderizarBalances(balancesData) {
    const tbody = document.getElementById('tabla-balances-body');
    
    if (!tbody) {
        console.error('❌ No se encontró el elemento tabla-balances-body');
        return;
    }
    
    if (!balancesData || balancesData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h4>No hay balances registrados</h4>
                    <small>Haz clic en "Nuevo Balance" para agregar uno</small>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = balancesData.map(balance => {
        // ✨ NUEVO: Determinar estado del balance
        const balanceNum = parseFloat(balance.balance);
        const esAgotado = balanceNum === 0;
        const esBajo = balanceNum > 0 && balanceNum < 1000;
        
        let estadoBadge = '';
        let balanceClass = 'status-normal';
        let rowStyle = '';
        
        if (esAgotado) {
            estadoBadge = '<span class="status-badge status-agotado"><i class="fas fa-times-circle"></i> Agotado</span>';
            balanceClass = 'status-agotado';
            rowStyle = 'background-color: #fee; border-left: 4px solid #dc2626;';
        } else if (esBajo) {
            estadoBadge = '<span class="status-badge status-bajo"><i class="fas fa-exclamation-triangle"></i> Bajo</span>';
            balanceClass = 'status-bajo';
        } else {
            estadoBadge = '<span class="status-badge status-disponible"><i class="fas fa-check-circle"></i> Disponible</span>';
            balanceClass = 'status-disponible';
        }
        
        return `
        <tr style="${rowStyle}">
            <td><strong>${balance.orden_compra}</strong></td>
            <td>${formatearFecha(balance.fecha_orden_compra)}</td>
            <td>
                <div class="product-info">
                    <strong style="${esAgotado ? 'color: #dc2626;' : ''}">${balance.material_carton}</strong>
                    ${balance.producto ? `<br><small>${balance.producto.numero_parte} - ${balance.producto.descripcion}</small>` : ''}
                </div>
            </td>
            <td>
                <span class="quantity-badge ${balanceClass}">
                    ${formatearNumero(balance.balance)}
                </span>
            </td>
            <td>${estadoBadge}</td>
            <td>${formatearFechaHora(balance.fecha_creacion)}</td>
            <td>
                <div class="inventory-actions">
                    <button class="btn-action" onclick="editarBalance(${balance.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action" onclick="eliminarBalance(${balance.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

/**
 * Abrir modal para crear nuevo balance
 */
function abrirModalBalance() {
    balanceEditando = null;
    document.getElementById('modal-balance-titulo').textContent = 'Nuevo Balance Veritiv';
    document.getElementById('form-balance').reset();
    document.getElementById('balance-id').value = '';
    
    // Cargar productos en el select
    cargarProductosSelect();
    
    // Mostrar modal
    document.getElementById('modal-balance').style.display = 'block';
}

/**
 * Cerrar modal de balance
 */
function cerrarModalBalance() {
    document.getElementById('modal-balance').style.display = 'none';
    balanceEditando = null;
}

/**
 * Cargar productos en el select del formulario
 */
async function cargarProductosSelect() {
    try {
        const { data, error } = await supabase
            .from('productos_carton')
            .select('id, numero_parte, descripcion')
            .eq('activo', true)
            .order('numero_parte');
        
        if (error) {
            console.error('❌ Error cargando productos:', error);
            return;
        }
        
        const select = document.getElementById('balance-producto');
        select.innerHTML = '<option value="">Seleccione un producto...</option>';
        
        data.forEach(producto => {
            const option = document.createElement('option');
            option.value = producto.id;
            option.textContent = `${producto.numero_parte} - ${producto.descripcion}`;
            // ✨ NUEVO: Guardar la descripción como data attribute
            option.setAttribute('data-descripcion', producto.descripcion);
            select.appendChild(option);
        });
        
        // ✨ NUEVO: Agregar event listener para autocompletar
        select.addEventListener('change', autocompletarMaterialCarton);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

function autocompletarMaterialCarton() {
    const select = document.getElementById('balance-producto');
    const materialInput = document.getElementById('balance-material');
    
    // Obtener la opción seleccionada
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption && selectedOption.value) {
        // Obtener la descripción del data attribute
        const descripcion = selectedOption.getAttribute('data-descripcion');
        
        if (descripcion) {
            // Autocompletar el campo de material
            materialInput.value = descripcion;
            console.log('✅ Material autocompletado:', descripcion);
        }
    } else {
        // Si no hay producto seleccionado, limpiar el campo
        materialInput.value = '';
    }
}


/**
 * Guardar balance (crear o actualizar)
 */
async function guardarBalance(event) {
    event.preventDefault();
    
    try {
        const balanceData = {
            orden_compra: document.getElementById('balance-orden-compra').value,
            fecha_orden_compra: document.getElementById('balance-fecha-orden').value,
            producto_id: document.getElementById('balance-producto').value || null,
            material_carton: document.getElementById('balance-material').value,
            balance: parseFloat(document.getElementById('balance-cantidad').value)
        };
        
        const balanceId = document.getElementById('balance-id').value;
        
        let result;
        if (balanceId) {
            // Actualizar balance existente
            result = await supabase
                .from('balances_veritiv')
                .update(balanceData)
                .eq('id', balanceId)
                .select();
        } else {
            // Crear nuevo balance
            result = await supabase
                .from('balances_veritiv')
                .insert([balanceData])
                .select();
        }
        
        if (result.error) {
            throw result.error;
        }
        
        alert('✅ Balance guardado exitosamente');
        cerrarModalBalance();
        await cargarBalances();
        
    } catch (error) {
        console.error('❌ Error guardando balance:', error);
        alert('Error al guardar el balance: ' + error.message);
    }
}

/**
 * Editar un balance existente
 */
async function editarBalance(balanceId) {
    try {
        const { data, error } = await supabase
            .from('balances_veritiv')
            .select('*')
            .eq('id', balanceId)
            .single();
        
        if (error || !data) {
            console.error('❌ Error cargando balance:', error);
            alert('Error al cargar el balance');
            return;
        }
        
        balanceEditando = data;
        
        // Llenar el formulario
        document.getElementById('modal-balance-titulo').textContent = 'Editar Balance Veritiv';
        document.getElementById('balance-id').value = data.id;
        document.getElementById('balance-orden-compra').value = data.orden_compra;
        document.getElementById('balance-fecha-orden').value = data.fecha_orden_compra;
        document.getElementById('balance-material').value = data.material_carton;
        document.getElementById('balance-cantidad').value = data.balance;
        
        // Cargar productos y seleccionar el actual
        await cargarProductosSelect();
        if (data.producto_id) {
            document.getElementById('balance-producto').value = data.producto_id;
        }
        
        // Mostrar modal
        document.getElementById('modal-balance').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al cargar el balance');
    }
}

/**
 * Eliminar un balance (soft delete)
 */
async function eliminarBalance(balanceId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este balance?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('balances_veritiv')
            .update({ activo: false })
            .eq('id', balanceId);
        
        if (error) {
            console.error('❌ Error eliminando balance:', error);
            alert('Error al eliminar el balance');
            return;
        }
        
        console.log('✅ Balance eliminado exitosamente');
        alert('Balance eliminado exitosamente');
        cargarBalances();
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al eliminar el balance');
    }
}

/**
 * Filtrar balances
 */
async function filtrarBalances() {
    try {
        const ordenCompra = document.getElementById('filtro-balance-orden').value;
        const fecha = document.getElementById('filtro-balance-fecha').value;
        
        let query = supabase
            .from('balances_veritiv')
            .select(`
                *,
                producto:productos_carton(id, numero_parte, descripcion)
            `)
            .eq('activo', true);
        
        if (ordenCompra) {
            query = query.ilike('orden_compra', `%${ordenCompra}%`);
        }
        
        if (fecha) {
            query = query.eq('fecha_orden_compra', fecha);
        }
        
        const { data, error } = await query.order('fecha_creacion', { ascending: false });
        
        if (error) {
            console.error('❌ Error filtrando balances:', error);
            return;
        }
        
        renderizarBalances(data || []);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

/**
 * Mostrar error en la tabla de balances
 */
function mostrarErrorBalances(mensaje) {
    const tbody = document.getElementById('tabla-balances-body');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error</h4>
                    <p>${mensaje}</p>
                    <button class="btn-retry" onclick="cargarBalances()">
                        <i class="fas fa-redo"></i>
                        Reintentar
                    </button>
                </td>
            </tr>
        `;
    }
}

/**
 * Formatear fecha (YYYY-MM-DD a DD/MM/YYYY)
 */
function formatearFecha(fecha) {
    if (!fecha) return '-';
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Formatear fecha y hora
 */
function formatearFechaHora(fecha) {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Formatear número con separadores de miles
 */
function formatearNumero(numero) {
    if (!numero) return '0';
    return parseFloat(numero).toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Cerrar modal al hacer clic fuera de él
window.onclick = function(event) {
    const modal = document.getElementById('modal-balance');
    if (event.target === modal) {
        cerrarModalBalance();
    }
}

// ===== FIN DE FUNCIONES PARA BALANCE VERITIV =====

// ===== ✨ NUEVAS FUNCIONES PARA BALANCES USADOS =====

/**
 * Cambiar entre pestañas de Balances Activos y Balances Usados
 */
function cambiarTabBalance(tab) {
    console.log('🔄 Cambiando a pestaña:', tab);
    
    // Actualizar botones de pestañas
    const botones = document.querySelectorAll('.balance-tab-btn');
    botones.forEach(btn => {
        if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('active');
            btn.style.color = '#3b82f6';
            btn.style.borderBottom = '3px solid #3b82f6';
        } else {
            btn.classList.remove('active');
            btn.style.color = '#64748b';
            btn.style.borderBottom = '3px solid transparent';
        }
    });
    
    // Mostrar/ocultar contenido de pestañas
    const tabActivos = document.getElementById('tab-balances-activos');
    const tabUsados = document.getElementById('tab-balances-usados');
    
    if (tab === 'activos') {
        tabActivos.style.display = 'block';
        tabUsados.style.display = 'none';
        cargarBalances();
    } else if (tab === 'usados') {
        tabActivos.style.display = 'none';
        tabUsados.style.display = 'block';
        cargarBalancesUsados();
    }
}

/**
 * Cargar balances usados (balance = 0) con información de OCIs ligadas
 */
async function cargarBalancesUsados() {
    try {
        console.log('🔄 Cargando balances usados...');
        
        const tbody = document.getElementById('tabla-balances-usados-body');
        if (!tbody) {
            console.error('❌ No se encontró el elemento tabla-balances-usados-body');
            return;
        }
        
        // Mostrar loading
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="loading">
                    <div class="spinner"></div>
                    <p>Cargando balances usados...</p>
                </td>
            </tr>
        `;
        
        // 1. Obtener balances con cantidad = 0
        const { data: balancesAgotados, error: errorBalances } = await supabase
            .from('balances_veritiv')
            .select(`
                id,
                orden_compra,
                material_carton,
                balance,
                fecha_orden_compra,
                fecha_actualizacion,
                producto:productos_carton(numero_parte, descripcion)
            `)
            .eq('balance', 0)
            .eq('activo', true)
            .order('fecha_actualizacion', { ascending: false });
        
        if (errorBalances) {
            console.error('❌ Error cargando balances agotados:', errorBalances);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error al cargar balances usados</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        if (!balancesAgotados || balancesAgotados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <h4>No hay balances agotados</h4>
                        <small>Todos los balances tienen cantidad disponible</small>
                    </td>
                </tr>
            `;
            return;
        }
        
        console.log('✅ Balances agotados encontrados:', balancesAgotados.length);
        
        // 2. Para cada balance agotado, obtener las OCIs que lo usaron
        const balancesConOCIs = await Promise.all(
            balancesAgotados.map(async (balance) => {
                const { data: usosOCI, error: errorUsos } = await supabase
                    .from('oci_balances_usados')
                    .select('numero_oci, cantidad_piezas_usadas, fecha_uso')
                    .eq('balance_id', balance.id)
                    .order('fecha_uso', { ascending: false });
                
                if (errorUsos) {
                    console.error('⚠️ Error obteniendo usos para balance', balance.id, ':', errorUsos);
                    return {
                        ...balance,
                        ocis: [],
                        total_usado: 0,
                        fecha_agotamiento: balance.fecha_actualizacion
                    };
                }
                
                // Calcular total usado
                const totalUsado = usosOCI ? usosOCI.reduce((sum, uso) => sum + uso.cantidad_piezas_usadas, 0) : 0;
                
                // Obtener fecha del último uso (agotamiento)
                const fechaAgotamiento = usosOCI && usosOCI.length > 0 
                    ? usosOCI[0].fecha_uso 
                    : balance.fecha_actualizacion;
                
                return {
                    ...balance,
                    ocis: usosOCI || [],
                    total_usado: totalUsado,
                    fecha_agotamiento: fechaAgotamiento
                };
            })
        );
        
        console.log('✅ Datos completos de balances usados:', balancesConOCIs.length);
        
        // 3. Renderizar tabla
        tbody.innerHTML = balancesConOCIs.map(balance => {
            const ocisLista = balance.ocis.length > 0
                ? balance.ocis.map(oci => `
                    <span class="oci-badge" title="${formatearNumero(oci.cantidad_piezas_usadas)} piezas - ${formatearFechaHora(oci.fecha_uso)}">
                        ${oci.numero_oci}
                    </span>
                `).join('')
                : '<span style="color: #94a3b8;">Sin registros</span>';
            
            return `
                <tr>
                    <td><strong>${balance.orden_compra}</strong></td>
                    <td>
                        <div class="product-info">
                            <strong>${balance.material_carton}</strong>
                            ${balance.producto ? `<br><small>${balance.producto.numero_parte} - ${balance.producto.descripcion}</small>` : ''}
                        </div>
                    </td>
                    <td>
                        <span class="quantity-badge status-normal">
                            ${formatearNumero(balance.total_usado)}
                        </span>
                    </td>
                    <td>
                        <span class="quantity-badge status-agotado">
                            ${formatearNumero(balance.total_usado)}
                        </span>
                    </td>
                    <td>
                        <div class="ocis-container" style="display: flex; flex-wrap: wrap; gap: 5px;">
                            ${ocisLista}
                        </div>
                        <small style="color: #64748b; display: block; margin-top: 5px;">
                            ${balance.ocis.length} OCI(s)
                        </small>
                    </td>
                    <td>${formatearFechaHora(balance.fecha_agotamiento)}</td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('❌ Error:', error);
        const tbody = document.getElementById('tabla-balances-usados-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error al cargar balances usados: ${error.message}</p>
                    </td>
                </tr>
            `;
        }
    }
}

/**
 * Filtrar balances usados por orden de compra
 */
async function filtrarBalancesUsados() {
    try {
        const ordenCompra = document.getElementById('filtro-balance-usados-orden').value.trim();
        
        console.log('🔍 Filtrando balances usados por:', ordenCompra);
        
        const tbody = document.getElementById('tabla-balances-usados-body');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="loading">
                    <div class="spinner"></div>
                    <p>Filtrando...</p>
                </td>
            </tr>
        `;
        
        let query = supabase
            .from('balances_veritiv')
            .select(`
                id,
                orden_compra,
                material_carton,
                balance,
                fecha_orden_compra,
                fecha_actualizacion,
                producto:productos_carton(numero_parte, descripcion)
            `)
            .eq('balance', 0)
            .eq('activo', true);
        
        if (ordenCompra) {
            query = query.ilike('orden_compra', `%${ordenCompra}%`);
        }
        
        const { data: balancesAgotados, error } = await query.order('fecha_actualizacion', { ascending: false });
        
        if (error) {
            console.error('❌ Error filtrando balances usados:', error);
            return;
        }
        
        if (!balancesAgotados || balancesAgotados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-search"></i>
                        <h4>No se encontraron resultados</h4>
                        <small>Intenta con otro término de búsqueda</small>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Obtener OCIs para cada balance
        const balancesConOCIs = await Promise.all(
            balancesAgotados.map(async (balance) => {
                const { data: usosOCI } = await supabase
                    .from('oci_balances_usados')
                    .select('numero_oci, cantidad_piezas_usadas, fecha_uso')
                    .eq('balance_id', balance.id)
                    .order('fecha_uso', { ascending: false });
                
                const totalUsado = usosOCI ? usosOCI.reduce((sum, uso) => sum + uso.cantidad_piezas_usadas, 0) : 0;
                const fechaAgotamiento = usosOCI && usosOCI.length > 0 
                    ? usosOCI[0].fecha_uso 
                    : balance.fecha_actualizacion;
                
                return {
                    ...balance,
                    ocis: usosOCI || [],
                    total_usado: totalUsado,
                    fecha_agotamiento: fechaAgotamiento
                };
            })
        );
        
        // Renderizar resultados (mismo código que en cargarBalancesUsados)
        tbody.innerHTML = balancesConOCIs.map(balance => {
            const ocisLista = balance.ocis.length > 0
                ? balance.ocis.map(oci => `
                    <span class="oci-badge" title="${formatearNumero(oci.cantidad_piezas_usadas)} piezas - ${formatearFechaHora(oci.fecha_uso)}">
                        ${oci.numero_oci}
                    </span>
                `).join('')
                : '<span style="color: #94a3b8;">Sin registros</span>';
            
            return `
                <tr>
                    <td><strong>${balance.orden_compra}</strong></td>
                    <td>
                        <div class="product-info">
                            <strong>${balance.material_carton}</strong>
                            ${balance.producto ? `<br><small>${balance.producto.numero_parte} - ${balance.producto.descripcion}</small>` : ''}
                        </div>
                    </td>
                    <td>
                        <span class="quantity-badge status-normal">
                            ${formatearNumero(balance.total_usado)}
                        </span>
                    </td>
                    <td>
                        <span class="quantity-badge status-agotado">
                            ${formatearNumero(balance.total_usado)}
                        </span>
                    </td>
                    <td>
                        <div class="ocis-container" style="display: flex; flex-wrap: wrap; gap: 5px;">
                            ${ocisLista}
                        </div>
                        <small style="color: #64748b; display: block; margin-top: 5px;">
                            ${balance.ocis.length} OCI(s)
                        </small>
                    </td>
                    <td>${formatearFechaHora(balance.fecha_agotamiento)}</td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// ===== FIN DE FUNCIONES PARA BALANCES USADOS =====
