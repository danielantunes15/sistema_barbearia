/* =================================== */
/* ARQUIVO: js/pages/barbeiro.js (ATUALIZADO) */
/* =================================== */

async function initBarbeiroDashboard() {
    // 1. Redireciona se não for barbeiro
    initializeAuthRedirects('barbeiro');
    
    const auth = await checkAuth();
    if (!auth || auth.tipo !== 'barbeiro') {
        return; // Segurança extra, auth.js já deve ter redirecionado
    }
    
    const barbeiro = auth.data;
    document.getElementById('barbeiroNome').textContent = `Olá, ${barbeiro.nome.split(' ')[0]}`; // Mostra só o primeiro nome
    
    // 2. Carrega todos os dados do dashboard
    await carregarDashboardBarbeiro(barbeiro.id); 
    
    // 3. Adiciona listener de logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // ===================================
    // NOVOS LISTENERS (GESTÃO E MODAL)
    // ===================================
    
    // 4. Listener para ações nos agendamentos (Confirmar/Cancelar)
    const agendamentosHojeContainer = document.getElementById('agendamentosHoje');
    if (agendamentosHojeContainer) {
        agendamentosHojeContainer.addEventListener('click', handleAgendamentoActions);
    }
    
    // 5. Listener para cliques na lista de "Todos os Clientes" (Abrir Modal)
    const todosClientesContainer = document.getElementById('todosClientes');
    if (todosClientesContainer) {
        todosClientesContainer.addEventListener('click', handleClienteClick);
    }
    
    // 6. Listener para fechar o modal
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', fecharModalCliente);
    }
    const modalOverlay = document.getElementById('clienteModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            // Fecha o modal se clicar fora do .modal-content
            if (e.target === modalOverlay) {
                fecharModalCliente();
            }
        });
    }
}

// ATUALIZADO: carregarDashboardBarbeiro recebe o ID
async function carregarDashboardBarbeiro(barbeiroId) {
    // Esta função agora também é chamada para recarregar os dados
    // após uma ação de agendamento.
    
    const users = await getAllUsers();
    const cortes = await getAllCortes();
    const agendamentos = await getAgendamentosByBarbeiro(barbeiroId); 
    
    document.getElementById('dataAgendamentos').textContent = new Date().toLocaleDateString('pt-BR');
    carregarAgendamentosBarbeiro(agendamentos);

    console.log('Carregando dashboard barbeiro. Total de clientes:', users.length);
    
    document.getElementById('totalClientes').textContent = users.length;
    
    let cortesHoje = 0;
    let cortesMes = 0;
    const hojeString = new Date().toISOString().split('T')[0];
    const primeiroDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    cortes.forEach(c => {
        const dataCorteString = c.data_hora.split('T')[0];
        if (dataCorteString === hojeString) cortesHoje++;
        if (dataCorteString >= primeiroDiaMes && c.barbeiro_id === barbeiroId) cortesMes++;
    });

    document.getElementById('cortesHoje').textContent = cortesHoje;
    document.getElementById('cortesMes').textContent = cortesMes;
    document.getElementById('totalFidelidadesProximas').textContent = users.filter(u => u.pontos >= 8 && u.pontos < 10).length;
    
    const clientesProximos = users.filter(u => u.pontos >= 8 && u.pontos < 10)
        .sort((a, b) => b.pontos - a.pontos);
    
    const containerProximos = document.getElementById('clientesProximos');
    containerProximos.innerHTML = '';
    
    if (clientesProximos.length > 0) {
        clientesProximos.forEach(cliente => {
            const cpfFormatado = cliente.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            const div = document.createElement('div');
            div.className = 'cliente-item'; // Nota: esta lista não é clicável por defeito
            div.innerHTML = `
                <div class="cliente-info">
                    <h4>${cliente.nome}</h4>
                    <p>${cpfFormatado} • ${cliente.email}</p>
                </div>
                <div class="cliente-stats">
                    <span class="pontos-badge alto">${cliente.pontos}/10 pontos</span>
                </div>
            `;
            containerProximos.appendChild(div);
        });
    } else {
        containerProximos.innerHTML = '<p style="text-align: center; color: #b3b3b3;">Nenhum cliente próximo da fidelidade</p>';
    }
    
    const containerTodos = document.getElementById('todosClientes');
    containerTodos.innerHTML = '';
    
    users.sort((a, b) => b.pontos - a.pontos).forEach(cliente => {
        let badgeClass = 'baixo';
        if (cliente.pontos >= 8) badgeClass = 'alto';
        else if (cliente.pontos >= 5) badgeClass = 'medio';
        
        const cpfFormatado = cliente.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        const dataCadastroFormatada = cliente.dataCadastro ? new Date(cliente.dataCadastro).toLocaleDateString('pt-BR') : 'N/A';

        const div = document.createElement('div');
        
        // NOVO: Adiciona classe e data-id para o Modal
        div.className = 'cliente-item cliente-item-clicavel';
        div.dataset.id = cliente.id; 
        
        div.innerHTML = `
            <div class="cliente-info">
                <h4>${cliente.nome}</h4>
                <p>${cpfFormatado} • ${cliente.email}</p>
                <p style="font-size: 0.8rem;">Cadastro: ${dataCadastroFormatada}</p>
            </div>
            <div class="cliente-stats">
                <span class="pontos-badge ${badgeClass}">${cliente.pontos} pontos</span>
                <p style="font-size: 0.8rem; margin-top: 5px;">${(cliente.cortes_gratis || 0)} cortes grátis</p>
            </div>
        `;
        containerTodos.appendChild(div);
    });
    
    if (document.getElementById('searchClient')) {
        document.getElementById('searchClient').addEventListener('input', function(e) {
            const termo = e.target.value.toLowerCase();
            const clientesItems = containerTodos.querySelectorAll('.cliente-item');
            
            clientesItems.forEach(item => {
                const texto = item.textContent.toLowerCase();
                item.style.display = texto.includes(termo) ? 'flex' : 'none';
            });
        });
    }
    
    carregarEstatisticasFrequencia(users, cortes); // Passa cortes
}

