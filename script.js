/* danielantunes15/sistema_barbearia/sistema_barbearia-197d2932e7e3d39489bf9472ce2a71471b9e3a99/script.js */

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

// Login Barbeiro (Async + Hash)
if (document.getElementById('loginBarbeiroForm')) {
    document.getElementById('loginBarbeiroForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('emailBarbeiro').value;
        const password = document.getElementById('passwordBarbeiro').value;
        
        console.log('Tentando login barbeiro:', email);
        
        const hashedPassword = hashPassword(password);
        if (!hashedPassword) return;

        const barbeiro = await getBarbeiroByEmailAndPassword(email, hashedPassword);
        
        if (barbeiro) {
            console.log('Barbeiro encontrado:', barbeiro);
            localStorage.setItem('currentBarbeiro', JSON.stringify(barbeiro));
            window.location.href = 'dashboard-barbeiro.html';
        } else {
            console.log('Barbeiro não encontrado');
            alert('E-mail ou senha incorretos!');
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

        // Verificar se o CPF ou e-mail já existe
        if (await emailOrCpfExists(email, cpf)) {
            alert('Este CPF ou e-mail já está cadastrado!');
            return;
        }
        
        const hashedPassword = hashPassword(password);
        if (!hashedPassword) return;

        const userId = 'user_' + Date.now();
        
        const newUser = {
            id: userId,
            nome: nome,
            dataNascimento: dataNascimento,
            cpf: cpf,
            email: email,
            password: hashedPassword, // Salva o hash
            pontos: 0,
            historico: [],
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
            
            const totalCortes = user.historico ? user.historico.length : 0;
            const cortesGratis = Math.floor(user.pontos / 10);
            
            // Verifica se os elementos de estatísticas existem
            if (document.getElementById('totalCortes')) {
                document.getElementById('totalCortes').textContent = totalCortes;
                document.getElementById('cortesGratis').textContent = cortesGratis;
                document.getElementById('frequencia').textContent = calcularFrequencia(user.historico);
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
                }
            }
            
            const historyList = document.getElementById('historyList');
            historyList.innerHTML = '';
            
            if (user.historico && user.historico.length > 0) {
                // Mostra os 10 mais recentes
                user.historico.slice(0, 10).forEach(corte => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${corte.data} (${corte.hora || ''})</span>
                        <span>Corte com ${corte.barbeiro || 'N/A'}</span>
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
            
            await carregarDashboardBarbeiro();
            
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

async function carregarDashboardBarbeiro() {
    const users = await getAllUsers();
    const hoje = new Date().toLocaleDateString('pt-BR');
    
    console.log('Carregando dashboard barbeiro. Total de clientes:', users.length);
    
    document.getElementById('totalClientes').textContent = users.length;
    
    let cortesHoje = 0;
    let cortesMes = 0;
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();

    users.forEach(user => {
        if (user.historico) {
            user.historico.forEach(h => {
                if (h.data === hoje) {
                    cortesHoje++;
                }
                
                try {
                    const dataCorte = new Date(h.data.split('/').reverse().join('-'));
                    if (dataCorte.getMonth() === mesAtual && dataCorte.getFullYear() === anoAtual) {
                        cortesMes++;
                    }
                } catch(e) {}
            });
        }
    });

    document.getElementById('cortesHoje').textContent = cortesHoje;
    document.getElementById('cortesMes').textContent = cortesMes;
    document.getElementById('totalFidelidades').textContent = users.filter(u => u.pontos >= 10).length;
    
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
                <p style="font-size: 0.8rem; margin-top: 5px;">${cliente.historico ? cliente.historico.length : 0} cortes</p>
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
    
    carregarEstatisticasFrequencia(users);
}

function carregarEstatisticasFrequencia(users) {
    const container = document.getElementById('estatisticasFrequencia');
    if (!container) return;
    
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    
    const clientesFrequentes = users.map(user => {
        const cortesRecentes = user.historico ? user.historico.filter(h => {
            try {
                const dataCorte = new Date(h.data.split('/').reverse().join('-'));
                return dataCorte >= trintaDiasAtras;
            } catch(e) { return false; }
        }).length : 0;
        
        return { ...user, cortesRecentes };
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

function calcularFrequencia(historico) {
    if (!historico || historico.length < 2) return '-';
    
    try {
        const datas = historico.map(h => new Date(h.data.split('/').reverse().join('-')))
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

// QR Code (Async IIFE)
if (document.getElementById('qrcode')) {
    (async () => {
        const auth = await checkAuth();
        
        if (auth && auth.tipo === 'cliente') {
            const user = auth.data;
            document.getElementById('userId').textContent = user.id;
            
            const qrcodeContainer = document.getElementById('qrcode');
            
            try {
                QRCode.toCanvas(qrcodeContainer, user.id, {
                    width: 200,
                    margin: 2,
                    color: { dark: '#000000', light: '#FFFFFF' }
                }, function(error) {
                    if (error) {
                        console.error(error);
                        showFallbackQRCode(user.id, qrcodeContainer);
                    }
                });
            } catch (error) {
                console.error('Erro ao gerar QR Code:', error);
                showFallbackQRCode(user.id, qrcodeContainer);
            }
        } else {
            window.location.href = 'index.html';
        }
    })();
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

// Scanner (Async onScanSuccess)
if (document.getElementById('reader')) {
    let html5QrcodeScanner;
    
    document.getElementById('startScanner').addEventListener('click', function() {
        this.style.display = 'none';
        document.getElementById('stopScanner').style.display = 'inline-block';
        
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
        
        if (html5QrcodeScanner) {
            html5QrcodeScanner.stop().catch(err => console.error(err));
        }
    });
    
    async function onScanSuccess(decodedText, decodedResult) {
        // 1. Buscar usuário no Supabase
        const user = await getUserById(decodedText);
        const resultContainer = document.getElementById('result');
        
        if (user) {
            const dataAtual = new Date().toLocaleDateString('pt-BR');
            const horaAtual = new Date().toLocaleTimeString('pt-BR');
            
            // 2. Preparar dados para atualização
            // Copiamos para evitar mutação direta
            const userToUpdate = JSON.parse(JSON.stringify(user)); 

            userToUpdate.pontos = (userToUpdate.pontos || 0) + 1;
            if (userToUpdate.pontos > 10) userToUpdate.pontos = 10;
            
            if (!userToUpdate.historico) userToUpdate.historico = [];
            
            const barbeiroNome = JSON.parse(localStorage.getItem('currentBarbeiro') || '{}').nome || 'N/A';
            
            userToUpdate.historico.unshift({
                data: dataAtual,
                hora: horaAtual,
                tipo: 'corte',
                barbeiro: barbeiroNome
            });
            
            // 3. Atualizar no Supabase
            const success = await updateUser(userToUpdate);
            
            if (success) {
                resultContainer.innerHTML = `
                    <h3>✅ Corte registrado com sucesso!</h3>
                    <p><strong>Cliente:</strong> ${user.nome}</p>
                    <p><strong>CPF:</strong> ${user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
                    <p><strong>Pontos atuais:</strong> ${userToUpdate.pontos}/10</p>
                    <p><strong>Data:</strong> ${dataAtual} ${horaAtual}</p>
                    ${userToUpdate.pontos >= 10 ? '<p class="success">🎉 Parabéns! Este cliente tem direito a um corte grátis!</p>' : ''}
                `;
                resultContainer.className = 'result-container success';
                
                // Parar scanner após sucesso
                if (html5QrcodeScanner) {
                    html5QrcodeScanner.stop().catch(err => console.error(err));
                    document.getElementById('stopScanner').style.display = 'none';
                    document.getElementById('startScanner').style.display = 'inline-block';
                }

            } else {
                resultContainer.innerHTML = '<p>❌ Erro ao salvar o corte no banco de dados!</p>';
                resultContainer.className = 'result-container error';
            }
            
        } else {
            resultContainer.innerHTML = '<p>❌ QR Code inválido! Tente novamente.</p>';
            resultContainer.className = 'result-container error';
        }
    }
    
    function onScanFailure(error) {
        // Ignorar erros (QR code não encontrado, etc.)
    }
}

// Relatórios (Async)
if (document.getElementById('aplicarFiltro')) {
    document.getElementById('aplicarFiltro').addEventListener('click', async function() {
        await carregarRelatorios();
    });
    
    // Carregar relatórios inicialmente
    (async () => await carregarRelatorios())();
}

async function carregarRelatorios() {
    const users = await getAllUsers();
    const periodo = document.getElementById('periodo').value;
    
    // Clientes mais frequentes
    const clientesFrequentes = users.map(user => ({
        ...user,
        totalCortes: user.historico ? user.historico.length : 0
    })).filter(u => u.totalCortes > 0)
      .sort((a, b) => b.totalCortes - a.totalCortes)
      .slice(0, 5);
    
    const containerFrequentes = document.getElementById('clientesFrequentes');
    if (containerFrequentes) {
        containerFrequentes.innerHTML = '';
        clientesFrequentes.forEach((cliente, index) => {
            const div = document.createElement('div');
            div.className = 'ranking-item';
            div.innerHTML = `
                <span style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #444;">
                    <span>${index + 1}. ${cliente.nome}</span>
                    <span>${cliente.totalCortes} cortes</span>
                </span>
            `;
            containerFrequentes.appendChild(div);
        });
    }
    
    carregarHorariosMovimento(users);
    carregarRelatorioCortes(users, periodo);
}

function carregarHorariosMovimento(users) {
    const horarios = {};
    
    users.forEach(user => {
        if (user.historico) {
            user.historico.forEach(corte => {
                if (corte.hora) {
                    try {
                        const hora = corte.hora.split(':')[0];
                        horarios[hora] = (horarios[hora] || 0) + 1;
                    } catch(e) {}
                }
            });
        }
    });
    
    const horariosOrdenados = Object.entries(horarios)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const containerHorarios = document.getElementById('horariosMovimento');
    if (containerHorarios) {
        containerHorarios.innerHTML = '';
        horariosOrdenados.forEach(([hora, quantidade]) => {
            const div = document.createElement('div');
            div.className = 'horario-item';
            div.innerHTML = `
                <span style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #444;">
                    <span>${hora}h - ${parseInt(hora)+1}h</span>
                    <span>${quantidade} cortes</span>
                </span>
            `;
            containerHorarios.appendChild(div);
        });
    }
}

function carregarRelatorioCortes(users, periodo) {
    const container = document.getElementById('relatorioCortes');
    if (!container) return;
    
    // TODO: Implementar filtro de 'periodo' (atualmente mostra todos)
    
    let html = `
        <div class="relatorio-item" style="font-weight: bold; background: #3a3a3a; display: grid; grid-template-columns: 2fr 1fr 1fr; padding: 10px;">
            <span>Cliente</span>
            <span>Total Cortes</span>
            <span>Pontos</span>
        </div>
    `;
    
    users.sort((a, b) => (b.historico ? b.historico.length : 0) - (a.historico ? a.historico.length : 0)).forEach(user => {
        html += `
            <div class="relatorio-item" style="display: grid; grid-template-columns: 2fr 1fr 1fr; padding: 10px; border-bottom: 1px solid #444;">
                <span>${user.nome}</span>
                <span>${user.historico ? user.historico.length : 0}</span>
                <span>${user.pontos}</span>
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

async function exportarClientes() {
    const users = await getAllUsers();
    const csv = ['Nome,CPF,E-mail,Data Nascimento,Pontos,Total Cortes,Data Cadastro'];
    
    users.forEach(user => {
        const cpfFormatado = user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        const dataNascimento = user.dataNascimento ? new Date(user.dataNascimento).toLocaleDateString('pt-BR') : 'N/A';
        const dataCadastro = user.dataCadastro ? new Date(user.dataCadastro).toLocaleDateString('pt-BR') : 'N/A';
        csv.push(`"${user.nome}","'${cpfFormatado}","${user.email}","${dataNascimento}",${user.pontos},${user.historico ? user.historico.length : 0},"${dataCadastro}"`);
    });
    
    downloadCSV(csv.join('\n'), 'clientes_barbearia_style.csv');
}

async function exportarCortes() {
    const users = await getAllUsers();
    const csv = ['Data,Hora,Cliente,CPF,Barbeiro'];
    
    users.forEach(user => {
        if (user.historico) {
            user.historico.forEach(corte => {
                const cpfFormatado = user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                csv.push(`"${corte.data}","${corte.hora || ''}","${user.nome}","'${cpfFormatado}","${corte.barbeiro || 'N/A'}"`);
            });
        }
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
    
    const dataNascimentoInput = document.getElementById('dataNascimento');
    if (dataNascimentoInput) {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        dataNascimentoInput.max = `${ano}-${mes}-${dia}`;
        
        const anoMin = ano - 100;
        dataNascimentoInput.min = `${anoMin}-${mes}-${dia}`;
    }
    
    console.log('Sistema de Barbearia (Supabase) inicializado.');
    // console.log('Usuários no localStorage (cache):', JSON.parse(localStorage.getItem('users') || '[]'));
    // console.log('Barbeiros no localStorage (cache):', JSON.parse(localStorage.getItem('barbeiros') || '[]'));
});