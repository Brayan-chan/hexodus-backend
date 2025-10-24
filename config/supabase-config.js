import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Asegurarnos de que las variables de entorno estén cargadas
dotenv.config()

const supabaseUrl = 'https://xobjjrvqhxzyskaurptr.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseKey) {
    throw new Error('SUPABASE_KEY no está definida en las variables de entorno')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase