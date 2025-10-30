/* Funções de script.js */

/**
 * Verifica se o usuário está logado e atualiza seus dados.
 * @returns {Promise<Object|null>} - {tipo: 'cliente'|'barbeiro', data: Object} ou null
 */
async function checkAuth() {
    const currentUserJSON = localStorage.getItem('currentUser');
    const currentBarbeiroJSON = localStorage.getItem('currentBarbeiro');
    
    try {
        if (currentUserJSON) {
            const userData = JSON.parse(currentUserJSON);
            const user = await getUserById(userData.id); // Busca dados frescos
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                return { tipo: 'cliente', data: user };
            }
        }
        if (currentBarbeiroJSON) {
            const barbeiroData = JSON.parse(currentBarbeiroJSON);
            const barbeiro = await getBarbeiroById(barbeiroData.id); // Busca dados frescos
            if (barbeiro) {
                localStorage.setItem('currentBarbeiro', JSON.stringify(barbeiro));
                return { tipo: 'barbeiro', data: barbeiro };
            }
        }
    } catch (e) {
        console.error("Erro na verificação de autenticação:", e);
        localStorage.clear();
    }
    
    return null;
}

/**
 * Faz logout do usuário e redireciona para o index.
 */
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentBarbeiro');
    window.location.href = 'index.html';
}

/**
 * Redireciona o usuário com base na autenticação.
 * @param {string} currentPage - 'public', 'cliente', 'barbeiro'
 */
async function initializeAuthRedirects(currentPage = 'public') {
    const auth = await checkAuth();
    
    if (auth) {
        // Usuário está logado
        if (currentPage === 'public') {
            // Se está em index.html ou cadastro.html, redireciona para o dashboard correto
            const redirectUrl = auth.tipo === 'cliente' ? 'dashboard-cliente.html' : 'dashboard-barbeiro.html';
            window.location.href = redirectUrl;
        } else if (currentPage !== auth.tipo) {
            // Se está na página errada (ex: cliente em dashboard-barbeiro), redireciona
            const redirectUrl = auth.tipo === 'cliente' ? 'dashboard-cliente.html' : 'dashboard-barbeiro.html';
            window.location.href = redirectUrl;
        }
        // Se não, está logado E na página correta, então não faz nada.
        
    } else {
        // Usuário NÃO está logado
        if (currentPage !== 'public') {
            // Se tentar acessar página protegida, redireciona para o login
            window.location.href = 'index.html';
        }
        // Se não, está no login/cadastro e não logado, não faz nada.
    }
}