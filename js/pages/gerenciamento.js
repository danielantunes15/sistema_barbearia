/* Lógica de script.js para gerenciar-usuarios.html */

function initGerenciamentoPage() {
    // 1. Verificar se é um barbeiro logado
    initializeAuthRedirects('barbeiro');
    
    console.log('Carregando Painel de Gerenciamento...');
    
    // 2. Carregar listas
    loadManagementLists();
    
    // 3. Adicionar listener para criar cliente
    document.getElementById('adminCreateClienteForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('adminNomeCliente').value;
        const cpf = document.getElementById('adminCpfCliente').value.replace(/\D/g, '');
        const email = document.getElementById('adminEmailCliente').value;
        const dataNascimento = document.getElementById('adminNascCliente').value;
        
        // CORREÇÃO: O seletor agora busca o INPUT pelo ID (graças à correção no HTML)
        const password = document.getElementById('adminSenhaCliente').value;
        
        if (!nome || !cpf || !email || !dataNascimento || !password) {
            return alert('Preencha todos os campos!');
        }
        if (password.length < 6) {
            return alert('A senha deve ter pelo menos 6 caracteres.');
        }
        if (await emailOrCpfExists(email, cpf)) {
            return alert('Este CPF ou E-mail já está cadastrado!');
        }
        
        const hashedPassword = hashPassword(password);
        const newUser = {
            id: 'user_' + Date.now(),
            nome, cpf, email, dataNascimento, password: hashedPassword,
            pontos: 0, cortes_gratis: 0, dataCadastro: new Date().toISOString()
        };
        
        const created = await createNewUser(newUser);
        if (created) {
            alert('Cliente cadastrado com sucesso!');
            e.target.reset();
            await loadManagementLists();
        } else {
            alert('Erro ao cadastrar cliente.');
        }
    });
    
    // 4. Adicionar listener para criar barbeiro
    document.getElementById('adminCreateBarbeiroForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('adminNomeBarbeiro').value;
        const cpf = document.getElementById('adminCpfBarbeiro').value.replace(/\D/g, '');
        const email = document.getElementById('adminEmailBarbeiro').value;
        const password = document.getElementById('adminSenhaBarbeiro').value;

        if (!nome || !cpf || !email || !password) {
            return alert('Preencha todos os campos!');
        }
        if (cpf.length !== 11 || !validarCPF(cpf)) {
            return alert('CPF inválido!');
        }
        if (password.length < 6) {
            return alert('A senha deve ter pelo menos 6 caracteres.');
        }
        
        // Verifica se CPF ou Email do barbeiro já existem
        if (await barbeiroCpfOrEmailExists(email, cpf)) {
            return alert('Este CPF ou E-mail de barbeiro já está cadastrado!');
        }

        const hashedPassword = hashPassword(password);
        const newBarbeiro = {
            id: 'barbeiro_' + Date.now(),
            nome, cpf, email, password: hashedPassword,
            dataCadastro: new Date().toISOString()
        };

        const created = await createNewBarbeiro(newBarbeiro);
        if (created) {
            alert('Barbeiro cadastrado com sucesso!');
            e.target.reset();
            await loadManagementLists();
        } else {
            alert('Erro ao cadastrar barbeiro.');
        }
    });

    // 5. Adicionar formatadores de CPF (referenciando utils.js)
    document.getElementById('adminCpfCliente').addEventListener('input', (e) => formatarCPF(e.target));
    document.getElementById('adminCpfBarbeiro').addEventListener('input', (e) => formatarCPF(e.target));
}

// Função para carregar e recarregar as listas
async function loadManagementLists() {
    const listaClientes = document.getElementById('listaClientes');
    const listaBarbeiros = document.getElementById('listaBarbeiros');
    
    if (!listaClientes || !listaBarbeiros) return;

    listaClientes.innerHTML = 'Carregando...';
    listaBarbeiros.innerHTML = 'Carregando...';

    // Carregar Clientes
    const users = await getAllUsers();
    // Buscar todos os cortes para calcular o total de cortes de cada cliente
    const todosCortes = await getAllCortes();
    const cortesPorCliente = todosCortes.reduce((acc, corte) => {
        acc[corte.cliente_id] = (acc[corte.cliente_id] || 0) + 1;
        return acc;
    }, {});
    
    listaClientes.innerHTML = '';
    users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div class="list-item-info">
                <h4>${user.nome}</h4>
                <p>CPF: ${user.cpf} | Email: ${user.email}</p>
                <p>Pontos: ${user.pontos} | Cortes Grátis: ${user.cortes_gratis || 0} | Total Cortes: ${cortesPorCliente[user.id] || 0}</p>
            </div>
            <button class="btn btn-danger btn-sm" data-id="${user.id}" data-tipo="user">Excluir</button>
        `;
        listaClientes.appendChild(item);
    });

    // Carregar Barbeiros
    const barbeiros = await getAllBarbeiros();
    listaBarbeiros.innerHTML = '';
    barbeiros.forEach(barb => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div class="list-item-info">
                <h4>${barb.nome}</h4>
                <p>CPF: ${barb.cpf || 'N/A'} | Email: ${barb.email}</p>
            </div>
            <button class="btn btn-danger btn-sm" data-id="${barb.id}" data-tipo="barbeiro">Excluir</button>
        `;
        listaBarbeiros.appendChild(item);
    });
    
    // CORREÇÃO: O seletor foi atualizado de '.btn-delete' para '.list-item .btn-danger'
    // Adicionar listeners aos botões de exclusão
    document.querySelectorAll('.list-item .btn-danger').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const tipo = e.target.dataset.tipo;
            const nome = e.target.closest('.list-item').querySelector('h4').textContent; // Seletor mais seguro

            if (confirm(`Tem certeza que deseja excluir "${nome}"? Esta ação removerá os cortes/agendamentos associados.`)) {
                let success = false;
                if (tipo === 'user') {
                    success = await deleteUser(id);
                } else if (tipo === 'barbeiro') {
                    success = await deleteBarbeiro(id);
                }
                
                if (success) {
                    alert('Usuário excluído com sucesso!');
                    await loadManagementLists();
                } else {
                    alert('Erro ao excluir usuário.');
                }
            }
        });
    });
}

// Função para as abas
function showManagementTab(tab) {
    // Esconde todos
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.management-tab').forEach(form => {
        form.classList.remove('active');
        form.style.display = 'none'; // Garante que está escondido
    });
    
    // Mostra o correto
    const tabIndex = tab === 'clientes' ? 0 : 1;
    document.querySelectorAll('.tab-btn')[tabIndex].classList.add('active');
    
    const activeTabElement = document.getElementById(tab === 'clientes' ? 'tabClientes' : 'tabBarbeiros');
    activeTabElement.classList.add('active');
    activeTabElement.style.display = 'block'; // Garante que está visível
}

// Anexa a função de tab ao objeto window para que o 'onclick' do HTML funcione
window.showManagementTab = showManagementTab;