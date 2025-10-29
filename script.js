// Verifica se o usuário está logado
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    const currentBarbeiro = localStorage.getItem('currentBarbeiro');
    
    if (!currentUser && !currentBarbeiro && 
        !window.location.href.includes('index.html') && 
        !window.location.href.includes('cadastro.html') && 
        !window.location.href.includes('scanner.html')) {
        window.location.href = 'index.html';
    }
    
    if (currentUser) return { tipo: 'cliente', data: JSON.parse(currentUser) };
    if (currentBarbeiro) return { tipo: 'barbeiro', data: JSON.parse(currentBarbeiro) };
    return null;
}

// Tabs no login
function showTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.form').forEach(form => form.classList.remove('active'));
    
    document.querySelector(`.tab-btn:nth-child(${tab === 'cliente' ? 1 : 2})`).classList.add('active');
    document.getElementById(tab === 'cliente' ? 'loginClienteForm' : 'loginBarbeiroForm').classList.add('active');
}

// Login Cliente
if (document.getElementById('loginClienteForm')) {
    document.getElementById('loginClienteForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('emailCliente').value;
        const password = document.getElementById('passwordCliente').value;
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'dashboard-cliente.html';
        } else {
            alert('E-mail ou senha incorretos!');
        }
    });
}

// Login Barbeiro
if (document.getElementById('loginBarbeiroForm')) {
    document.getElementById('loginBarbeiroForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('emailBarbeiro').value;
        const password = document.getElementById('passwordBarbeiro').value;
        
        const barbeiros = JSON.parse(localStorage.getItem('barbeiros') || '[]');
        const barbeiro = barbeiros.find(b => b.email === email && b.password === password);
        
        if (barbeiro) {
            localStorage.setItem('currentBarbeiro', JSON.stringify(barbeiro));
            window.location.href = 'dashboard-barbeiro.html';
        } else {
            alert('E-mail ou senha incorretos!');
        }
    });
}

// Cadastro Cliente
if (document.getElementById('cadastroForm')) {
    document.getElementById('cadastroForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const telefone = document.getElementById('telefone').value;
        const password = document.getElementById('password').value;
        
        const userId = 'user_' + Date.now();
        
        const newUser = {
            id: userId,
            nome: nome,
            email: email,
            telefone: telefone,
            password: password,
            pontos: 0,
            historico: [],
            dataCadastro: new Date().toISOString()
        };
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        if (users.find(u => u.email === email)) {
            alert('Este e-mail já está cadastrado!');
            return;
        }
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        window.location.href = 'dashboard-cliente.html';
    });
}

