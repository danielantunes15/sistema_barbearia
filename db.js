/* danielantunes15/sistema_barbearia/sistema_barbearia-197d2932e7e3d39489bf9472ce2a71471b9e3a99/db.js */

// Funções auxiliares para o banco de dados Supabase
// CORREÇÃO: Todas as chamadas usam 'supabaseClient' (definido em supabase_config.js)

// ===============================================
// FUNÇÕES USERS (CLIENTES)
// ===============================================

/**
 * Busca um usuário pelo ID.
 */
async function getUserById(id) {
    const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
    
    // PGRST116: "single" não encontrou resultados (não é um erro real)
    if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar usuário por ID:', error);
    }
    return data;
}

/**
 * Busca um usuário pelo CPF e SENHA HASHED.
 */
async function getUserByCpfAndPassword(cpf, hashedPassword) {
    const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('cpf', cpf)
        .eq('password', hashedPassword) // Compara com o hash
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar usuário por CPF/Senha:', error);
    }
    return data;
}

/**
 * Verifica se um email ou CPF já existe na tabela de usuários.
 */
async function emailOrCpfExists(email, cpf) {
    const { data, error } = await supabaseClient
        .from('users')
        .select('id, email, cpf')
        .or(`email.eq.${email},cpf.eq.${cpf}`);
    
    if (error) {
        console.error('Erro ao verificar email/cpf:', error);
        return true; // Assume que existe para evitar falha no cadastro
    }
    
    return data.length > 0;
}

/**
 * Cria um novo usuário no banco de dados.
 */
async function createNewUser(newUser) {
    // ATUALIZADO: O newUser não precisa mais de 'historico'
    const { data, error } = await supabaseClient
        .from('users')
        .insert([newUser])
        .select()
        .single();
        
    if (error) {
        console.error('Erro ao criar novo usuário:', error);
        return null;
    }
    return data;
}

/**
 * Atualiza um usuário existente (baseado no ID).
 */
async function updateUser(user) {
    // ATUALIZADO: Garante que 'historico' não seja enviado
    const { historico, ...userWithoutHistorico } = user;
    
    const { error } = await supabaseClient
        .from('users')
        .update(userWithoutHistorico)
        .eq('id', userWithoutHistorico.id);
    
    if (error) {
        console.error('Erro ao atualizar usuário:', error);
        return false;
    }
    return true;
}

/**
 * Busca todos os usuários.
 */
async function getAllUsers() {
    const { data, error } = await supabaseClient
        .from('users')
        .select('*');
    
    if (error) {
        console.error('Erro ao buscar todos os usuários:', error);
        return [];
    }
    return data || [];
}

/**
 * Deleta um usuário pelo ID.
 */
async function deleteUser(id) {
    // NOVO: Deleta cortes e agendamentos relacionados primeiro (boa prática)
    await supabaseClient.from('cortes').delete().eq('cliente_id', id);
    await supabaseClient.from('agendamentos').delete().eq('cliente_id', id);
    
    const { error } = await supabaseClient
        .from('users')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Erro ao deletar usuário:', error);
        return false;
    }
    return true;
}


// ===============================================
// FUNÇÕES BARBEIROS
// ===============================================

/**
 * Busca um barbeiro pelo ID.
 */
async function getBarbeiroById(id) {
    const { data, error } = await supabaseClient
        .from('barbeiros')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar barbeiro por ID:', error);
    }
    return data;
}

/**
 * Busca um barbeiro pelo CPF e SENHA HASHED.
 */
async function getBarbeiroByCpfAndPassword(cpf, hashedPassword) {
    const { data, error } = await supabaseClient
        .from('barbeiros')
        .select('*')
        .eq('cpf', cpf) // Alterado de email para cpf
        .eq('password', hashedPassword) // Compara com o hash
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar barbeiro por CPF/Senha:', error);
    }
    return data;
}

/**
 * Verifica se um email ou CPF já existe na tabela de barbeiros.
 */
async function barbeiroCpfOrEmailExists(email, cpf) {
    const { data, error } = await supabaseClient
        .from('barbeiros')
        .select('id')
        .or(`email.eq.${email},cpf.eq.${cpf}`);
    
    if (error) {
        console.error('Erro ao verificar email/cpf do barbeiro:', error);
        return true; // Assume que existe para evitar falha
    }
    return data.length > 0;
}

