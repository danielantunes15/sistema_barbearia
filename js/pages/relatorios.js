/* =================================== */
/* ARQUIVO: js/pages/relatorios.js (NOVO) */
/* =================================== */

// Função de inicialização chamada pelo main.js
function initRelatoriosPage() {
    // 1. Verificar se é um barbeiro logado
    initializeAuthRedirects('barbeiro');
    
    // 2. Adicionar listeners
    const periodoSelect = document.getElementById('periodo');
    if (periodoSelect) {
        periodoSelect.addEventListener('change', function() {
            const isCustom = this.value === 'customizado';
            document.getElementById('dataInicio').disabled = !isCustom;
            document.getElementById('dataFim').disabled = !isCustom;
        });
    }

    const aplicarFiltroBtn = document.getElementById('aplicarFiltro');
    if (aplicarFiltroBtn) {
        aplicarFiltroBtn.addEventListener('click', carregarRelatorios);
    }
    
    const exportClientesBtn = document.getElementById('exportClientes');
    if (exportClientesBtn) {
        exportClientesBtn.addEventListener('click', exportarClientes);
    }
    
    const exportCortesBtn = document.getElementById('exportCortes');
    if (exportCortesBtn) {
        exportCortesBtn.addEventListener('click', exportarCortes);
    }
    
    // 3. Carregar relatórios inicialmente
    carregarRelatorios();
    
    // 4. Ativar ícones (se existirem)
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

// ATUALIZADO: carregarRelatorios implementa filtros e novos cards
async function carregarRelatorios() {
    console.log('Carregando relatórios...');
    const todosCortes = await getAllCortes();
    
    // NOVO: Precisamos de todos os usuários para o relatório de ausentes
    const todosUsuarios = await getAllUsers();
    
    const periodo = document.getElementById('periodo').value;
    const dataInicioInput = document.getElementById('dataInicio').value;
    const dataFimInput = document.getElementById('dataFim').value;
    
    let cortesFiltrados = [];
    let inicioFiltro = null;
    let fimFiltro = null;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // 1. Determinar o período
    switch (periodo) {
        case 'hoje':
            inicioFiltro = new Date(hoje);
            fimFiltro = new Date(hoje);
            fimFiltro.setHours(23, 59, 59, 999);
            break;
        case 'semana':
            inicioFiltro = new Date(hoje);
            inicioFiltro.setDate(hoje.getDate() - hoje.getDay()); // Domingo
            fimFiltro = new Date(inicioFiltro);
            fimFiltro.setDate(fimFiltro.getDate() + 6);
            fimFiltro.setHours(23, 59, 59, 999);
            break;
        case 'mes':
            inicioFiltro = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            fimFiltro = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
            fimFiltro.setHours(23, 59, 59, 999);
            break;
        case 'ano':
            inicioFiltro = new Date(hoje.getFullYear(), 0, 1);
            fimFiltro = new Date(hoje.getFullYear(), 11, 31);
            fimFiltro.setHours(23, 59, 59, 999);
            break;
        case 'customizado':
            if (dataInicioInput && dataFimInput) {
                inicioFiltro = new Date(dataInicioInput + 'T00:00:00');
                fimFiltro = new Date(dataFimInput + 'T23:59:59');
            }
            break;
    }
    
    // 2. Filtrar os cortes
    if (inicioFiltro && fimFiltro) {
        cortesFiltrados = todosCortes.filter(c => {
            const dataCorte = new Date(c.data_hora);
            return dataCorte >= inicioFiltro && dataCorte <= fimFiltro;
        });
    } else {
        // Se nenhum filtro for válido, usa todos os cortes (comportamento padrão)
        cortesFiltrados = todosCortes; 
    }
    
    // 3. Calcular estatísticas do período
    const totalCortes = cortesFiltrados.length;
    const cortesPagos = cortesFiltrados.filter(c => c.tipo === 'corte_pago').length;
    const cortesGratis = cortesFiltrados.filter(c => c.tipo === 'corte_gratis').length;

    document.getElementById('totalCortesPeriodo').textContent = totalCortes;
    document.getElementById('cortesPagosPeriodo').textContent = cortesPagos;
    document.getElementById('cortesGratisPeriodo').textContent = cortesGratis;
    
    // 4. Clientes Mais Frequentes (dentro do período)
    const clientesFrequentes = {};
    cortesFiltrados.forEach(c => {
        // Usa o ID para agrupar, pois nomes podem ser iguais
        const clienteId = c.cliente_id;
        const clienteNome = c.users ? c.users.nome : 'Cliente Desconhecido';
        if (!clientesFrequentes[clienteId]) {
            clientesFrequentes[clienteId] = { nome: clienteNome, quantidade: 0 };
        }
        clientesFrequentes[clienteId].quantidade++;
    });
    
    const clientesOrdenados = Object.values(clientesFrequentes)
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);
    
    carregarRanking(
        '#clientesFrequentes', 
        clientesOrdenados,
        (cliente) => `${cliente.quantidade} cortes`
    );
    
    // 5. Horários Mais Movimentados
    carregarHorariosMovimento(cortesFiltrados);
    
    // 6. Relatório de Cortes Detalhado
    carregarRelatorioCortes(cortesFiltrados);
    
    // 7. NOVO: Clientes Ausentes
    carregarClientesAusentes(todosUsuarios, todosCortes);
}

