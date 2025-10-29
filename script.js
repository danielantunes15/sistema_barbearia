// Verifica se o usuário está logado
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser && !window.location.href.includes('index.html') && 
        !window.location.href.includes('cadastro.html') && 
        !window.location.href.includes('scanner.html')) {
        window.location.href = 'index.html';
    }
    return currentUser ? JSON.parse(currentUser) : null;
}

// Login
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Buscar usuário no "banco de dados"
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'dashboard.html';
        } else {
            alert('E-mail ou senha incorretos!');
        }
    });
}

// Cadastro
if (document.getElementById('cadastroForm')) {
    document.getElementById('cadastroForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const telefone = document.getElementById('telefone').value;
        const password = document.getElementById('password').value;
        
        // Gerar ID único
        const userId = 'user_' + Date.now();
        
        // Criar novo usuário
        const newUser = {
            id: userId,
            nome: nome,
            email: email,
            telefone: telefone,
            password: password,
            pontos: 0,
            historico: []
        };
        
        // Salvar usuário no "banco de dados"
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Verificar se o e-mail já existe
        if (users.find(u => u.email === email)) {
            alert('Este e-mail já está cadastrado!');
            return;
        }
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Fazer login automaticamente
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        window.location.href = 'dashboard.html';
    });
}

// Dashboard
if (document.getElementById('userName')) {
    const user = checkAuth();
    
    if (user) {
        document.getElementById('userName').textContent = user.nome;
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('currentPoints').textContent = user.pontos;
        
        // Atualizar barra de progresso
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = (user.pontos / 10) * 100;
        progressFill.style.width = `${progressPercentage}%`;
        
        // Preencher histórico
        const historyList = document.getElementById('historyList');
        if (user.historico && user.historico.length > 0) {
            user.historico.forEach(corte => {
                const li = document.createElement('li');
                li.textContent = `${corte.data} - Corte registrado`;
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

// QR Code
if (document.getElementById('qrcode')) {
    const user = checkAuth();
    
    if (user) {
        document.getElementById('userId').textContent = user.id;
        
        // Gerar QR Code usando a biblioteca QRCode.js
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

// Função fallback para mostrar QR Code
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

// Scanner
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
        // Verificar se é um ID de usuário válido
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.id === decodedText);
        
        const resultContainer = document.getElementById('result');
        
        if (user) {
            // Registrar corte
            const dataAtual = new Date().toLocaleDateString('pt-BR');
            
            // Atualizar pontos
            user.pontos += 1;
            if (user.pontos > 10) user.pontos = 10;
            
            // Adicionar ao histórico
            if (!user.historico) user.historico = [];
            user.historico.unshift({
                data: dataAtual,
                tipo: 'corte'
            });
            
            // Atualizar no "banco de dados"
            const userIndex = users.findIndex(u => u.id === user.id);
            users[userIndex] = user;
            localStorage.setItem('users', JSON.stringify(users));
            
            // Exibir resultado
            resultContainer.innerHTML = `
                <h3>Corte registrado com sucesso!</h3>
                <p>Cliente: ${user.nome}</p>
                <p>Pontos atuais: ${user.pontos}/10</p>
                ${user.pontos >= 10 ? '<p class="success">Parabéns! Este cliente tem direito a um corte grátis!</p>' : ''}
            `;
            resultContainer.className = 'result-container success';
            
            // Parar scanner após sucesso
            setTimeout(() => {
                if (html5QrcodeScanner) {
                    html5QrcodeScanner.stop().then(ignore => {
                        document.getElementById('stopScanner').style.display = 'none';
                        document.getElementById('startScanner').style.display = 'inline-block';
                    }).catch(err => {
                        console.error(err);
                    });
                }
            }, 3000);
        } else {
            resultContainer.innerHTML = '<p>QR Code inválido! Tente novamente.</p>';
            resultContainer.className = 'result-container error';
        }
    }
    
    function onScanFailure(error) {
        // Geralmente ignoramos erros de varredura, pois podem ser muitos
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});