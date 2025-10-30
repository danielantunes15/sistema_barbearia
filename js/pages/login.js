/* Lógica de script.js para index.html */

function initLoginPage() {
    // Redireciona se já estiver logado
    initializeAuthRedirects('public');
    
    // Tabs no login
    window.showTab = (tab) => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.login-form').forEach(form => form.classList.remove('active'));
        
        const tabIndex = tab === 'cliente' ? 0 : 1;
        document.querySelectorAll('.tab-btn')[tabIndex].classList.add('active');
        document.getElementById(tab === 'cliente' ? 'loginClienteForm' : 'loginBarbeiroForm').classList.add('active');
    };

    // Login Cliente
    document.getElementById('loginClienteForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const cpf = document.getElementById('cpfCliente').value.replace(/\D/g, '');
        const password = document.getElementById('passwordCliente').value;
        if (cpf.length !== 11) return alert('CPF deve ter 11 dígitos!');

        const hashedPassword = hashPassword(password);
        if (!hashedPassword) return;

        const user = await getUserByCpfAndPassword(cpf, hashedPassword);
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'dashboard-cliente.html';
        } else {
            alert('CPF ou senha incorretos!');
        }
    });

    // Login Barbeiro
    document.getElementById('loginBarbeiroForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const cpf = document.getElementById('cpfBarbeiro').value.replace(/\D/g, '');
        const password = document.getElementById('passwordBarbeiro').value;
        if (cpf.length !== 11) return alert('CPF deve ter 11 dígitos!');

        const hashedPassword = hashPassword(password);
        if (!hashedPassword) return;

        const barbeiro = await getBarbeiroByCpfAndPassword(cpf, hashedPassword);
        if (barbeiro) {
            localStorage.setItem('currentBarbeiro', JSON.stringify(barbeiro));
            window.location.href = 'dashboard-barbeiro.html';
        } else {
            alert('CPF ou senha incorretos!');
        }
    });

    // Formatador de CPF
    document.getElementById('cpfCliente').addEventListener('input', (e) => formatarCPF(e.target));
    document.getElementById('cpfBarbeiro').addEventListener('input', (e) => formatarCPF(e.target));
}