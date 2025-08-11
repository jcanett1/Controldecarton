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
    window.location.href = 'login_completo.html';
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

// ===== ESTILOS CSS DINÁMICOS =====
function addInventoryModalStyles() {
  const style = document.createElement('style');
  style.id = 'inventory-modal-styles';
  style.textContent = `
    /* Estilos para el modal de inventario */
    .custom-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .modal-content {
      background: white;
      border-radius: 8px;
      padding: 20px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-content h3 {
      margin-top: 0;
      color: #2d3748;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #4a5568;
    }

    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      font-size: 14px;
    }

    .form-control:focus {
      border-color: #4299e1;
      outline: none;
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-cancel {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      color: #4a5568;
    }

    .btn-cancel:hover {
      background: #edf2f7;
    }

    .btn-primary {
      background: #4299e1;
      border: 1px solid #4299e1;
      color: white;
    }

    .btn-primary:hover {
      background: #3182ce;
    }
    
    .close-modal {
      cursor: pointer;
      font-size: 1.5rem;
      line-height: 1;
    }
  `;
  document.head.appendChild(style);
}

// Llamar a la función para agregar los estilos
addInventoryModalStyles();




function hideAdminFeatures() {
    console.log('🔒 Ocultando funciones de administrador para usuario viewer');
    
    // Ocultar botones de admin
    const adminButtons = [
        'button[onclick*="showAddProductModal"]',
        'button[onclick*="showMovementModal"]',
        'button[onclick*="addProduct"]',
        'button[onclick*="editProduct"]',
        'button[onclick*="toggleProductStatus"]',
        'button[onclick*="showAdjustModal"]'
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
            window.location.href = 'login_completo.html';
            
        } catch (error) {
            console.error('Error inesperado cerrando sesión:', error);
            showToast('Error inesperado al cerrar sesión', 'error');
        }
    }
}



async function addProduct() {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }

    const numeroParte = document.getElementById('numero-parte').value;
    const descripcion = document.getElementById('descripcion').value;

    if (!numeroParte || !descripcion) {
        showToast('Por favor complete todos los campos', 'error');
        return;
    }

    try {
        // Iniciar transacción
        const { data: newProduct, error: productError } = await supabase
            .from('productos_carton')
            .insert([
                {
                    numero_parte: numeroParte,
                    descripcion: descripcion,
                    activo: true,
                    fecha_creacion: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (productError) throw productError;

        // Crear registro en inventario automáticamente
        const { error: inventoryError } = await supabase
            .from('inventario')
            .insert([
                {
                    producto_id: newProduct.id,
                    cantidad_actual: 0,         // Valor por defecto
                    cantidad_minima: 0,         // Valor por defecto
                    cantidad_maxima: 1000       // Valor por defecto
                }
            ]);

        if (inventoryError) throw inventoryError;

        showToast('Producto agregado correctamente con registro de inventario', 'success');
        closeModal();
        
        // Limpiar formulario
        document.getElementById('numero-parte').value = '';
        document.getElementById('descripcion').value = '';
        
        // Actualizar vistas
        loadProductos();
        loadInventario();
        loadDashboardData();

    } catch (error) {
        console.error('Error al agregar producto:', error);
        showToast('Error al agregar producto: ' + error.message, 'error');
    }
}

async function updateProduct() {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }

    const productId = document.getElementById('edit-product-id').value;
    const numeroParte = document.getElementById('edit-numero-parte').value;
    const descripcion = document.getElementById('edit-descripcion').value;
    const activo = document.getElementById('edit-activo').value === 'true';

    if (!productId || !numeroParte || !descripcion) {
        showToast('Por favor complete todos los campos', 'error');
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

        showToast('Producto actualizado correctamente', 'success');
        closeModal();
        loadProductos();
        loadDashboardData(); // Actualizar dashboard

    } catch (error) {
        console.error('Error al actualizar producto:', error);
        showToast('Error al actualizar producto: ' + error.message, 'error');
    }
}

async function toggleProductStatus(productId, currentStatus) {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }

    if (!confirm(`¿Estás seguro de querer ${currentStatus ? 'desactivar' : 'activar'} este producto?`)) {
        return;
    }

    try {
        const { error } = await supabase
            .from('productos_carton')
            .update({ activo: !currentStatus })
            .eq('id', productId);

        if (error) throw error;

        showToast(`Producto ${currentStatus ? 'desactivado' : 'activado'} correctamente`, 'success');
        loadProductos();
        loadDashboardData(); // Actualizar dashboard

    } catch (error) {
        console.error('Error al cambiar estado del producto:', error);
        showToast('Error al cambiar estado del producto: ' + error.message, 'error');
    }
}