// NOVO: Função para calcular clientes ausentes
function carregarClientesAusentes(usuarios, cortes) {
    const mapUltimaVisita = new Map();
    
    // 1. Encontra a última visita de CADA cliente
    for (const corte of cortes) {
        const dataCorte = new Date(corte.data_hora);
        const ultimaVisita = mapUltimaVisita.get(corte.cliente_id);
        
        if (!ultimaVisita || dataCorte > ultimaVisita) {
            mapUltimaVisita.set(corte.cliente_id, dataCorte);
        }
    }
    
    // 2. Mapeia usuários com sua última visita ou data de cadastro
    const usuariosComVisita = usuarios.map(user => {
        let ultimaData = mapUltimaVisita.get(user.id);
        if (!ultimaData) {
            // Se nunca fez corte, usa a data de cadastro
            ultimaData = new Date(user.dataCadastro); 
        }
        return {
            nome: user.nome,
            ultimaData: ultimaData
        };
    });
    
    // 3. Ordena por data (mais antiga primeiro) e pega os 5 primeiros
    const clientesAusentes = usuariosComVisita
        .sort((a, b) => a.ultimaData - b.ultimaData)
        .slice(0, 5);
        
    // 4. Renderiza
    carregarRanking(
        '#clientesAusentes', 
        clientesAusentes,
        (cliente) => `Última visita: ${cliente.ultimaData.toLocaleDateString('pt-BR')}`
    );
}

// NOVO: Função genérica para renderizar listas de ranking
function carregarRanking(containerSelector, itens, getDetalheCallback) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    container.innerHTML = ''; // Limpa o container
    
    if (itens.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #b3b3b3;">Nenhum dado encontrado.</p>';
        return;
    }
    
    itens.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'ranking-item';
        div.innerHTML = `
            <div class="ranking-info">
                <span class="ranking-pos">${index + 1}º</span>
                <h4>${item.nome}</h4>
            </div>
            <span class="ranking-detalhe">${getDetalheCallback(item)}</span>
        `;
        container.appendChild(div);
    });
}

