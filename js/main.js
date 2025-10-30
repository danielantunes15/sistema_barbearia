// Este script decide qual lógica de página específica executar.

document.addEventListener('DOMContentLoaded', () => {
    const pageId = document.body.id;

    switch (pageId) {
        case 'login-page':
            if (document.getElementById('loginClienteForm')) {
                initLoginPage();
            } else if (document.getElementById('cadastroForm')) {
                initCadastroPage();
            }
            break;
        case 'dashboard-cliente':
            initClienteDashboard();
            break;
        case 'dashboard-barbeiro':
            initBarbeiroDashboard(); // Você precisará criar esta função em js/pages/barbeiro.js
            break;
        case 'scanner-page':
            initScannerPage();
            break;
        case 'qrcode-page':
            initQRCodePage(); // Você precisará criar esta função em js/pages/qrcode.js
            break;
        case 'relatorios-page':
            initRelatoriosPage(); // Você precisará criar esta função em js/pages/relatorios.js
            break;
        case 'agendamento-page':
            initAgendamentoPage(); // Você precisará criar esta função em js/pages/agendamento.js
            break;
        case 'gerenciamento-page':
            initGerenciamentoPage(); // Você precisará criar esta função em js/pages/gerenciamento.js
            break;
    }
    
    console.log('Sistema de Barbearia (Refatorado) inicializado.');
});