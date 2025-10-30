/* danielantunes15/sistema_barbearia/sistema_barbearia-b0067c03d237e0e4549e5b3d1f68679361eb7104/script.js */

// Estado global para o scanner
let scannedUser = null; 

// Função para formatar CPF
function formatarCPF(campo) {
    let cpf = campo.value.replace(/\D/g, '');
    
    if (cpf.length > 11) {
        cpf = cpf.substring(0, 11);
    }
    
    if (cpf.length <= 11) {
        cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
        cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
        cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    
    campo.value = cpf;
}

// Função para validar CPF (simplificada)
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    const cpfsInvalidos = [
        '00000000000', '11111111111', '22222222222', '33333333333', 
        '44444444444', '55555555555', '66666666666', '77777777777', 
        '88888888888', '99999999999'
    ];
    if (cpfsInvalidos.includes(cpf)) return false;
    return true; 
}

// NOVO: Função para verificação em tempo real de CPF/Email
async function checkFieldAvailability(input, type) {
    const value = input.value.replace(/\D/g, '');
    const isCpf = type === 'cpf';

    // Limpa o status
    input.removeAttribute('data-status');
    
    if (!value || (isCpf && value.length < 11)) return;

    if (isCpf && !validarCPF(value)) {
        // Não marca como erro para CPF incompleto/inválido, deixa a validação final.
        return;
    }

    const email = isCpf ? '' : value;
    const cpf = isCpf ? value : '';

    const exists = await emailOrCpfExists(email, cpf);

    if (exists) {
        input.setAttribute('data-status', 'error');
        input.title = `Este ${type.toUpperCase()} já está em uso.`;
    } else {
        input.setAttribute('data-status', 'success');
        input.title = '';
    }
}

// Verifica se o usuário está logado (agora assíncrono)
async function checkAuth() {
    const currentUserJSON = localStorage.getItem('currentUser');
    const currentBarbeiroJSON = localStorage.getItem('currentBarbeiro');
    
    const isProtectedPage = !window.location.href.includes('index.html') && 
                            !window.location.href.includes('cadastro.html');

    if (!currentUserJSON && !currentBarbeiroJSON && isProtectedPage) {
        window.location.href = 'index.html';
        return null;
    }
    
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
        if (isProtectedPage) window.location.href = 'index.html';
    }
    
    return null;
}

// Tabs no login
function showTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.login-form').forEach(form => form.classList.remove('active'));
    
    const tabIndex = tab === 'cliente' ? 0 : 1;
    document.querySelectorAll('.tab-btn')[tabIndex].classList.add('active');
    document.getElementById(tab === 'cliente' ? 'loginClienteForm' : 'loginBarbeiroForm').classList.add('active');
}

// Login Cliente com CPF (Async + Hash)
if (document.getElementById('loginClienteForm')) {
    document.getElementById('loginClienteForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const cpf = document.getElementById('cpfCliente').value.replace(/\D/g, '');
        const password = document.getElementById('passwordCliente').value;
        
        console.log('Tentando login com CPF:', cpf);
        
        if (cpf.length !== 11) {
            alert('CPF deve ter 11 dígitos!');
            return;
        }

        const hashedPassword = hashPassword(password);
        if (!hashedPassword) return;

        const user = await getUserByCpfAndPassword(cpf, hashedPassword);
        
        if (user) {
            console.log('Usuário encontrado:', user);
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'dashboard-cliente.html';
        } else {
            console.log('Usuário não encontrado ou senha incorreta');
            alert('CPF ou senha incorretos!');
        }
    });
}

// Login Barbeiro (Async + Hash) - ATUALIZADO PARA USAR CPF
if (document.getElementById('loginBarbeiroForm')) {
    document.getElementById('loginBarbeiroForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const cpf = document.getElementById('cpfBarbeiro').value.replace(/\D/g, ''); // ATUALIZADO
        const password = document.getElementById('passwordBarbeiro').value;
        
        console.log('Tentando login barbeiro com CPF:', cpf); // ATUALIZADO
        
        if (cpf.length !== 11) { // NOVO
            alert('CPF deve ter 11 dígitos!');
            return;
        }

        const hashedPassword = hashPassword(password);
        if (!hashedPassword) return;

        const barbeiro = await getBarbeiroByCpfAndPassword(cpf, hashedPassword); // ATUALIZADO
        
        if (barbeiro) {
            console.log('Barbeiro encontrado:', barbeiro);
            localStorage.setItem('currentBarbeiro', JSON.stringify(barbeiro));
            window.location.href = 'dashboard-barbeiro.html';
        } else {
            console.log('Barbeiro não encontrado');
            alert('CPF ou senha incorretos!'); // ATUALIZADO
        }
    });
}