async function editInventoryItem(id) {
  try {
    // Buscar el item en el inventario actual
    const item = window.inventario.find(i => i.id === id);
    if (!item) {
      showToast('Registro de inventario no encontrado', 'error');
      return;
    }

    const modalHTML = `
      <div class="modal-content">
        <h3>Editar Inventario</h3>
        
        <div class="form-group">
          <label>Producto</label>
          <input type="text" class="form-control" 
                 value="${item.producto?.numero_parte || 'N/A'} - ${item.producto?.descripcion || ''}" 
                 disabled>
        </div>
        
        <div class="form-group">
          <label for="edit-current">Stock Actual</label>
          <input type="number" id="edit-current" class="form-control" 
                 value="${item.cantidad_actual}" min="0">
        </div>
        
        <div class="form-group">
          <label for="edit-min">Stock Mínimo</label>
          <input type="number" id="edit-min" class="form-control" 
                 value="${item.cantidad_minima}" min="0">
        </div>
        
        <div class="form-group">
          <label for="edit-max">Stock Máximo</label>
          <input type="number" id="edit-max" class="form-control" 
                 value="${item.cantidad_maxima}" min="1">
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-cancel" onclick="closeCustomModal()">Cancelar</button>
          <button class="btn btn-primary" onclick="updateInventoryItem(${item.id})">Guardar</button>
        </div>
      </div>
    `;

    showCustomModal('Editar Inventario', modalHTML);

  } catch (error) {
    console.error('Error al editar inventario:', error);
    showToast('Error al cargar datos para edición', 'error');
  }
}

