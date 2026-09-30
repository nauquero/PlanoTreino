// Configuração do Supabase (Project Settings → API).
// Estes dois valores são PÚBLICOS por desenho: a segurança está no SQL
// (RLS + funções com PIN), não em esconder a chave.
// Enquanto estiverem por preencher, o site corre em "modo demo"
// (dados guardados só neste dispositivo, qualquer PIN de 4 dígitos entra).

export const SUPABASE_URL = 'COLE_AQUI_O_PROJECT_URL';        // ex: https://abcdxyz.supabase.co
export const SUPABASE_ANON_KEY = 'COLE_AQUI_A_ANON_PUBLIC_KEY';
