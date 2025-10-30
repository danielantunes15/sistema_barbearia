/* Conteúdo de supabase_config.js */

const SUPABASE_URL = 'https://qsnktcvfobwwtwqnqlgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzbmt0Y3Zmb2J3d3R3cW5xbGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NzI1NjMsImV4cCI6MjA3NzM0ODU2M30.pAZZOFeMIcfGat5ubSmcPlhw3pXGBOP5CG6Q3m1TfjM';

// Inicializa o cliente Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Função auxiliar para criar um hash SHA-256 da senha.
 * @param {string} password - A senha em texto puro.
 * @returns {string} - O hash SHA-256.
 */
function hashPassword(password) {
    if (typeof CryptoJS === 'undefined') {
        console.error('CryptoJS não foi carregado!');
        alert('Erro de segurança. Recarregue a página.');
        return null;
    }
    return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}