async function updateInventoryItem(id) {
  try {
    const cantidadActual = document.getElementById('edit-current').value;
    const cantidadMinima = document.getElementById('edit-min').value;
    const cantidadMaxima = document.getElementById('edit-max').value;

    // Validaciones básicas
    if (parseInt(cantidadMaxima) <= parseInt(cantidadMinima)) {
      showToast('El stock máximo debe ser mayor al mínimo', 'error');
      return;
    }

    const { error } = await supabase
      .from('inventario')
      .update({
        cantidad_actual: parseInt(cantidadActual),
        cantidad_minima: parseInt(cantidadMinima),
        cantidad_maxima: parseInt(cantidadMaxima),
        ultima_actualizacion: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    showToast('Inventario actualizado correctamente', 'success');
    closeCustomModal();
    loadInventario(); // Recargar los datos

  } catch (error) {
    console.error('Error actualizando inventario:', error);
    showToast('Error al actualizar inventario', 'error');
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

        if (productosError) throw productosError;
        if (inventarioError) throw inventarioError;
        if (movimientosError) throw movimientosError;

        window.productos = productos || [];
        window.inventario = inventario || [];
        window.movimientos = movimientos || [];

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

async function loadInventario() {
  try {
    // Solo obtener inventario con relaciones
    const { data: inventarioData, error: inventarioError } = await supabase
      .from('inventario')
      .select(`
        *,
        producto:producto_id (id, numero_parte, descripcion)
      `)
      .order('ultima_actualizacion', { ascending: false });

    if (inventarioError) throw inventarioError;

    // Obtener productos disponibles para el modal
    const { data: productos } = await supabase
      .from('productos_carton')
      .select('id, numero_parte, descripcion')
      .eq('activo', true)
      .order('numero_parte');

    window.productosDisponibles = productos || [];
    window.inventario = inventarioData || [];
    
    updateInventarioTable();
    setupAddInventoryButton();

  } catch (error) {
    console.error('Error cargando inventario:', error);
    showToast('Error al cargar inventario', 'error');
    await loadBasicInventory(); // Fallback a carga básica
  }
}

// Función de respaldo para cargar inventario sin relaciones
async function loadBasicInventory() {
    try {
        console.log("🔄 Intentando carga básica de inventario...");
        const { data, error } = await supabase
            .from('inventario')
            .select('*');
            
        if (error) throw error;
        
        inventario = data || [];
        console.log(`✅ Carga básica exitosa (${inventario.length} registros)`);
        updateInventarioTable();
        
    } catch (fallbackError) {
        console.error("🔥 Error en carga básica:", fallbackError);
        inventario = [];
        updateInventarioTable();
        showToast("Error crítico al cargar inventario", "error");
    }
}


function setupAddInventoryButton() {
  const addButton = document.getElementById('add-inventory-btn');
  if (!addButton) return;

  addButton.onclick = async () => {
    try {
      // Obtener productos activos
      const { data: productos, error } = await supabase
        .from('productos_carton')
        .select('id, numero_parte, descripcion')
        .eq('activo', true)
        .order('numero_parte');

      if (error) throw error;

      // Crear modal
      const modalHTML = `
        <div class="modal-content">
          <h3>Agregar al Inventario</h3>
          
          <div class="form-group">
            <label for="inventory-product">Producto</label>
            <select id="inventory-product" class="form-control" required>
              <option value="">Seleccionar producto...</option>
              ${productos.map(p => `
                <option value="${p.id}">${p.numero_parte} - ${p.descripcion}</option>
              `).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label for="inventory-current">Stock Actual</label>
            <input type="number" id="inventory-current" class="form-control" min="0" value="0" required>
          </div>
          
          <div class="form-group">
            <label for="inventory-min">Stock Mínimo</label>
            <input type="number" id="inventory-min" class="form-control" min="0" value="0" required>
          </div>
          
          <div class="form-group">
            <label for="inventory-max">Stock Máximo</label>
            <input type="number" id="inventory-max" class="form-control" min="1" value="1000" required>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-cancel" onclick="closeCustomModal()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="saveInventoryItem()">Guardar</button>
          </div>
        </div>
      `;

      showCustomModal('Agregar Inventario', modalHTML);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      showToast('Error al cargar productos para inventario', 'error');
    }
  };
}


function showCustomModal(title, content) {
  const modal = document.getElementById('custom-modal');
  if (!modal) {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'custom-modal';
    modalDiv.className = 'custom-modal-overlay';
    modalDiv.innerHTML = `
      <div class="custom-modal-container">
        <div class="custom-modal-header">
          <h3>${title}</h3>
          <span class="close-modal" onclick="closeCustomModal()">&times;</span>
        </div>
        <div class="custom-modal-body">${content}</div>
      </div>
    `;
    document.body.appendChild(modalDiv);
  } else {
    modal.querySelector('.custom-modal-header h3').textContent = title;
    modal.querySelector('.custom-modal-body').innerHTML = content;
    modal.style.display = 'flex';
  }
}

function closeCustomModal() {
  const modal = document.getElementById('custom-modal');
  if (modal) modal.style.display = 'none';
}


async function saveInventoryItem() {
  try {
    const productoId = document.getElementById('inventory-product').value;
    const cantidadActual = document.getElementById('inventory-current').value;
    const cantidadMinima = document.getElementById('inventory-min').value;
    const cantidadMaxima = document.getElementById('inventory-max').value;

    if (!productoId) {
      showToast('Debes seleccionar un producto', 'error');
      return;
    }

    // Verificar si el producto ya tiene inventario
    const { data: existing } = await supabase
      .from('inventario')
      .select('id')
      .eq('producto_id', productoId)
      .maybeSingle();

    if (existing) {
      showToast('Este producto ya tiene registro de inventario', 'warning');
      return;
    }

    // Obtener datos del producto para la relación
    const { data: productoData } = await supabase
      .from('productos_carton')
      .select('id, numero_parte, descripcion')
      .eq('id', productoId)
      .single();

    // Insertar con select para obtener el registro completo
    const { data: newInventory, error } = await supabase
      .from('inventario')
      .insert([{
        producto_id: productoId,
        cantidad_actual: parseInt(cantidadActual),
        cantidad_minima: parseInt(cantidadMinima),
        cantidad_maxima: parseInt(cantidadMaxima),
        ultima_actualizacion: new Date().toISOString()
      }])
      .select('*');

    if (error) throw error;

    // Agregar manualmente la relación del producto
    const completeRecord = {
      ...newInventory[0],
      producto: productoData
    };

    // Actualizar el array local y la vista
    window.inventario = [completeRecord, ...window.inventario];
    updateInventarioTable();
    
    showToast('Inventario agregado correctamente', 'success');
    closeCustomModal();

  } catch (error) {
    console.error('Error al guardar inventario:', error);
    showToast('Error al guardar inventario: ' + error.message, 'error');
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

function updateInventarioTable() {
  const tbody = document.getElementById('inventario-table-body');
  
  if (!window.inventario || window.inventario.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-inventory">
          <div>
            <i class="fas fa-box-open"></i>
            <p>No hay registros de inventario</p>
            <button class="btn btn-primary" onclick="document.getElementById('add-inventory-btn').click()">
              <i class="fas fa-plus"></i> Agregar Inventario
            </button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = window.inventario.map(item => `
    <tr>
      <td>
        <strong>${item.producto?.numero_parte || 'N/A'}</strong>
        <small>${item.producto?.descripcion || 'Producto no disponible'}</small>
      </td>
      <td>${item.cantidad_actual}</td>
      <td>${item.cantidad_minima}</td>
      <td>${item.cantidad_maxima}</td>
      <td>
        <span class="status-badge ${getStockStatus(item)}">
          ${getStockStatusText(item)}
        </span>
      </td>
      <td>${formatDate(item.ultima_actualizacion)}</td>
      <td>
        <button class="btn-icon edit" onclick="editInventoryItem(${item.id})">
          <i class="fas fa-edit"></i>
        </button>
      </td>
    </tr>
  `).join('');
}
// Función para actualizar campos
async function updateInventoryField(id, field, value) {
    try {
        const { error } = await supabase
            .from('inventario')
            .update({ 
                [field]: parseInt(value),
                ultima_actualizacion: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
        
        showToast('Inventario actualizado', 'success');
        loadInventario(); // Refrescar datos
    } catch (error) {
        console.error('Error actualizando inventario:', error);
        showToast('Error al actualizar', 'error');
    }
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

// Modal Functions (solo para admins)
function showAddProductModal() {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('add-product-modal').style.display = 'block';
    document.getElementById('edit-product-modal').style.display = 'none';
    document.getElementById('movement-modal').style.display = 'none';
    document.getElementById('adjust-modal').style.display = 'none';
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
        
    } catch (error) {
        console.error('Error al cargar los datos del producto:', error);
        showToast('Error al cargar los datos del producto', 'error');
    }
}

function closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
    }
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

// Funciones adicionales que pueden estar en el código original
function editProduct(productId) {
    showEditProductModal(productId);
}

function showMovementModal(type) {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    currentMovementType = type;
    // Implementar lógica del modal de movimientos
    showToast(`Modal de ${type} - Función por implementar`, 'info');
}

function showAdjustModal(productId) {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    // Implementar lógica del modal de ajuste
    showToast('Modal de ajuste - Función por implementar', 'info');
}

function toggleProductStatus(productId, currentStatus) {
    if (currentUser && currentUser.role !== 'admin') {
        showToast('No tienes permisos para realizar esta acción', 'error');
        return;
    }
    
    // Implementar lógica de cambio de estado
    showToast('Cambio de estado - Función por implementar', 'info');
}

function generateReport(reportType) {
    showToast(`Generando reporte: ${reportType}`, 'info');
    // Implementar lógica de reportes
}

function exportReport() {
    showToast('Exportando reporte - Función por implementar', 'info');
}

// Agrega al inicio de tu app.js
window.saveInventoryItem = saveInventoryItem;
window.closeCustomModal = closeCustomModal;
window.loadInventario = loadInventario;


