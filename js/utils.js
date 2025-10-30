/* Funções de script.js */
function formatarCPF(campo) {
    let cpf = campo.value.replace(/\D/g, '');
    if (cpf.length > 11) cpf = cpf.substring(0, 11);
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    campo.value = cpf;
}

function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    const cpfsInvalidos = [
        '00000000000', '11111111111', '22222222222', '33333333333', 
        '44444444444', '55555555555', '66666555555', '77777777777', 
        '88888888888', '99999999999'
    ];
    if (cpfsInvalidos.includes(cpf)) return false;
    return true; 
}

async function checkFieldAvailability(input, type) {
    const value = input.value.replace(/\D/g, '');
    const isCpf = type === 'cpf';
    input.removeAttribute('data-status');
    if (!value || (isCpf && value.length < 11)) return;
    if (isCpf && !validarCPF(value)) return;

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

function downloadCSV(csv, filename) {
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

function calcularFrequencia(cortes) {
    if (!cortes || cortes.length < 2) return '-';
    try {
        const datas = cortes.map(c => new Date(c.data_hora)).sort((a, b) => a - b);
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