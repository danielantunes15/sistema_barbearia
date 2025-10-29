// Inicializar "banco de dados" se não existir
if (!localStorage.getItem('users')) {
    const initialUsers = [
        {
            id: 'user_1',
            nome: 'João Silva',
            dataNascimento: '1990-05-15',
            cpf: '12345678901',
            email: 'joao@example.com',
            password: '123456',
            pontos: 8,
            dataCadastro: '2023-01-15',
            historico: [
                { data: '15/01/2023', hora: '10:30', tipo: 'corte', barbeiro: 'Carlos' },
                { data: '01/02/2023', hora: '14:00', tipo: 'corte', barbeiro: 'Carlos' },
                { data: '20/02/2023', hora: '11:15', tipo: 'corte', barbeiro: 'Carlos' },
                { data: '10/03/2023', hora: '16:30', tipo: 'corte', barbeiro: 'Carlos' },
                { data: '28/03/2023', hora: '09:45', tipo: 'corte', barbeiro: 'Carlos' },
                { data: '15/04/2023', hora: '13:20', tipo: 'corte', barbeiro: 'Carlos' },
                { data: '30/04/2023', hora: '15:10', tipo: 'corte', barbeiro: 'Carlos' },
                { data: '18/05/2023', hora: '10:00', tipo: 'corte', barbeiro: 'Carlos' }
            ]
        },
        {
            id: 'user_2',
            nome: 'Maria Santos',
            dataNascimento: '1985-08-22',
            cpf: '98765432100',
            email: 'maria@example.com',
            password: '123456',
            pontos: 6,
            dataCadastro: '2023-02-10',
            historico: [
                { data: '10/02/2023', hora: '11:00', tipo: 'corte', barbeiro: 'Carlos' },
                { data: '25/02/2023', hora: '14:30', tipo: 'corte', barbeiro: 'Carlos' },
                { data: '12/03/2023', hora: '10:15', tipo: 'corte', barbeiro: 'Carlos' },
                { data: '28/03/2023', hora: '16:45', tipo: 'corte', barbeiro: 'Carlos' },
                { data: '15/04/2023', hora: '13:00', tipo: 'corte', barbeiro: 'Carlos' },
                { data: '30/04/2023', hora: '15:30', tipo: 'corte', barbeiro: 'Carlos' }
            ]
        }
    ];
    
    localStorage.setItem('users', JSON.stringify(initialUsers));
}

// Inicializar barbeiros (mantido igual)
if (!localStorage.getItem('barbeiros')) {
    const initialBarbeiros = [
        {
            id: 'barbeiro_1',
            nome: 'Carlos Silva',
            email: 'carlos@barbearia.com',
            password: '123456',
            dataCadastro: '2023-01-01'
        },
        {
            id: 'barbeiro_2',
            nome: 'Ricardo Santos',
            email: 'ricardo@barbearia.com',
            password: '123456',
            dataCadastro: '2023-01-01'
        }
    ];
    
    localStorage.setItem('barbeiros', JSON.stringify(initialBarbeiros));
}

// Funções auxiliares (mantidas iguais)
function getUserById(id) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.find(u => u.id === id);
}

function updateUser(user) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex(u => u.id === user.id);
    
    if (index !== -1) {
        users[index] = user;
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    }
    
    return false;
}

function getBarbeiroById(id) {
    const barbeiros = JSON.parse(localStorage.getItem('barbeiros') || '[]');
    return barbeiros.find(b => b.id === id);
}