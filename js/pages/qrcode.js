/* Lógica de script.js para qrcode.html */

// Esta função será chamada pelo main.js e pelo script loader do HTML
async function initQRCodePage() {
    const qrcodeContainer = document.getElementById('qrcode');
    if (!qrcodeContainer) return;

    // 1. Verificar se o usuário é um cliente
    const auth = await checkAuth();
    if (!auth || auth.tipo !== 'cliente') {
        // Apenas redireciona se não for um cliente
        return initializeAuthRedirects('cliente'); 
    }
    
    const user = auth.data;
    document.getElementById('userId').textContent = user.id;

    // 2. Tentar gerar o QR Code
    // Verifica se a biblioteca QRCode (carregada pelo qrcode.html) está disponível
    if (typeof QRCode === 'undefined') {
        console.warn('Biblioteca QRCode ainda não carregada, aguardando o loader do HTML...');
        // O script em qrcode.html tentará chamar esta função novamente
        // quando a biblioteca carregar.
        return;
    }

    try {
        console.log('Biblioteca QRCode pronta. Gerando...');
        qrcodeContainer.innerHTML = '';
        const canvas = document.createElement('canvas');
        qrcodeContainer.appendChild(canvas);
        
        QRCode.toCanvas(canvas, user.id, {
            width: 250,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
        }, function(error) {
            if (error) {
                console.error('Erro ao gerar QR Code:', error);
                showFallbackQRCode(user.id, qrcodeContainer);
            } else {
                // Aplica estilos (do script.js original)
                canvas.style.border = '2px solid #444';
                canvas.style.borderRadius = '15px';
                canvas.style.padding = '15px';
                canvas.style.background = 'white';
                canvas.style.maxWidth = '100%';
            }
        });
        
    } catch (error) {
        console.error('Erro geral ao gerar QR Code:', error);
        showFallbackQRCode(user.id, qrcodeContainer);
    }
}

// Função auxiliar (do script.js original)
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

// Anexa a função ao window para que o script loader em qrcode.html possa encontrá-la.
window.initQRCodePage = initQRCodePage;