// Dashboard Cliente
if (document.getElementById('userName')) {
    const auth = checkAuth();
    
    if (auth && auth.tipo === 'cliente') {
        const user = auth.data;
        
        document.getElementById('userName').textContent = user.nome;
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('userTelefone').textContent = user.telefone;
        document.getElementById('currentPoints').textContent = user.pontos;
        
        // Calcular estatísticas
        const totalCortes = user.historico ? user.historico.length : 0;
        const cortesGratis = Math.floor(user.pontos / 10);
        const frequencia = calcularFrequencia(user.historico);
        
        document.getElementById('totalCortes').textContent = totalCortes;
        document.getElementById('cortesGratis').textContent = cortesGratis;
        document.getElementById('frequencia').textContent = frequencia;
        
        // Atualizar barra de progresso
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = (user.pontos / 10) * 100;
        progressFill.style.width = `${progressPercentage}%`;
        
        // Mensagem motivacional
        const pontosInfo = document.getElementById('pointsInfo');
        if (user.pontos >= 10) {
            pontosInfo.innerHTML = '🎉 Parabéns! Você tem direito a um corte grátis!';
            pontosInfo.style.color = '#27ae60';
            pontosInfo.style.fontWeight = 'bold';
        } else if (user.pontos >= 8) {
            pontosInfo.innerHTML = '💪 Quase lá! Faltam apenas ' + (10 - user.pontos) + ' cortes para ganhar um grátis!';
        } else if (user.pontos >= 5) {
            pontosInfo.innerHTML = '👍 Continue assim! Já tem ' + user.pontos + ' de 10 cortes!';
        }
        
        // Preencher histórico
        const historyList = document.getElementById('historyList');
        if (user.historico && user.historico.length > 0) {
            user.historico.slice(0, 10).forEach(corte => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${corte.data}</span>
                    <span>Corte registrado</span>
                `;
                historyList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Nenhum corte registrado ainda';
            historyList.appendChild(li);
        }
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }
}

// Dashboard Barbeiro
if (document.getElementById('barbeiroNome')) {
    const auth = checkAuth();
    
    if (auth && auth.tipo === 'barbeiro') {
        const barbeiro = auth.data;
        document.getElementById('barbeiroNome').textContent = barbeiro.nome;
        
        carregarDashboardBarbeiro();
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', function() {
            localStorage.removeItem('currentBarbeiro');
            window.location.href = 'index.html';
        });
    }
}

function carregarDashboardBarbeiro() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const hoje = new Date().toLocaleDateString('pt-BR');
    
    // Estatísticas gerais
    document.getElementById('totalClientes').textContent = users.length;
    document.getElementById('cortesHoje').textContent = users.reduce((total, user) => 
        total + (user.historico ? user.historico.filter(h => h.data === hoje).length : 0), 0
    );
    document.getElementById('cortesMes').textContent = users.reduce((total, user) => 
        total + (user.historico ? user.historico.filter(h => {
            const dataCorte = new Date(h.data.split('/').reverse().join('-'));
            const hoje = new Date();
            return dataCorte.getMonth() === hoje.getMonth() && dataCorte.getFullYear() === hoje.getFullYear();
        }).length : 0), 0
    );
    document.getElementById('totalFidelidades').textContent = users.filter(u => u.pontos >= 10).length;
    
    // Clientes próximos da fidelidade (8+ pontos)
    const clientesProximos = users.filter(u => u.pontos >= 8 && u.pontos < 10)
        .sort((a, b) => b.pontos - a.pontos);
    
    const containerProximos = document.getElementById('clientesProximos');
    containerProximos.innerHTML = '';
    
    if (clientesProximos.length > 0) {
        clientesProximos.forEach(cliente => {
            const div = document.createElement('div');
            div.className = 'cliente-item';
            div.innerHTML = `
                <div class="cliente-info">
                    <h4>${cliente.nome}</h4>
                    <p>${cliente.email} • ${cliente.telefone}</p>
                </div>
                <div class="cliente-stats">
                    <span class="pontos-badge alto">${cliente.pontos}/10 pontos</span>
                    <p style="font-size: 0.8rem; margin-top: 5px;">Faltam ${10 - cliente.pontos}</p>
                </div>
            `;
            containerProximos.appendChild(div);
        });
    } else {
        containerProximos.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Nenhum cliente próximo da fidelidade</p>';
    }
    
    // Todos os clientes
    const containerTodos = document.getElementById('todosClientes');
    containerTodos.innerHTML = '';
    
    users.sort((a, b) => b.pontos - a.pontos).forEach(cliente => {
        let badgeClass = 'baixo';
        if (cliente.pontos >= 8) badgeClass = 'alto';
        else if (cliente.pontos >= 5) badgeClass = 'medio';
        
        const div = document.createElement('div');
        div.className = 'cliente-item';
        div.innerHTML = `
            <div class="cliente-info">
                <h4>${cliente.nome}</h4>
                <p>${cliente.email} • ${cliente.telefone}</p>
                <p style="font-size: 0.8rem;">Cadastro: ${new Date(cliente.dataCadastro).toLocaleDateString('pt-BR')}</p>
            </div>
            <div class="cliente-stats">
                <span class="pontos-badge ${badgeClass}">${cliente.pontos} pontos</span>
                <p style="font-size: 0.8rem; margin-top: 5px;">${cliente.historico ? cliente.historico.length : 0} cortes</p>
            </div>
        `;
        containerTodos.appendChild(div);
    });
    
    // Busca de clientes
    document.getElementById('searchClient').addEventListener('input', function(e) {
        const termo = e.target.value.toLowerCase();
        const clientesItems = containerTodos.querySelectorAll('.cliente-item');
        
        clientesItems.forEach(item => {
            const texto = item.textContent.toLowerCase();
            item.style.display = texto.includes(termo) ? 'flex' : 'none';
        });
    });
    
    // Estatísticas de frequência
    carregarEstatisticasFrequencia(users);
}

function carregarEstatisticasFrequencia(users) {
    const container = document.getElementById('estatisticasFrequencia');
    
    // Clientes mais frequentes (últimos 30 dias)
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    
    const clientesFrequentes = users.map(user => {
        const cortesRecentes = user.historico ? user.historico.filter(h => {
            const dataCorte = new Date(h.data.split('/').reverse().join('-'));
            return dataCorte >= trintaDiasAtras;
        }).length : 0;
        
        return { ...user, cortesRecentes };
    }).filter(user => user.cortesRecentes > 0)
      .sort((a, b) => b.cortesRecentes - a.cortesRecentes)
      .slice(0, 5);
    
    let html = '<h4>Clientes Mais Frequentes (últimos 30 dias)</h4>';
    
    if (clientesFrequentes.length > 0) {
        clientesFrequentes.forEach((cliente, index) => {
            html += `
                <div class="ranking-item">
                    <span>${index + 1}. ${cliente.nome}</span>
                    <span>${cliente.cortesRecentes} cortes</span>
                </div>
            `;
        });
    } else {
        html += '<p style="text-align: center; color: #7f8c8d;">Nenhum corte nos últimos 30 dias</p>';
    }
    
    container.innerHTML = html;
}

function calcularFrequencia(historico) {
    if (!historico || historico.length < 2) return '-';
    
    const datas = historico.map(h => new Date(h.data.split('/').reverse().join('-')))
        .sort((a, b) => a - b);
    
    const diferencas = [];
    for (let i = 1; i < datas.length; i++) {
        const diff = (datas[i] - datas[i-1]) / (1000 * 60 * 60 * 24); // diferença em dias
        diferencas.push(diff);
    }
    
    const mediaDias = diferencas.reduce((a, b) => a + b, 0) / diferencas.length;
    
    if (mediaDias <= 15) return 'Alta';
    if (mediaDias <= 30) return 'Média';
    return 'Baixa';
}

// QR Code (mantido igual)
if (document.getElementById('qrcode')) {
    const auth = checkAuth();
    
    if (auth && auth.tipo === 'cliente') {
        const user = auth.data;
        document.getElementById('userId').textContent = user.id;
        
        const qrcodeContainer = document.getElementById('qrcode');
        
        try {
            QRCode.toCanvas(qrcodeContainer, user.id, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
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
    }
}

function showFallbackQRCode(userId, container) {
    container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="background: white; padding: 20px; border-radius: 10px; border: 2px solid #ddd; display: inline-block;">
                <h3 style="color: #333; margin-bottom: 15px;">ID do Usuário</h3>
                <div style="font-size: 18px; font-weight: bold; background: #f8f9fa; padding: 15px; border-radius: 5px; letter-spacing: 2px;">
                    ${userId}
                </div>
            </div>
            <p style="color: #666; margin-top: 15px;">
                Mostre este código ao barbeiro caso o QR Code não funcione
            </p>
        </div>
    `;
}

// Scanner (mantido similar, com ajustes para barbeiro)
if (document.getElementById('reader')) {
    let html5QrcodeScanner;
    
    document.getElementById('startScanner').addEventListener('click', function() {
        this.style.display = 'none';
        document.getElementById('stopScanner').style.display = 'inline-block';
        
        html5QrcodeScanner = new Html5Qrcode("reader");
        
        html5QrcodeScanner.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            onScanSuccess,
            onScanFailure
        ).catch(err => {
            console.error(err);
            alert('Erro ao iniciar a câmera. Verifique as permissões.');
        });
    });
    
    document.getElementById('stopScanner').addEventListener('click', function() {
        this.style.display = 'none';
        document.getElementById('startScanner').style.display = 'inline-block';
        
        if (html5QrcodeScanner) {
            html5QrcodeScanner.stop().then(ignore => {
                // Scanner parado
            }).catch(err => {
                console.error(err);
            });
        }
    });
    
    function onScanSuccess(decodedText, decodedResult) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.id === decodedText);
        
        const resultContainer = document.getElementById('result');
        
        if (user) {
            const dataAtual = new Date().toLocaleDateString('pt-BR');
            const horaAtual = new Date().toLocaleTimeString('pt-BR');
            
            user.pontos += 1;
            if (user.pontos > 10) user.pontos = 10;
            
            if (!user.historico) user.historico = [];
            user.historico.unshift({
                data: dataAtual,
                hora: horaAtual,
                tipo: 'corte',
                barbeiro: JSON.parse(localStorage.getItem('currentBarbeiro')).nome
            });
            
            const userIndex = users.findIndex(u => u.id === user.id);
            users[userIndex] = user;
            localStorage.setItem('users', JSON.stringify(users));
            
            resultContainer.innerHTML = `
                <h3>✅ Corte registrado com sucesso!</h3>
                <p><strong>Cliente:</strong> ${user.nome}</p>
                <p><strong>Pontos atuais:</strong> ${user.pontos}/10</p>
                <p><strong>Data:</strong> ${dataAtual} ${horaAtual}</p>
                ${user.pontos >= 10 ? '<p class="success">🎉 Parabéns! Este cliente tem direito a um corte grátis!</p>' : ''}
            `;
            resultContainer.className = 'result-container success';
            
            setTimeout(() => {
                if (html5QrcodeScanner) {
                    html5QrcodeScanner.stop().then(ignore => {
                        document.getElementById('stopScanner').style.display = 'none';
                        document.getElementById('startScanner').style.display = 'inline-block';
                    }).catch(err => {
                        console.error(err);
                    });
                }
            }, 5000);
        } else {
            resultContainer.innerHTML = '<p>❌ QR Code inválido! Tente novamente.</p>';
            resultContainer.className = 'result-container error';
        }
    }
    
    function onScanFailure(error) {
        // Ignorar erros de varredura
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});