// ATUALIZADO: Carrega Agendamentos com botões de ação
function carregarAgendamentosBarbeiro(agendamentos) {
    const container = document.getElementById('agendamentosHoje');
    container.innerHTML = '';
    
    const hoje = new Date().toLocaleDateString('pt-BR');
    
    const agendamentosDeHoje = agendamentos.filter(a => 
        new Date(a.data_hora).toLocaleDateString('pt-BR') === hoje && a.status === 'pendente'
    );
    
    if (agendamentosDeHoje.length > 0) {
        agendamentosDeHoje.forEach(agendamento => {
            const dataHora = new Date(agendamento.data_hora);
            const hora = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const clienteNome = agendamento.users ? agendamento.users.nome : 'Cliente Removido';
            
            const div = document.createElement('div');
            div.className = 'cliente-item'; // Reutiliza o estilo
            
            // BOTÕES ATUALIZADOS AQUI
            div.innerHTML = `
                <div class="cliente-info">
                    <h4>${hora} - ${clienteNome}</h4>
                    <p>Status: ${agendamento.status}</p>
                </div>
                <div class="agendamento-actions">
                    <button class="btn btn-success btn-sm" data-id="${agendamento.id}">Confirmar</button>
                    <button class="btn btn-danger btn-sm" data-id="${agendamento.id}">Cancelar</button>
                </div>
            `;
            container.appendChild(div);
        });
    } else {
        container.innerHTML = '<p style="text-align: center; color: #b3b3b3;">Nenhum agendamento pendente para hoje.</p>';
    }
}


// Função de Estatísticas (Sem alteração)
function carregarEstatisticasFrequencia(users, cortes) {
    const container = document.getElementById('estatisticasFrequencia');
    if (!container) return;
    
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    const trintaDiasAtrasISO = trintaDiasAtras.toISOString();
    const cortesRecentes = cortes.filter(c => c.data_hora >= trintaDiasAtrasISO && c.tipo === 'corte_pago');
    
    const cortesPorCliente = {};
    cortesRecentes.forEach(c => {
        cortesPorCliente[c.cliente_id] = (cortesPorCliente[c.cliente_id] || 0) + 1;
    });

    const clientesFrequentes = users.map(user => ({ ...user, cortesRecentes: cortesPorCliente[user.id] || 0 }))
        .filter(user => user.cortesRecentes > 0)
        .sort((a, b) => b.cortesRecentes - a.cortesRecentes)
        .slice(0, 5);
    
    let html = '<h4>Clientes Mais Frequentes (últimos 30 dias)</h4>';
    if (clientesFrequentes.length > 0) {
        clientesFrequentes.forEach((cliente, index) => {
            html += `<div class="ranking-item" style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #444;">
                        <span>${index + 1}. ${cliente.nome}</span>
                        <span>${cliente.cortesRecentes} cortes</span>
                    </div>`;
        });
    } else {
        html += '<p style="text-align: center; color: #b3b3b3;">Nenhum corte nos últimos 30 dias</p>';
    }
    container.innerHTML = html;
}

