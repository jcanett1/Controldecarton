import { createClient } from '@supabase/supabase-js'

// Configuración
const SUPABASE_URL = 'https://bdrxcilsuxbkpmolfbgu.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcnhjaWxzdXhia3Btb2xmYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNTQ0NTcsImV4cCI6MjA2OTgzMDQ1N30.iSO9EoOMEoi_VARxPqMd2yMUvQvTmKJntxJvwAl-TVs' // Usa la clave pública anónima

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Función para obtener productos
async function getProductos() {
  const { data, error } = await supabase
    .from('productos_carton')
    .select('*')
    .eq('activo', true)
  
  if (error) throw error
  return data
}

// Función para obtener inventario
async function getInventario(productoId) {
  const { data, error } = await supabase
    .from('inventario')
    .select('*')
    .eq('producto_id', productoId)
    .single()
  
  if (error) throw error
  return data
}

// Función para obtener movimientos
async function getMovimientos(limite = 10) {
  const { data, error } = await supabase
    .from('movimientos_inventario')
    .select('*')
    .order('fecha_movimiento', { ascending: false })
    .limit(limite)
  
  if (error) throw error
  return data
}
