/* Lógica de script.js para cadastro.html */

function initCadastroPage() {
    // Redireciona se já estiver logado
    initializeAuthRedirects('public');

    document.getElementById('cadastroForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const nome = document.getElementById('nome').value;
        const dataNascimento = document.getElementById('dataNascimento').value;
        const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (cpf.length !== 11 || !validarCPF(cpf)) return alert('CPF inválido!');
        if (!dataNascimento) return alert('Data de nascimento é obrigatória!');
        if (password.length < 6) return alert('A senha deve ter pelo menos 6 caracteres.');

        // Validação de idade
        const nascimento = new Date(dataNascimento);
        const hoje = new Date();
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
        if (idade < 16) return alert('É necessário ter pelo menos 16 anos para se cadastrar.');

        if (await emailOrCpfExists(email, cpf)) return alert('Este CPF ou e-mail já está cadastrado!');
        
        const hashedPassword = hashPassword(password);
        if (!hashedPassword) return;

        const newUser = {
            id: 'user_' + Date.now(),
            nome: nome,
            dataNascimento: dataNascimento,
            cpf: cpf,
            email: email,
            password: hashedPassword,
            pontos: 0,
            cortes_gratis: 0, 
            dataCadastro: new Date().toISOString()
        };
        
        const createdUser = await createNewUser(newUser);
        if (createdUser) {
            localStorage.setItem('currentUser', JSON.stringify(createdUser));
            window.location.href = 'dashboard-cliente.html';
        } else {
            alert('Ocorreu um erro no cadastro. Tente novamente.');
        }
    });

    // Formatador de CPF e Verificador de Email/CPF
    const cpfInput = document.getElementById('cpf');
    const emailInput = document.getElementById('email');
    cpfInput.addEventListener('input', () => {
        formatarCPF(cpfInput);
        checkFieldAvailability(cpfInput, 'cpf');
    });
    emailInput.addEventListener('input', () => checkFieldAvailability(emailInput, 'email'));
}