// ===================================
// NOVAS FUNÇÕES DE GESTÃO E MODAL
// ===================================

/**
 * Gere os cliques nos botões de "Confirmar" ou "Cancelar" agendamento.
 */
async function handleAgendamentoActions(e) {
    const target = e.target;
    const agendamentoId = target.dataset.id;
    if (!agendamentoId) return; // Não clicou num botão com ID

    let novoStatus = null;
    let acao = null;

    if (target.classList.contains('btn-success')) { // ATUALIZADO de btn-confirm
        novoStatus = 'concluido';
        acao = 'confirmar';
    } else if (target.classList.contains('btn-danger')) { // ATUALIZADO de btn-cancel
        novoStatus = 'cancelado';
        acao = 'cancelar';
    }
    
    if (novoStatus && confirm(`Tem a certeza que deseja ${acao} este agendamento?`)) {
        console.log(`Atualizando agendamento ${agendamentoId} para ${novoStatus}`);
        
        // Chama a API para atualizar o status
        const success = await updateAgendamentoStatus(agendamentoId, novoStatus);
        
        if (success) {
            // Recarrega o dashboard inteiro para refletir a mudança
            const auth = await checkAuth();
            if (auth) {
                await carregarDashboardBarbeiro(auth.data.id);
            }
        } else {
            alert('Erro ao atualizar o agendamento.');
        }
    }
}

/**
 * Gere o clique na lista de "Todos os Clientes" para abrir o modal.
 */
function handleClienteClick(e) {
    // Encontra o item de cliente clicável mais próximo
    const clienteItem = e.target.closest('.cliente-item-clicavel');
    if (!clienteItem) return; // Clique não foi num item de cliente
    
    const clienteId = clienteItem.dataset.id;
    if (clienteId) {
        abrirModalCliente(clienteId);
    }
}

/**
 * Busca os dados do cliente e do seu histórico, e preenche o modal.
 */
async function abrirModalCliente(clienteId) {
    const modal = document.getElementById('clienteModal');
    if (!modal) return;
    
    // Mostra o modal e o estado de "loading"
    modal.style.display = 'flex';
    document.getElementById('modalClienteNome').textContent = 'A carregar...';
    document.getElementById('modalClienteCpf').textContent = '...';
    document.getElementById('modalClienteEmail').textContent = '...';
    document.getElementById('modalClientePontos').textContent = '...';
    document.getElementById('modalClienteCortesGratis').textContent = '...';
    document.getElementById('modalClienteHistorico').innerHTML = '<p>A carregar histórico...</p>';
    
    // Busca os dados em paralelo
    const [user, cortes] = await Promise.all([
        getUserById(clienteId),
        getCortesByUserId(clienteId)
    ]);
    
    if (!user) {
        alert('Erro ao carregar dados do cliente.');
        fecharModalCliente();
        return;
    }
    
    // Preenche os dados
    document.getElementById('modalClienteNome').textContent = user.nome;
    document.getElementById('modalClienteCpf').textContent = user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    document.getElementById('modalClienteEmail').textContent = user.email;
    document.getElementById('modalClientePontos').textContent = `${user.pontos} / 10`;
    document.getElementById('modalClienteCortesGratis').textContent = user.cortes_gratis || 0;
    
    // Preenche o histórico de cortes
    const historicoContainer = document.getElementById('modalClienteHistorico');
    if (cortes.length > 0) {
        historicoContainer.innerHTML = ''; // Limpa o "loading"
        cortes.forEach(corte => {
            const dataFormatada = new Date(corte.data_hora).toLocaleDateString('pt-BR');
            const barbeiroNome = corte.barbeiros ? corte.barbeiros.nome : 'N/A';
            const tipoCorte = corte.tipo === 'corte_gratis' ? 'Corte Grátis' : 'Corte Pago';
            
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <span>${dataFormatada} (com ${barbeiroNome})</span>
                <span>${tipoCorte}</span>
            `;
            historicoContainer.appendChild(item);
        });
    } else {
        historicoContainer.innerHTML = '<p>Nenhum corte registado para este cliente.</p>';
    }
    
    // Ativa os ícones dentro do modal
    feather.replace();
}

/**
 * Fecha o modal de perfil do cliente.
 */
function fecharModalCliente() {
    const modal = document.getElementById('clienteModal');
    if (modal) {
        modal.style.display = 'none';
    }
}