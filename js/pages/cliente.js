/* Lógica de script.js para dashboard-cliente.html */

async function initClienteDashboard() {
    const auth = await checkAuth();
    if (!auth || auth.tipo !== 'cliente') {
        return initializeAuthRedirects('cliente'); // Redireciona se não for cliente
    }
    
    const user = auth.data;
    console.log('Carregando dashboard do cliente:', user);
    
    // Carregar Cortes e calcular estatísticas
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
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
        userInfoExtra += ` | Idade: ${idade} anos`;
    }
    if (document.getElementById('userTelefone')) {
        document.getElementById('userTelefone').textContent = userInfoExtra;
    }
    
    document.getElementById('currentPoints').textContent = user.pontos;
    
    if (document.getElementById('totalCortesPagos')) {
        document.getElementById('totalCortesPagos').textContent = totalCortesPagos;
        document.getElementById('cortesGratisAcumulados').textContent = user.cortes_gratis || 0;
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
        } else {
            pontosInfo.innerHTML = 'A cada 10 cortes, você ganha 1 corte grátis!';
        }
    }
    
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    if (cortes && cortes.length > 0) {
        cortes.slice(0, 10).forEach(corte => {
            const li = document.createElement('li');
            const tipoCorte = corte.tipo === 'corte_gratis' ? 'Corte Grátis' : 'Corte Pago';
            const barbeiroNome = corte.barbeiros ? corte.barbeiros.nome : 'N/A';
            const dataFormatada = new Date(corte.data_hora).toLocaleDateString('pt-BR');
            const horaFormatada = new Date(corte.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            li.innerHTML = `<span>${dataFormatada} (${horaFormatada})</span><span>${tipoCorte} com ${barbeiroNome}</span>`;
            historyList.appendChild(li);
        });
    } else {
        historyList.innerHTML = '<li>Nenhum corte registrado ainda</li>';
    }
    
    document.getElementById('logoutBtn').addEventListener('click', logout);
}