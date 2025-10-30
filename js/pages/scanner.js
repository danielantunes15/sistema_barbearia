/* Lógica de script.js para scanner.html */

function initScannerPage() {
    // Redireciona se não for barbeiro
    initializeAuthRedirects('barbeiro');

    let html5QrcodeScanner;
    let scannedUser = null; 
    
    const startBtn = document.getElementById('startScanner');
    const stopBtn = document.getElementById('stopScanner');
    const resultContainer = document.getElementById('result');
    const corteTypeGroup = document.getElementById('corteTypeGroup');
    const confirmBtn = document.getElementById('confirmCorte');
    const tipoCorteSelect = document.getElementById('tipoCorte');

    startBtn.addEventListener('click', function() {
        this.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        resultContainer.style.display = 'none';
        corteTypeGroup.style.display = 'none';
        confirmBtn.style.display = 'none';
        scannedUser = null;
        
        html5QrcodeScanner = new Html5Qrcode("reader");
        html5QrcodeScanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess, 
            onScanFailure
        ).catch(err => {
            alert('Erro ao iniciar a câmera. Verifique as permissões.');
            stopBtn.style.display = 'none';
            startBtn.style.display = 'inline-block';
        });
    });
    
    stopBtn.addEventListener('click', function() {
        this.style.display = 'none';
        startBtn.style.display = 'inline-block';
        resultContainer.style.display = 'none';
        corteTypeGroup.style.display = 'none';
        confirmBtn.style.display = 'none';
        scannedUser = null;
        
        if (html5QrcodeScanner) {
            html5QrcodeScanner.stop().catch(err => console.error(err));
        }
    });
    
    confirmBtn.addEventListener('click', async function() {
        await finalizarRegistroCorte();
    });
    
    async function onScanSuccess(decodedText, decodedResult) {
        try {
            if (html5QrcodeScanner) html5QrcodeScanner.stop();

            const user = await getUserById(decodedText);
            
            if (user) {
                scannedUser = user;
                const cpfFormatado = user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                
                stopBtn.style.display = 'none';
                startBtn.style.display = 'inline-block';
                corteTypeGroup.style.display = 'block';
                confirmBtn.style.display = 'inline-block';
                resultContainer.style.display = 'block';
                resultContainer.className = 'result-container success';
                
                const temCorteGratis = user.pontos >= 10 || user.cortes_gratis > 0;
                const optionGratis = tipoCorteSelect.querySelector('option[value="corte_gratis"]');
                const totalGratis = (user.cortes_gratis || 0) + (user.pontos >= 10 ? 1 : 0);

                if (temCorteGratis) {
                    optionGratis.textContent = `Corte Grátis (Acumulado: ${totalGratis})`;
                    optionGratis.disabled = false;
                    tipoCorteSelect.value = 'corte_gratis'; // Sugere o corte grátis
                } else {
                    optionGratis.textContent = 'Corte Grátis (Pontos Insuficientes)';
                    optionGratis.disabled = true;
                    tipoCorteSelect.value = 'corte_pago';
                }
                
                resultContainer.innerHTML = `
                    <h3>Cliente Escaneado: ${user.nome}</h3>
                    <p><strong>CPF:</strong> ${cpfFormatado}</p>
                    <p><strong>Pontos:</strong> ${user.pontos}/10</p>
                    ${temCorteGratis ? `<p class="success" style="font-weight: bold;">🎉 Cliente tem direito a ${totalGratis} corte(s) grátis.</p>` : ''}
                `;
                
            } else {
                resultContainer.innerHTML = '<p>❌ QR Code inválido! Tente novamente.</p>';
                resultContainer.className = 'result-container error';
                resultContainer.style.display = 'block';
                confirmBtn.style.display = 'none';
                corteTypeGroup.style.display = 'none';
            }
        } catch (error) {
            console.error("ERRO CRÍTICO NO SCANNER:", error);
            resultContainer.innerHTML = `<p>❌ Erro interno ao carregar cliente. (${error.message})</p>`;
            resultContainer.className = 'result-container error';
            confirmBtn.style.display = 'none';
            corteTypeGroup.style.display = 'none';
            scannedUser = null;
        }
    }
    
    async function finalizarRegistroCorte() {
        if (!scannedUser) return alert('Erro: Nenhum cliente escaneado.');
        
        const tipoCorte = tipoCorteSelect.value;
        const barbeiroData = JSON.parse(localStorage.getItem('currentBarbeiro') || '{}');
        const now = new Date();
        
        const newCorte = {
            id: 'corte_' + Date.now(),
            cliente_id: scannedUser.id,
            barbeiro_id: barbeiroData.id,
            data_hora: now.toISOString(),
            tipo: tipoCorte
        };
        
        const userToUpdate = JSON.parse(JSON.stringify(scannedUser)); 
        
        if (tipoCorte === 'corte_pago') {
            userToUpdate.pontos = (userToUpdate.pontos || 0) + 1;
            
            if (userToUpdate.pontos >= 10) {
                userToUpdate.cortes_gratis = (userToUpdate.cortes_gratis || 0) + Math.floor(userToUpdate.pontos / 10);
                userToUpdate.pontos = userToUpdate.pontos % 10;
            }
            
        } else if (tipoCorte === 'corte_gratis') {
            if (userToUpdate.pontos >= 10) {
                userToUpdate.pontos = 0;
            } else if (userToUpdate.cortes_gratis > 0) {
                userToUpdate.cortes_gratis = userToUpdate.cortes_gratis - 1;
            } else {
                 return alert('Erro: Cliente não tem cortes grátis para resgatar.');
            }
        }
        
        const corteSuccess = await createCorte(newCorte);
        
        if (corteSuccess) {
            const userSuccess = await updateUser(userToUpdate);

            if (userSuccess) {
                
                // ==========================================================
                // LINHA CORRIGIDA - A LINHA PROBLEMÁTICA FOI REMOVIDA DAQUI
                // ==========================================================
                
                confirmBtn.style.display = 'none';
                corteTypeGroup.style.display = 'none';
                
                resultContainer.innerHTML = `
                    <h3>✅ Corte (${tipoCorte === 'corte_pago' ? 'Pago' : 'Grátis'}) registrado!</h3>
                    <p><strong>Cliente:</strong> ${scannedUser.nome}</p>
                    <p><strong>Novo Saldo de Pontos:</strong> ${userToUpdate.pontos}/10</p>
                    <p><strong>Cortes Grátis Acumulados:</strong> ${userToUpdate.cortes_gratis}</p>
                `;
            } else {
                 resultContainer.innerHTML = '<p>❌ Falha ao atualizar pontos/fidelidade do cliente.</p>';
                 resultContainer.className = 'result-container error';
            }
        } else {
            resultContainer.innerHTML = '<p>❌ Erro ao salvar o corte no banco de dados!</p>';
            resultContainer.className = 'result-container error';
        }
        
        scannedUser = null; // Limpa o estado
    }
    
    function onScanFailure(error) {
        // Ignorar erros
    }
}