// Função de Horários (extraída do script.js original)
function carregarHorariosMovimento(cortesFiltrados) {
    const horarios = {};
    
    cortesFiltrados.forEach(corte => {
        if (corte.data_hora) {
            try {
                const dataHora = new Date(corte.data_hora);
                const hora = dataHora.getHours().toString().padStart(2, '0');
                horarios[hora] = (horarios[hora] || 0) + 1;
            } catch(e) {}
        }
    });
    
    const horariosOrdenados = Object.entries(horarios)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    // Renderiza usando a nova função de ranking
    const itensFormatados = horariosOrdenados.map(([hora, quantidade]) => ({
        nome: `${hora}h - ${(parseInt(hora) + 1).toString().padStart(2, '0')}h`,
        quantidade: quantidade
    }));
    
    carregarRanking(
        '#horariosMovimento',
        itensFormatados,
        (item) => `${item.quantidade} cortes`
    );
}

// Função Relatório Detalhado (extraída do script.js original)
function carregarRelatorioCortes(cortesFiltrados) {
    const container = document.getElementById('relatorioCortes');
    if (!container) return;
    
    // Cabeçalho da tabela
    let html = `
        <div class="relatorio-item header">
            <span>Data</span>
            <span>Cliente</span>
            <span>Barbeiro</span>
            <span>Tipo</span>
            <span>Pontos Atuais</span>
        </div>
    `;
    
    if (cortesFiltrados.length === 0) {
        container.innerHTML = html + '<p style="text-align: center; color: #b3b3b3; padding: 20px;">Nenhum corte no período selecionado.</p>';
        return;
    }
    
    cortesFiltrados.sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora)).forEach(corte => {
        const dataFormatada = new Date(corte.data_hora).toLocaleDateString('pt-BR');
        const horaFormatada = new Date(corte.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const tipoCorte = corte.tipo === 'corte_gratis' ? 'Grátis' : 'Pago';
        const clienteNome = corte.users ? corte.users.nome : 'N/A';
        const barbeiroNome = corte.barbeiros ? corte.barbeiros.nome : 'N/A';
        const pontos = corte.users ? corte.users.pontos : '-';

        html += `
            <div class="relatorio-item">
                <span>${dataFormatada} ${horaFormatada}</span>
                <span>${clienteNome}</span>
                <span>${barbeiroNome}</span>
                <span class="tipo-${corte.tipo}">${tipoCorte}</span>
                <span>${pontos}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Funções de Exportação (extraídas do script.js original)
async function exportarClientes() {
    const users = await getAllUsers();
    const csv = ['Nome,CPF,E-mail,Data Nascimento,Pontos,Cortes Grátis Acumulados,Data Cadastro'];
    
    users.forEach(user => {
        const cpfFormatado = user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        const dataNascimento = user.dataNascimento ? new Date(user.dataNascimento).toLocaleDateString('pt-BR') : 'N/A';
        const dataCadastro = user.dataCadastro ? new Date(user.dataCadastro).toLocaleDateString('pt-BR') : 'N/A';
        csv.push(`"${user.nome}","'${cpfFormatado}","${user.email}","${dataNascimento}",${user.pontos},${user.cortes_gratis || 0},"${dataCadastro}"`);
    });
    
    downloadCSV(csv.join('\n'), 'clientes_barbearia_style.csv');
}

async function exportarCortes() {
    const cortes = await getAllCortes();
    const csv = ['Data,Hora,Cliente,CPF,Barbeiro,Tipo de Corte'];
    
    cortes.forEach(corte => {
        const dataFormatada = new Date(corte.data_hora).toLocaleDateString('pt-BR');
        const horaFormatada = new Date(corte.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const clienteNome = corte.users ? corte.users.nome : 'N/A';
        const clienteCpf = corte.users ? corte.users.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : 'N/A';
        const barbeiroNome = corte.barbeiros ? corte.barbeiros.nome : 'N/A';
        const tipoCorte = corte.tipo === 'corte_gratis' ? 'Corte Grátis' : 'Corte Pago';

        csv.push(`"${dataFormatada}","${horaFormatada}","${clienteNome}","'${clienteCpf}","${barbeiroNome}","${tipoCorte}"`);
    });
    
    downloadCSV(csv.join('\n'), 'cortes_barbearia_style.csv');
}

// (A função downloadCSV está em utils.js)