// Cadastro Cliente (Async + Hash)
if (document.getElementById('cadastroForm')) {
    document.getElementById('cadastroForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const nome = document.getElementById('nome').value;
        const dataNascimento = document.getElementById('dataNascimento').value;
        const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        console.log('Tentando cadastro:', { nome, cpf, email });
        
        if (cpf.length !== 11 || !validarCPF(cpf)) {
            alert('CPF inválido!');
            return;
        }
        
        if (!dataNascimento) {
            alert('Data de nascimento é obrigatória!');
            return;
        }
        
        const nascimento = new Date(dataNascimento);
        const hoje = new Date();
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        
        if (idade < 16) {
            alert('É necessário ter pelo menos 16 anos para se cadastrar.');
            return;
        }
        
        if (password.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        // Verificar se o CPF ou e-mail já existe (Validação final)
        if (await emailOrCpfExists(email, cpf)) {
            alert('Este CPF ou e-mail já está cadastrado!');
            return;
        }
        
        const hashedPassword = hashPassword(password);
        if (!hashedPassword) return;

        const userId = 'user_' + Date.now();
        
        // NOVO: removido 'historico', adicionado 'cortesGratis'
        const newUser = {
            id: userId,
            nome: nome,
            dataNascimento: dataNascimento,
            cpf: cpf,
            email: email,
            password: hashedPassword, // Salva o hash
            pontos: 0,
            cortesGratis: 0,
            dataCadastro: new Date().toISOString()
        };
        
        const createdUser = await createNewUser(newUser);
        
        if (createdUser) {
            console.log('Usuário cadastrado com sucesso:', createdUser);
            localStorage.setItem('currentUser', JSON.stringify(createdUser));
            window.location.href = 'dashboard-cliente.html';
        } else {
            alert('Ocorreu um erro no cadastro. Tente novamente.');
        }
    });
}

