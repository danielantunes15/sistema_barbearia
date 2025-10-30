/* Lógica de script.js para dashboard-barbeiro.html */

async function initBarbeiroDashboard() {
    // 1. Redireciona se não for barbeiro
    initializeAuthRedirects('barbeiro');
    
    const auth = await checkAuth();
    if (!auth || auth.tipo !== 'barbeiro') {
        return; // Segurança extra, auth.js já deve ter redirecionado
    }
    
    const barbeiro = auth.data;
    document.getElementById('barbeiroNome').textContent = barbeiro.nome;
    
    // 2. Carrega todos os dados do dashboard
    await carregarDashboardBarbeiro(barbeiro.id); 
    
    // 3. Adiciona listener de logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// ATUALIZADO: carregarDashboardBarbeiro recebe o ID
async function carregarDashboardBarbeiro(barbeiroId) {
    const users = await getAllUsers();
    
    // NOVO: Buscar cortes e agendamentos
    const cortes = await getAllCortes();
    // A função getAgendamentosByBarbeiro busca todos os agendamentos pendentes do barbeiro
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
        
        if (dataCorteString === hojeString) {
            cortesHoje++;
        }
        
        // Contabiliza apenas os cortes do barbeiro logado para o "Cortes Mês"
        if (dataCorteString >= primeiroDiaMes && c.barbeiro_id === barbeiroId) {
            cortesMes++;
        }
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
            div.className = 'cliente-item';
            div.innerHTML = `
                <div class="cliente-info">
                    <h4>${cliente.nome}</h4>
                    <p>${cpfFormatado} • ${cliente.email}</p>
                </div>
                <div class="cliente-stats">
                    <span class="pontos-badge alto">${cliente.pontos}/10 pontos</span>
                    <p style="font-size: 0.8rem; margin-top: 5px;">Faltam ${10 - cliente.pontos}</p>
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
        div.className = 'cliente-item';
        div.innerHTML = `
            <div class="cliente-info">
                <h4>${cliente.nome}</h4>
                <p>${cpfFormatado} • ${cliente.email}</p>
                <p style="font-size: 0.8rem;">Cadastro: ${dataCadastroFormatada}</p>
            </div>
            <div class="cliente-stats">
                <span class="pontos-badge ${badgeClass}">${cliente.pontos} pontos</span>
                <p style="font-size: 0.8rem; margin-top: 5px;">${(cliente.cortes_gratis || 0) + (cliente.pontos >= 10 ? 1 : 0)} cortes grátis</p>
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

// NOVO: Função para carregar Agendamentos na Dashboard Barbeiro
function carregarAgendamentosBarbeiro(agendamentos) {
    const container = document.getElementById('agendamentosHoje');
    container.innerHTML = '';
    
    const hoje = new Date().toLocaleDateString('pt-BR');
    
    // Filtra apenas os agendamentos de hoje
    const agendamentosDeHoje = agendamentos.filter(a => 
        new Date(a.data_hora).toLocaleDateString('pt-BR') === hoje
    );
    
    if (agendamentosDeHoje.length > 0) {
        agendamentosDeHoje.forEach(agendamento => {
            const dataHora = new Date(agendamento.data_hora);
            const hora = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const clienteNome = agendamento.users ? agendamento.users.nome : 'Cliente Removido';
            
            const div = document.createElement('div');
            div.className = 'cliente-item';
            div.innerHTML = `
                <div class="cliente-info">
                    <h4>${hora} - ${clienteNome}</h4>
                    <p>Status: ${agendamento.status}</p>
                </div>
                <div class="cliente-stats">
                    <span class="pontos-badge baixo">Agendado</span>
                </div>
            `;
            container.appendChild(div);
        });
    } else {
        container.innerHTML = '<p style="text-align: center; color: #b3b3b3;">Nenhum agendamento pendente para hoje.</p>';
    }
}


// ATUALIZADO: carregarEstatisticasFrequencia usa a nova tabela 'cortes'
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

    const clientesFrequentes = users.map(user => {
        return { ...user, cortesRecentes: cortesPorCliente[user.id] || 0 };
    }).filter(user => user.cortesRecentes > 0)
      .sort((a, b) => b.cortesRecentes - a.cortesRecentes)
      .slice(0, 5);
    
    let html = '<h4>Clientes Mais Frequentes (últimos 30 dias)</h4>';
    
    if (clientesFrequentes.length > 0) {
        clientesFrequentes.forEach((cliente, index) => {
            html += `
                <div class="ranking-item" style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #444;">
                    <span>${index + 1}. ${cliente.nome}</span>
                    <span>${cliente.cortesRecentes} cortes</span>
                </div>
            `;
        });
    } else {
        html += '<p style="text-align: center; color: #b3b3b3;">Nenhum corte nos últimos 30 dias</p>';
    }
    
    container.innerHTML = html;
}