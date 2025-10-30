/* danielantunes15/sistema_barbearia/sistema_barbearia-197d2932e7e3d39489bf9472ce2a71471b9e3a99/supabase_config.js */

const SUPABASE_URL = 'https://qsnktcvfobwwtwqnqlgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzbmt0Y3Zmb2J3d3R3cW5xbGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NzI1NjMsImV4cCI6MjA3NzM0ODU2M30.pAZZOFeMIcfGat5ubSmcPlhw3pXGBOP5CG6Q3m1TfjM';

// Inicializa o cliente Supabase
// CORREÇÃO: Usamos o 'supabase' global do CDN e salvamos como 'supabaseClient'
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

/**
 * Esta função pode ser usada para popular o banco de dados Supabase com dados iniciais.
 * Execute-a UMA VEZ manualmente no console do navegador (F12) após o login
 * para evitar duplicatas.
 *
 * IMPORTANTE: As senhas aqui serão hasheadas antes de serem enviadas.
 * O hash de "123456" (SHA-256) é: 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
 */
async function initializeSupabaseData() {
    console.log('Verificando dados iniciais no Supabase...');
    // CORREÇÃO: Usar supabaseClient
    const { data: userData } = await supabaseClient.from('users').select('id').limit(1);

    if (userData.length === 0) {
        console.log('Inicializando dados no Supabase...');
        
        const HASHED_PASS = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'; // hash('123456')

        const initialBarbeiros = [
            { id: 'barbeiro_1', nome: 'Carlos Silva', email: 'carlos@barbearia.com', password: HASHED_PASS, cpf: '11111111111', dataCadastro: '2023-01-01' },
            { id: 'barbeiro_2', nome: 'Ricardo Santos', email: 'ricardo@barbearia.com', password: HASHED_PASS, cpf: '22222222222', dataCadastro: '2023-01-01' }
        ];
        // CORREÇÃO: Usar supabaseClient
        await supabaseClient.from('barbeiros').insert(initialBarbeiros, { onConflict: 'id' });

        // ATUALIZADO: Removido 'historico' e adicionado 'cortesGratis'
        const initialUsers = [
            { id: 'user_1', nome: 'João Silva', dataNascimento: '1990-05-15', cpf: '12345678901', email: 'joao@example.com', password: HASHED_PASS, pontos: 8, cortesGratis: 1, dataCadastro: '2023-01-15' },
            { id: 'user_2', nome: 'Maria Santos', dataNascimento: '1985-08-22', cpf: '98765432100', email: 'maria@example.com', password: HASHED_PASS, pontos: 6, cortesGratis: 0, dataCadastro: '2023-02-10' }
        ];
        // CORREÇÃO: Usar supabaseClient
        await supabaseClient.from('users').insert(initialUsers, { onConflict: 'id' });
        
        // NOVO: Dados iniciais da tabela 'cortes'
        const initialCortes = [
            // Cortes para João Silva (8 cortes + 1 grátis resgatado)
            { cliente_id: 'user_1', barbeiro_id: 'barbeiro_1', data_hora: '2023-01-15T10:30:00Z', tipo: 'corte_pago' },
            { cliente_id: 'user_1', barbeiro_id: 'barbeiro_1', data_hora: '2023-02-01T14:00:00Z', tipo: 'corte_pago' },
            { cliente_id: 'user_1', barbeiro_id: 'barbeiro_1', data_hora: '2023-02-20T11:15:00Z', tipo: 'corte_pago' },
            { cliente_id: 'user_1', barbeiro_id: 'barbeiro_1', data_hora: '2023-03-10T16:30:00Z', tipo: 'corte_pago' },
            { cliente_id: 'user_1', barbeiro_id: 'barbeiro_1', data_hora: '2023-03-28T09:45:00Z', tipo: 'corte_pago' },
            { cliente_id: 'user_1', barbeiro_id: 'barbeiro_1', data_hora: '2023-04-15T13:20:00Z', tipo: 'corte_pago' },
            { cliente_id: 'user_1', barbeiro_id: 'barbeiro_1', data_hora: '2023-04-30T15:10:00Z', tipo: 'corte_pago' },
            { cliente_id: 'user_1', barbeiro_id: 'barbeiro_1', data_hora: '2023-05-18T10:00:00Z', tipo: 'corte_pago' },
            { cliente_id: 'user_1', barbeiro_id: 'barbeiro_2', data_hora: '2023-06-05T10:00:00Z', tipo: 'corte_gratis' }, // Exemplo de corte grátis
            
            // Cortes para Maria Santos (6 cortes)
            { cliente_id: 'user_2', barbeiro_id: 'barbeiro_1', data_hora: '2023-02-10T11:00:00Z', tipo: 'corte_pago' },
            { cliente_id: 'user_2', barbeiro_id: 'barbeiro_1', data_hora: '2023-02-25T14:30:00Z', tipo: 'corte_pago' },
            { cliente_id: 'user_2', barbeiro_id: 'barbeiro_2', data_hora: '2023-03-12T10:15:00Z', tipo: 'corte_pago' },
            { cliente_id: 'user_2', barbeiro_id: 'barbeiro_1', data_hora: '2023-03-28T16:45:00Z', tipo: 'corte_pago' },
            { cliente_id: 'user_2', barbeiro_id: 'barbeiro_2', data_hora: '2023-04-15T13:00:00Z', tipo: 'corte_pago' },
            { cliente_id: 'user_2', barbeiro_id: 'barbeiro_1', data_hora: '2023-04-30T15:30:00Z', tipo: 'corte_pago' }
        ];
        
        await supabaseClient.from('cortes').insert(initialCortes);
        
        console.log('Dados iniciais criados com sucesso no Supabase!');
    } else {
        console.log('O banco de dados Supabase já contém dados.');
    }
}