// Dashboard Cliente (Async IIFE)
if (document.getElementById('userName')) {
    (async () => {
        const auth = await checkAuth();
        
        if (auth && auth.tipo === 'cliente') {
            const user = auth.data;
            
            console.log('Carregando dashboard do cliente:', user);
            
            // NOVO: Carregar Cortes e calcular estatísticas
            const cortes = await getCortesByUserId(user.id);
            const totalCortesPagos = cortes.filter(c => c.tipo === 'corte_pago').length;
            const cortesGratisUtilizados = cortes.filter(c => c.tipo === 'corte_gratis').length;
            const cortesParaFrequencia = cortes.filter(c => c.tipo === 'corte_pago');
            
            
            document.getElementById('userName').textContent = user.nome;
            document.getElementById('userEmail').textContent = user.email;
            
            const cpfFormatado = user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            let userInfoExtra = `CPF: ${cpfFormatado}`;
            
            if (user.dataNascimento) {
                const nascimento = new Date(user.dataNascimento);
                const hoje = new Date();
                let idade = hoje.getFullYear() - nascimento.getFullYear();
                const mes = hoje.getMonth() - nascimento.getMonth();
                if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
                    idade--;
                }
                userInfoExtra += ` | Idade: ${idade} anos`;
            }
            // Verifica se o elemento userTelefone existe (presente em dashboard-cliente.html)
            if (document.getElementById('userTelefone')) {
                document.getElementById('userTelefone').textContent = userInfoExtra;
            }
            
            document.getElementById('currentPoints').textContent = user.pontos;
            
            // NOVO: Preenche estatísticas
            if (document.getElementById('totalCortesPagos')) {
                document.getElementById('totalCortesPagos').textContent = totalCortesPagos;
                document.getElementById('cortesGratisAcumulados').textContent = user.cortesGratis || 0;
                document.getElementById('cortesGratisUtilizados').textContent = cortesGratisUtilizados;
                document.getElementById('frequencia').textContent = calcularFrequencia(cortesParaFrequencia);
            }

            const progressFill = document.getElementById('progressFill');
            const progressPercentage = (user.pontos / 10) * 100;
            progressFill.style.width = `${progressPercentage}%`;
            
            const pontosInfo = document.getElementById('pointsInfo');
            if (pontosInfo) {
                if (user.pontos >= 10) {
                    pontosInfo.innerHTML = '🎉 Parabéns! Você tem direito a um corte grátis!';
                    pontosInfo.style.color = '#27ae60';
                    pontosInfo.style.fontWeight = 'bold';
                } else if (user.pontos >= 8) {
                    pontosInfo.innerHTML = '💪 Quase lá! Faltam apenas ' + (10 - user.pontos) + ' cortes para ganhar um grátis!';
                } else if (user.pontos >= 5) {
                    pontosInfo.innerHTML = '👍 Continue assim! Já tem ' + user.pontos + ' de 10 cortes!';
                } else {
                     pontosInfo.innerHTML = 'A cada 10 cortes, você ganha 1 corte grátis!';
                }
            }
            
            const historyList = document.getElementById('historyList');
            historyList.innerHTML = '';
            
            if (cortes && cortes.length > 0) {
                // Mostra os 10 mais recentes
                cortes.slice(0, 10).forEach(corte => {
                    const li = document.createElement('li');
                    const tipoCorte = corte.tipo === 'corte_gratis' ? 'Corte Grátis' : 'Corte Pago';
                    const barbeiroNome = corte.barbeiros ? corte.barbeiros.nome : 'N/A';
                    const dataFormatada = new Date(corte.data_hora).toLocaleDateString('pt-BR');
                    const horaFormatada = new Date(corte.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    
                    li.innerHTML = `
                        <span>${dataFormatada} (${horaFormatada})</span>
                        <span>${tipoCorte} com ${barbeiroNome}</span>
                    `;
                    historyList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'Nenhum corte registrado ainda';
                historyList.appendChild(li);
            }
            
            document.getElementById('logoutBtn').addEventListener('click', function() {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('currentBarbeiro');
                window.location.href = 'index.html';
            });
        } else if (auth && auth.tipo === 'barbeiro') {
             console.log('Barbeiro acessou página de cliente, redirecionando...');
             window.location.href = 'dashboard-barbeiro.html';
        } else {
            console.log('Usuário não autenticado, redirecionando...');
            window.location.href = 'index.html';
        }
    })();
}

// Dashboard Barbeiro (Async IIFE)
if (document.getElementById('barbeiroNome')) {
    (async () => {
        const auth = await checkAuth();
        
        if (auth && auth.tipo === 'barbeiro') {
            const barbeiro = auth.data;
            document.getElementById('barbeiroNome').textContent = barbeiro.nome;
            
            await carregarDashboardBarbeiro(barbeiro.id); // Passa o ID do barbeiro
            
            document.getElementById('logoutBtn').addEventListener('click', function() {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('currentBarbeiro');
                window.location.href = 'index.html';
            });
        } else if (auth && auth.tipo === 'cliente') {
             console.log('Cliente acessou página de barbeiro, redirecionando...');
             window.location.href = 'dashboard-cliente.html';
        } else {
            console.log('Barbeiro não autenticado, redirecionando...');
            window.location.href = 'index.html';
        }
    })();
}

// ATUALIZADO: carregarDashboardBarbeiro recebe o ID
async function carregarDashboardBarbeiro(barbeiroId) {
    const users = await getAllUsers();
    
    // NOVO: Buscar cortes e agendamentos
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
        
        if (dataCorteString === hojeString) {
            cortesHoje++;
        }
        
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
                <p style="font-size: 0.8rem; margin-top: 5px;">${(cliente.cortesGratis || 0) + (cliente.pontos >= 10 ? 1 : 0)} cortes grátis</p>
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
    
    if (agendamentos.length > 0) {
        agendamentos.forEach(agendamento => {
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

// ATUALIZADO: calcularFrequencia usa a nova tabela 'cortes'
function calcularFrequencia(cortes) {
    if (!cortes || cortes.length < 2) return '-';
    
    try {
        const datas = cortes.map(c => new Date(c.data_hora))
            .sort((a, b) => a - b);
        
        const diferencas = [];
        for (let i = 1; i < datas.length; i++) {
            const diff = (datas[i] - datas[i-1]) / (1000 * 60 * 60 * 24); 
            diferencas.push(diff);
        }
        
        const mediaDias = diferencas.reduce((a, b) => a + b, 0) / diferencas.length;
        
        if (mediaDias <= 15) return 'Alta';
        if (mediaDias <= 30) return 'Média';
        return 'Baixa';
    } catch(e) {
        return '-';
    }
}

function showFallbackQRCode(userId, container) {
    container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <p>Falha ao carregar QR Code.</p>
            <p>Mostre este ID ao barbeiro:</p>
            <strong style="font-size: 1.2rem; color: var(--accent);">${userId}</strong>
        </div>
    `;
    container.style.height = 'auto';
}

// QR Code - SOLUÇÃO DEFINITIVA (Função mantida)
function initializeQRCode() {
    const qrcodeContainer = document.getElementById('qrcode');
    if (!qrcodeContainer) return;

    // Verifica se estamos na página de QR Code
    if (!window.location.href.includes('qrcode.html')) return;

    // Função para gerar QR Code
    async function generateQRCode() {
        const auth = await checkAuth();
        
        if (auth && auth.tipo === 'cliente') {
            const user = auth.data;
            document.getElementById('userId').textContent = user.id;
            
            // Verifica se a biblioteca QRCode está disponível
            if (typeof QRCode === 'undefined') {
                console.warn('QRCode library not available, showing fallback');
                showFallbackQRCode(user.id, qrcodeContainer);
                return;
            }
            
            try {
                // Limpa o container
                qrcodeContainer.innerHTML = '';
                
                // Cria um canvas para o QR Code
                const canvas = document.createElement('canvas');
                qrcodeContainer.appendChild(canvas);
                
                // Gera o QR Code usando a biblioteca
                QRCode.toCanvas(canvas, user.id, {
                    width: 250,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                }, function(error) {
                    if (error) {
                        console.error('Erro ao gerar QR Code:', error);
                        showFallbackQRCode(user.id, qrcodeContainer);
                        return;
                    }
                    
                    // Aplica estilos ao canvas
                    canvas.style.border = '2px solid #444';
                    canvas.style.borderRadius = '15px';
                    canvas.style.padding = '15px';
                    canvas.style.background = 'white';
                    canvas.style.maxWidth = '100%';
                });
                
            } catch (error) {
                console.error('Erro geral ao gerar QR Code:', error);
                showFallbackQRCode(user.id, qrcodeContainer);
            }
        } else {
            // Se não for cliente ou não autenticado, redireciona
            window.location.href = 'index.html';
        }
    }

    // Tenta gerar o QR Code imediatamente
    generateQRCode();
}

// Scanner (Async onScanSuccess)
if (document.getElementById('reader')) {
    let html5QrcodeScanner;
    
    document.getElementById('startScanner').addEventListener('click', function() {
        this.style.display = 'none';
        document.getElementById('stopScanner').style.display = 'inline-block';
        document.getElementById('result').style.display = 'none';
        document.getElementById('corteTypeGroup').style.display = 'none';
        document.getElementById('confirmCorte').style.display = 'none';
        scannedUser = null; // Reseta o estado
        
        html5QrcodeScanner = new Html5Qrcode("reader");
        
        html5QrcodeScanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess, // Função de sucesso (agora async)
            onScanFailure
        ).catch(err => {
            console.error(err);
            alert('Erro ao iniciar a câmera. Verifique as permissões.');
            document.getElementById('stopScanner').style.display = 'none';
            document.getElementById('startScanner').style.display = 'inline-block';
        });
    });
    
    document.getElementById('stopScanner').addEventListener('click', function() {
        this.style.display = 'none';
        document.getElementById('startScanner').style.display = 'inline-block';
        document.getElementById('result').style.display = 'none';
        document.getElementById('corteTypeGroup').style.display = 'none';
        document.getElementById('confirmCorte').style.display = 'none';
        scannedUser = null;
        
        if (html5QrcodeScanner) {
            html5QrcodeScanner.stop().catch(err => console.error(err));
        }
    });
    
    // NOVO: Listener para o botão de confirmação
    document.getElementById('confirmCorte').addEventListener('click', async function() {
        await finalizarRegistroCorte();
    });
    
    async function onScanSuccess(decodedText, decodedResult) {
        const resultContainer = document.getElementById('result');
        
        // NOVO: Bloco try/catch para capturar falhas na busca/UI
        try {
             // Para o scanner após o primeiro sucesso
            if (html5QrcodeScanner) {
                html5QrcodeScanner.stop().catch(err => console.error(err));
            }

            // 1. Buscar usuário no Supabase
            const user = await getUserById(decodedText);
            const corteTypeGroup = document.getElementById('corteTypeGroup');
            const tipoCorteSelect = document.getElementById('tipoCorte');
            
            if (user) {
                scannedUser = user;
                
                const cpfFormatado = user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                
                // 2. Configurar UI
                document.getElementById('stopScanner').style.display = 'none';
                document.getElementById('startScanner').style.display = 'inline-block';
                corteTypeGroup.style.display = 'block';
                document.getElementById('confirmCorte').style.display = 'inline-block';
                resultContainer.style.display = 'block';
                resultContainer.className = 'result-container success'; // Muda temporariamente para sucesso/informação
                
                // Habilita/Desabilita Corte Grátis
                const temCorteGratis = user.pontos >= 10 || user.cortesGratis > 0;
                const optionGratis = tipoCorteSelect.querySelector('option[value="corte_gratis"]');
                const totalGratis = (user.cortesGratis || 0) + (user.pontos >= 10 ? 1 : 0);

                if (temCorteGratis) {
                    optionGratis.textContent = `Corte Grátis (Acumulado: ${totalGratis})`;
                    optionGratis.disabled = false;
                    // *** AJUSTE PARA O FLUXO MAIS INTUITIVO ***
                    tipoCorteSelect.value = 'corte_gratis'; 
                    // ****************************************
                } else {
                    optionGratis.textContent = 'Corte Grátis (Pontos Insuficientes)';
                    optionGratis.disabled = true;
                    tipoCorteSelect.value = 'corte_pago';
                }
                
                resultContainer.innerHTML = `
                    <h3>Cliente Escaneado: ${user.nome}</h3>
                    <p><strong>CPF:</strong> ${cpfFormatado}</p>
                    <p><strong>Pontos:</strong> ${user.pontos}/10</p>
                    ${temCorteGratis ? 
                        `<p class="success" style="font-weight: bold;">🎉 Cliente tem direito a ${totalGratis} corte(s) grátis.</p>` : ''}
                `;
                
            } else {
                resultContainer.innerHTML = '<p>❌ QR Code inválido! Tente novamente.</p>';
                resultContainer.className = 'result-container error';
                resultContainer.style.display = 'block';
                document.getElementById('confirmCorte').style.display = 'none';
                corteTypeGroup.style.display = 'none';
            }
        } catch (error) {
            console.error("ERRO CRÍTICO NO SCANNER:", error);
            resultContainer.innerHTML = `<p>❌ Erro interno ao carregar cliente. Verifique o console. (${error.message})</p>`;
            resultContainer.className = 'result-container error';
            resultContainer.style.display = 'block';
            document.getElementById('confirmCorte').style.display = 'none';
            document.getElementById('corteTypeGroup').style.display = 'none';
            scannedUser = null;
        }
    }
    
    // NOVO: Função para finalizar registro do corte
    async function finalizarRegistroCorte() {
        if (!scannedUser) {
             alert('Erro: Nenhum cliente escaneado.');
             return;
        }
        
        const tipoCorte = document.getElementById('tipoCorte').value;
        const barbeiroData = JSON.parse(localStorage.getItem('currentBarbeiro') || '{}');
        const resultContainer = document.getElementById('result');
        const now = new Date();
        
        // Dados do novo corte
        const newCorte = {
            id: 'corte_' + Date.now(),
            cliente_id: scannedUser.id,
            barbeiro_id: barbeiroData.id,
            data_hora: now.toISOString(),
            tipo: tipoCorte
        };
        
        // Dados do usuário para atualização
        const userToUpdate = JSON.parse(JSON.stringify(scannedUser)); 
        
        // LÓGICA DE PONTUAÇÃO (CORRETA)
        if (tipoCorte === 'corte_pago') {
            userToUpdate.pontos = (userToUpdate.pontos || 0) + 1;
            
            // Se atingir 10 pontos (chegou no 10º corte)
            if (userToUpdate.pontos >= 10) {
                // Concede o corte grátis (será 1)
                userToUpdate.cortesGratis = (userToUpdate.cortesGratis || 0) + Math.floor(userToUpdate.pontos / 10);
                // Reseta os pontos para o resto da divisão (10 % 10 = 0)
                userToUpdate.pontos = userToUpdate.pontos % 10;
            }
            
        } else if (tipoCorte === 'corte_gratis') {
            // Lógica de resgate (funciona para 10 pontos ou cortesGratis acumulados)
            if (userToUpdate.pontos >= 10) {
                // Se resgatar usando os 10 pontos atuais, zera os pontos.
                userToUpdate.pontos = 0;
            } else if (userToUpdate.cortesGratis > 0) {
                // Se resgatar usando o estoque acumulado, decrementa o estoque.
                userToUpdate.cortesGratis = userToUpdate.cortesGratis - 1;
            } else {
                 alert('Erro: Cliente não tem cortes grátis para resgatar.');
                 return;
            }
        }
        
        // 1. Tenta criar o registro de corte
        const corteSuccess = await createCorte(newCorte);
        
        if (corteSuccess) {
            // 2. Tenta atualizar os pontos do usuário
            const userSuccess = await updateUser(userToUpdate);

            if (userSuccess) {
                // Atualiza o localStorage para o próximo checkAuth
                localStorage.setItem('currentUser', JSON.stringify(userToUpdate)); 
                
                document.getElementById('confirmCorte').style.display = 'none';
                document.getElementById('corteTypeGroup').style.display = 'none';
                
                resultContainer.innerHTML = `
                    <h3>✅ Corte (${tipoCorte === 'corte_pago' ? 'Pago' : 'Grátis'}) registrado!</h3>
                    <p><strong>Cliente:</strong> ${scannedUser.nome}</p>
                    <p><strong>Novo Saldo de Pontos:</strong> ${userToUpdate.pontos}/10</p>
                    <p><strong>Cortes Grátis Acumulados:</strong> ${userToUpdate.cortesGratis}</p>
                    <p><strong>Data:</strong> ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}</p>
                    ${tipoCorte === 'corte_gratis' ? '<p class="success">🎉 Corte grátis resgatado! Novo ciclo iniciado ou estoque atualizado.</p>' : ''}
                    ${userToUpdate.pontos === 0 && tipoCorte === 'corte_pago' ? '<p class="success">🎉 Cliente ganhou um corte grátis e começou novo ciclo!</p>' : ''}
                `;
            } else {
                 // Esta mensagem indica a falha na atualização de pontos (updateUser falhou)
                 console.error('❌ Falha ao atualizar pontos. Verifique o console para mais detalhes.');
                 resultContainer.innerHTML = '<p>❌ Falha ao atualizar pontos/fidelidade do cliente. Veja o console para detalhes.</p>';
                 resultContainer.className = 'result-container error';
            }
        } else {
            // Esta mensagem indica a falha no registro do corte (createCorte falhou)
            resultContainer.innerHTML = '<p>❌ Erro ao salvar o corte no banco de dados! Verifique se a tabela CORTES existe.</p>';
            resultContainer.className = 'result-container error';
        }
        
        scannedUser = null; // Limpa o estado
    }
    
    function onScanFailure(error) {
        // Ignorar erros (QR code não encontrado, etc.)
    }
}

// Relatórios (Async)
if (document.getElementById('aplicarFiltro')) {
    
    // NOVO: Adiciona listener para o seletor de período
    document.getElementById('periodo').addEventListener('change', function() {
        const isCustom = this.value === 'customizado';
        document.getElementById('dataInicio').disabled = !isCustom;
        document.getElementById('dataFim').disabled = !isCustom;
    });

    document.getElementById('aplicarFiltro').addEventListener('click', async function() {
        await carregarRelatorios();
    });
    
    // Carregar relatórios inicialmente
    (async () => await carregarRelatorios())();
}

// ATUALIZADO: carregarRelatorios implementa filtros
async function carregarRelatorios() {
    const todosCortes = await getAllCortes();
    
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
        case 'trimestre':
            const mesAtual = hoje.getMonth();
            const trimestre = Math.floor(mesAtual / 3);
            inicioFiltro = new Date(hoje.getFullYear(), trimestre * 3, 1);
            fimFiltro = new Date(hoje.getFullYear(), trimestre * 3 + 3, 0);
            fimFiltro.setHours(23, 59, 59, 999);
            break;
        case 'ano':
            inicioFiltro = new Date(hoje.getFullYear(), 0, 1);
            fimFiltro = new Date(hoje.getFullYear(), 11, 31);
            fimFiltro.setHours(23, 59, 59, 999);
            break;
        case 'customizado':
            if (dataInicioInput && dataFimInput) {
                inicioFiltro = new Date(dataInicioInput);
                fimFiltro = new Date(dataFimInput);
                fimFiltro.setHours(23, 59, 59, 999);
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
        cortesFiltrados = todosCortes; // Se o filtro falhar ou não for customizado, mostra todos.
    }
    
    // 3. Calcular estatísticas
    const totalCortes = cortesFiltrados.length;
    const cortesPagos = cortesFiltrados.filter(c => c.tipo === 'corte_pago').length;
    const cortesGratis = cortesFiltrados.filter(c => c.tipo === 'corte_gratis').length;

    document.getElementById('totalCortesPeriodo').textContent = totalCortes;
    document.getElementById('cortesPagosPeriodo').textContent = cortesPagos;
    document.getElementById('cortesGratisPeriodo').textContent = cortesGratis;
    
    // 4. Clientes Mais Frequentes (dentro do período)
    const clientesFrequentes = {};
    cortesFiltrados.forEach(c => {
        const clienteNome = c.users ? c.users.nome : 'Cliente Desconhecido';
        clientesFrequentes[clienteNome] = (clientesFrequentes[clienteNome] || 0) + 1;
    });
    
    const clientesOrdenados = Object.entries(clientesFrequentes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const containerFrequentes = document.getElementById('clientesFrequentes');
    if (containerFrequentes) {
        containerFrequentes.innerHTML = '';
        clientesOrdenados.forEach(([nome, quantidade], index) => {
            const div = document.createElement('div');
            div.className = 'ranking-item';
            div.innerHTML = `
                <span style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #444;">
                    <span>${index + 1}. ${nome}</span>
                    <span>${quantidade} cortes</span>
                </span>
            `;
            containerFrequentes.appendChild(div);
        });
    }
    
    // 5. Horários Mais Movimentados
    carregarHorariosMovimento(cortesFiltrados);
    
    // 6. Relatório de Cortes Detalhado (todos os cortes filtrados)
    carregarRelatorioCortes(cortesFiltrados);
}

// ATUALIZADO: carregarHorariosMovimento usa cortes filtrados
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
    
    const containerHorarios = document.getElementById('horariosMovimento');
    if (containerHorarios) {
        containerHorarios.innerHTML = '';
        horariosOrdenados.forEach(([hora, quantidade]) => {
            const horaFim = (parseInt(hora) + 1).toString().padStart(2, '0');
            const div = document.createElement('div');
            div.className = 'horario-item';
            div.innerHTML = `
                <span style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #444;">
                    <span>${hora}h - ${horaFim}h</span>
                    <span>${quantidade} cortes</span>
                </span>
            `;
            containerHorarios.appendChild(div);
        });
    }
}

// ATUALIZADO: carregarRelatorioCortes usa cortes filtrados
function carregarRelatorioCortes(cortesFiltrados) {
    const container = document.getElementById('relatorioCortes');
    if (!container) return;
    
    let html = `
        <div class="relatorio-item" style="font-weight: bold; background: #3a3a3a; display: grid; grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr; padding: 10px;">
            <span>Data</span>
            <span>Cliente</span>
            <span>Barbeiro</span>
            <span>Tipo</span>
            <span>Pontos Atual</span>
        </div>
    `;
    
    cortesFiltrados.sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora)).forEach(corte => {
        const dataFormatada = new Date(corte.data_hora).toLocaleDateString('pt-BR');
        const horaFormatada = new Date(corte.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const tipoCorte = corte.tipo === 'corte_gratis' ? 'Grátis' : 'Pago';
        const clienteNome = corte.users ? corte.users.nome : 'N/A';
        const barbeiroNome = corte.barbeiros ? corte.barbeiros.nome : 'N/A';
        const pontos = corte.users ? corte.users.pontos : '-';

        html += `
            <div class="relatorio-item" style="display: grid; grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr; padding: 10px; border-bottom: 1px solid #444; font-size: 0.9rem;">
                <span>${dataFormatada} ${horaFormatada}</span>
                <span>${clienteNome}</span>
                <span>${barbeiroNome}</span>
                <span>${tipoCorte}</span>
                <span>${pontos}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Exportar dados (Async)
if (document.getElementById('exportClientes')) {
    document.getElementById('exportClientes').addEventListener('click', exportarClientes);
    document.getElementById('exportCortes').addEventListener('click', exportarCortes);
}

// ATUALIZADO: exportarClientes (remove historico)
async function exportarClientes() {
    const users = await getAllUsers();
    const csv = ['Nome,CPF,E-mail,Data Nascimento,Pontos,Cortes Grátis Acumulados,Data Cadastro'];
    
    users.forEach(user => {
        const cpfFormatado = user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        const dataNascimento = user.dataNascimento ? new Date(user.dataNascimento).toLocaleDateString('pt-BR') : 'N/A';
        const dataCadastro = user.dataCadastro ? new Date(user.dataCadastro).toLocaleDateString('pt-BR') : 'N/A';
        csv.push(`"${user.nome}","'${cpfFormatado}","${user.email}","${dataNascimento}",${user.pontos},${user.cortesGratis || 0},"${dataCadastro}"`);
    });
    
    downloadCSV(csv.join('\n'), 'clientes_barbearia_style.csv');
}

// ATUALIZADO: exportarCortes usa a nova tabela 'cortes'
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

function downloadCSV(csv, filename) {
    // Adiciona BOM para garantir a codificação UTF-8 correta no Excel
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===============================================
// LÓGICA PARA AGENDAMENTO (agendamento.html) - NOVO
// ===============================================
if (document.getElementById('agendamentoForm')) {
    const barbeiroSelect = document.getElementById('barbeiroSelect');
    const dataAgendamentoInput = document.getElementById('dataAgendamento');
    const horarioAgendamentoSelect = document.getElementById('horarioAgendamento');
    const feedbackAgendamento = document.getElementById('feedbackAgendamento');

    // Inicializa campos e carrega barbeiros
    (async function initAgendamento() {
        // Define a data mínima para hoje
        dataAgendamentoInput.min = new Date().toISOString().split('T')[0];

        const barbeiros = await getAllBarbeiros();
        barbeiroSelect.innerHTML = '<option value="">Selecione um Barbeiro</option>';
        barbeiros.forEach(b => {
            const option = document.createElement('option');
            option.value = b.id;
            option.textContent = b.nome;
            barbeiroSelect.appendChild(option);
        });

        // Adiciona listeners para recarregar horários
        barbeiroSelect.addEventListener('change', carregarHorariosDisponiveis);
        dataAgendamentoInput.addEventListener('change', carregarHorariosDisponiveis);
    })();

    async function carregarHorariosDisponiveis() {
        horarioAgendamentoSelect.disabled = true;
        horarioAgendamentoSelect.innerHTML = '<option value="">Carregando horários...</option>';
        const barbeiroId = barbeiroSelect.value;
        const dataSelecionada = dataAgendamentoInput.value;

        if (!barbeiroId || !dataSelecionada) {
            horarioAgendamentoSelect.innerHTML = '<option value="">Selecione o Barbeiro e a Data</option>';
            return;
        }

        // 1. Busca agendamentos existentes para o dia e barbeiro
        const agendamentosDoDia = await getAgendamentosByBarbeiroAndDate(barbeiroId, dataSelecionada);
        const horariosOcupados = agendamentosDoDia.map(a => new Date(a.data_hora).getHours().toString().padStart(2, '0') + ':00');

        // 2. Horários disponíveis (ex: 9h às 18h, a cada hora)
        const horarios = [];
        for (let h = 9; h <= 18; h++) {
            const horaString = h.toString().padStart(2, '0') + ':00';
            const horaISO = `${dataSelecionada}T${horaString}:00.000Z`;

            // Verifica se está no passado (para evitar agendamentos no dia atual)
            if (new Date(horaISO) > new Date()) {
                 if (!horariosOcupados.includes(horaString)) {
                    horarios.push(horaString);
                }
            } else if (dataSelecionada !== new Date().toISOString().split('T')[0]) {
                 // Adiciona se não for hoje ou se for um horário futuro
                 if (!horariosOcupados.includes(horaString)) {
                    horarios.push(horaString);
                }
            }
        }

        // 3. Preenche o seletor
        horarioAgendamentoSelect.innerHTML = '';
        if (horarios.length > 0) {
            horarios.forEach(h => {
                const option = document.createElement('option');
                option.value = h;
                option.textContent = h;
                horarioAgendamentoSelect.appendChild(option);
            });
            horarioAgendamentoSelect.disabled = false;
        } else {
            horarioAgendamentoSelect.innerHTML = '<option value="">Nenhum horário disponível neste dia</option>';
        }
    }
    
    // Submissão do formulário
    document.getElementById('agendamentoForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const auth = await checkAuth();
        if (!auth || auth.tipo !== 'cliente') {
            feedbackAgendamento.textContent = 'Erro de autenticação. Tente fazer login novamente.';
            feedbackAgendamento.style.color = 'var(--danger)';
            return;
        }
        
        const clienteId = auth.data.id;
        const barbeiroId = barbeiroSelect.value;
        const dataSelecionada = dataAgendamentoInput.value;
        const horaSelecionada = horarioAgendamentoSelect.value;
        
        // Cria o timestamp completo no formato ISO para Supabase (UTC)
        const dataHoraISO = `${dataSelecionada}T${horaSelecionada}:00.000Z`;
        
        const newAgendamento = {
            id: 'agend_' + Date.now(),
            cliente_id: clienteId,
            barbeiro_id: barbeiroId,
            data_hora: dataHoraISO,
            status: 'pendente'
        };
        
        const created = await createAgendamento(newAgendamento);
        
        if (created) {
            feedbackAgendamento.textContent = '✅ Agendamento realizado com sucesso!';
            feedbackAgendamento.style.color = 'var(--success)';
            this.reset();
            // Recarrega os horários para refletir o agendamento
            await carregarHorariosDisponiveis(); 
        } else {
            feedbackAgendamento.textContent = '❌ Erro ao confirmar agendamento. Tente novamente.';
            feedbackAgendamento.style.color = 'var(--danger)';
        }
    });
}


// ===============================================
// LÓGICA PARA gerenciar-usuarios.html (ATUALIZADO)
// ===============================================
// (mantida a lógica de gerenciamento de usuários, apenas com a remoção da manipulação de 'historico')

if (document.getElementById('managementPage')) {
    (async () => {
        // 1. Verificar se é um barbeiro logado
        const auth = await checkAuth();
        if (!auth || auth.tipo !== 'barbeiro') {
            alert('Acesso negado.');
            window.location.href = 'index.html';
            return;
        }
        
        console.log('Carregando Painel de Gerenciamento...');
        
        // 2. Carregar listas
        await loadManagementLists();
        
        // 3. Adicionar listener para criar cliente
        document.getElementById('adminCreateClienteForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('adminNomeCliente').value;
            const cpf = document.getElementById('adminCpfCliente').value.replace(/\D/g, '');
            const email = document.getElementById('adminEmailCliente').value;
            const dataNascimento = document.getElementById('adminNascCliente').value;
            const password = document.getElementById('adminSenhaCliente').value;
            
            if (!nome || !cpf || !email || !dataNascimento || !password) {
                alert('Preencha todos os campos!');
                return;
            }
            if (password.length < 6) {
                alert('A senha deve ter pelo menos 6 caracteres.');
                return;
            }
            if (await emailOrCpfExists(email, cpf)) {
                alert('Este CPF ou E-mail já está cadastrado!');
                return;
            }
            
            const hashedPassword = hashPassword(password);
            const newUser = {
                id: 'user_' + Date.now(),
                nome, cpf, email, dataNascimento, password: hashedPassword,
                pontos: 0, cortesGratis: 0, dataCadastro: new Date().toISOString() // ATUALIZADO
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
        
        // 4. Adicionar listener para criar barbeiro (ATUALIZADO COM CPF)
        document.getElementById('adminCreateBarbeiroForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('adminNomeBarbeiro').value;
            const cpf = document.getElementById('adminCpfBarbeiro').value.replace(/\D/g, ''); // NOVO
            const email = document.getElementById('adminEmailBarbeiro').value;
            const password = document.getElementById('adminSenhaBarbeiro').value;

            if (!nome || !cpf || !email || !password) { // ATUALIZADO
                alert('Preencha todos os campos!');
                return;
            }
            if (cpf.length !== 11 || !validarCPF(cpf)) { // NOVO
                alert('CPF inválido!');
                return;
            }
            if (password.length < 6) {
                alert('A senha deve ter pelo menos 6 caracteres.');
                return;
            }
            
            // NOVO: Verifica se CPF ou Email do barbeiro já existem
            if (await barbeiroCpfOrEmailExists(email, cpf)) {
                alert('Este CPF ou E-mail de barbeiro já está cadastrado!');
                return;
            }

            const hashedPassword = hashPassword(password);
            const newBarbeiro = {
                id: 'barbeiro_' + Date.now(),
                nome, cpf, email, password: hashedPassword, // ATUALIZADO
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

    })();
}

// Função para carregar e recarregar as listas de usuários e barbeiros (ATUALIZADO)
async function loadManagementLists() {
    const listaClientes = document.getElementById('listaClientes');
    const listaBarbeiros = document.getElementById('listaBarbeiros');
    
    if (!listaClientes || !listaBarbeiros) return;

    listaClientes.innerHTML = 'Carregando...';
    listaBarbeiros.innerHTML = 'Carregando...';

    // Carregar Clientes
    const users = await getAllUsers();
    // NOVO: Buscar todos os cortes para calcular o total de cortes de cada cliente
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
                <p>Pontos: ${user.pontos} | Cortes Grátis: ${user.cortesGratis || 0} | Total Cortes: ${cortesPorCliente[user.id] || 0}</p>
            </div>
            <button class="btn-delete" data-id="${user.id}" data-tipo="user">Excluir</button>
        `;
        listaClientes.appendChild(item);
    });

    // Carregar Barbeiros (ATUALIZADO para mostrar CPF)
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
            <button class="btn-delete" data-id="${barb.id}" data-tipo="barbeiro">Excluir</button>
        `;
        listaBarbeiros.appendChild(item);
    });
    
    // Adicionar listeners aos botões de exclusão
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const tipo = e.target.dataset.tipo;
            const nome = e.target.previousElementSibling.querySelector('h4').textContent;

            if (confirm(`Tem certeza que deseja excluir "${nome}"? Esta ação não pode ser desfeita e removerá os cortes/agendamentos associados.`)) {
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


// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se estamos em uma página que precisa de autenticação
    const isAuthPage = document.getElementById('userName') || 
                       document.getElementById('barbeiroNome') || 
                       document.getElementById('reader') ||
                       document.getElementById('qrcode');
    
    if (!isAuthPage) {
        checkAuth(); // Verifica se está logado em index.html ou cadastro.html para redirecionar
    }
    
    // Formatação de CPF e Live Check (NOVO)
    const liveCheckInputs = document.querySelectorAll('input[data-live-check]');
    liveCheckInputs.forEach(input => {
        const type = input.id;
        if (type === 'cpf') {
            input.addEventListener('input', () => {
                formatarCPF(input);
                checkFieldAvailability(input, 'cpf');
            });
        } else if (type === 'email') {
            input.addEventListener('input', () => checkFieldAvailability(input, 'email'));
        }
    });

    // Removido initializeQRCode() daqui
    
    console.log('Sistema de Barbearia (Supabase) inicializado.');
});