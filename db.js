// Inicializar "banco de dados" se não existir
if (!localStorage.getItem('users')) {
    const initialUsers = [
        {
            id: 'user_1',
            nome: 'João Silva',
            email: 'joao@example.com',
            telefone: '(11) 99999-9999',
            password: '123456',
            pontos: 3,
            historico: [
                { data: '15/03/2023', tipo: 'corte' },
                { data: '01/04/2023', tipo: 'corte' },
                { data: '20/04/2023', tipo: 'corte' }
            ]
        },
        {
            id: 'user_2',
            nome: 'Maria Santos',
            email: 'maria@example.com',
            telefone: '(11) 98888-8888',
            password: '123456',
            pontos: 7,
            historico: [
                { data: '10/02/2023', tipo: 'corte' },
                { data: '25/02/2023', tipo: 'corte' },
                { data: '12/03/2023', tipo: 'corte' },
                { data: '28/03/2023', tipo: 'corte' },
                { data: '15/04/2023', tipo: 'corte' },
                { data: '30/04/2023', tipo: 'corte' },
                { data: '18/05/2023', tipo: 'corte' }
            ]
        }
    ];
    
    localStorage.setItem('users', JSON.stringify(initialUsers));
}

// Funções auxiliares para o "banco de dados"
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