/**
 * Busca todos os barbeiros.
 */
async function getAllBarbeiros() {
    const { data, error } = await supabaseClient
        .from('barbeiros')
        .select('*');
    
    if (error) {
        console.error('Erro ao buscar todos os barbeiros:', error);
        return [];
    }
    return data || [];
}

/**
 * Cria um novo barbeiro no banco de dados.
 */
async function createNewBarbeiro(newBarbeiro) {
    const { data, error } = await supabaseClient
        .from('barbeiros')
        .insert([newBarbeiro])
        .select()
        .single();
        
    if (error) {
        console.error('Erro ao criar novo barbeiro:', error);
        return null;
    }
    return data;
}

/**
 * Deleta um barbeiro pelo ID.
 */
async function deleteBarbeiro(id) {
    // NOVO: Deleta cortes e agendamentos relacionados primeiro
    await supabaseClient.from('cortes').delete().eq('barbeiro_id', id);
    await supabaseClient.from('agendamentos').delete().eq('barbeiro_id', id);

    const { error } = await supabaseClient
        .from('barbeiros')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Erro ao deletar barbeiro:', error);
        return false;
    }
    return true;
}

// ===============================================
// NOVO: FUNÇÕES CORTES (para relatórios e fidelidade)
// ===============================================

/**
 * Cria um novo registro de corte.
 */
async function createCorte(newCorte) {
    const { data, error } = await supabaseClient
        .from('cortes')
        .insert([newCorte])
        .select()
        .single();
        
    if (error) {
        console.error('Erro ao registrar novo corte:', error);
        return null;
    }
    return data;
}

/**
 * Busca todos os cortes de um usuário.
 */
async function getCortesByUserId(userId) {
    const { data, error } = await supabaseClient
        .from('cortes')
        .select('*, barbeiros(nome)') // Faz join com o nome do barbeiro
        .eq('cliente_id', userId)
        .order('data_hora', { ascending: false });
        
    if (error) {
        console.error('Erro ao buscar cortes do usuário:', error);
        return [];
    }
    return data || [];
}

/**
 * Busca todos os cortes (para relatórios).
 */
async function getAllCortes() {
    const { data, error } = await supabaseClient
        .from('cortes')
        .select('*, users(nome, cpf, email, pontos), barbeiros(nome)');
        
    if (error) {
        console.error('Erro ao buscar todos os cortes:', error);
        return [];
    }
    return data || [];
}


// ===============================================
// NOVO: FUNÇÕES AGENDAMENTOS
// ===============================================

/**
 * Cria um novo agendamento.
 */
async function createAgendamento(newAgendamento) {
    const { data, error } = await supabaseClient
        .from('agendamentos')
        .insert([newAgendamento])
        .select()
        .single();
        
    if (error) {
        console.error('Erro ao criar novo agendamento:', error);
        return null;
    }
    return data;
}

/**
 * Busca agendamentos por barbeiro e data.
 */
async function getAgendamentosByBarbeiroAndDate(barbeiroId, dataString) {
    // dataString deve ser 'YYYY-MM-DD'
    const dataInicio = `${dataString}T00:00:00.000Z`;
    const dataFim = `${dataString}T23:59:59.999Z`;

    const { data, error } = await supabaseClient
        .from('agendamentos')
        .select('*, users(nome)')
        .eq('barbeiro_id', barbeiroId)
        .eq('status', 'pendente')
        .gte('data_hora', dataInicio)
        .lte('data_hora', dataFim)
        .order('data_hora', { ascending: true });
        
    if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        return [];
    }
    return data || [];
}

/**
 * Busca agendamentos por barbeiro e data.
 */
async function getAgendamentosByBarbeiro(barbeiroId) {
    const { data, error } = await supabaseClient
        .from('agendamentos')
        .select('*, users(nome)')
        .eq('barbeiro_id', barbeiroId)
        .eq('status', 'pendente')
        .order('data_hora', { ascending: true });
        
    if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        return [];
    }
    return data || [];
}