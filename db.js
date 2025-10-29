/* danielantunes15/sistema_barbearia/sistema_barbearia-197d2932e7e3d39489bf9472ce2a71471b9e3a99/db.js */

// Funções auxiliares para o banco de dados Supabase
// CORREÇÃO: Todas as chamadas usam 'supabaseClient' (definido em supabase_config.js)

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
 * Busca um barbeiro pelo Email e SENHA HASHED.
 * (Esta função não é mais usada para login, mas mantida)
 */
async function getBarbeiroByEmailAndPassword(email, hashedPassword) {
    const { data, error } = await supabaseClient
        .from('barbeiros')
        .select('*')
        .eq('email', email)
        .eq('password', hashedPassword) // Compara com o hash
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar barbeiro por Email/Senha:', error);
    }
    return data;
}

/**
 * NOVO: Busca um barbeiro pelo CPF e SENHA HASHED.
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
 * NOVO: Verifica se um email ou CPF já existe na tabela de barbeiros.
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
 * Cria um novo usuário no banco de dados.
 */
async function createNewUser(newUser) {
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
    const { error } = await supabaseClient
        .from('users')
        .update(user)
        .eq('id', user.id);
    
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

// ===============================================
// NOVAS FUNÇÕES PARA GERENCIAMENTO (Parte 2)
// ===============================================

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
 * Deleta um usuário pelo ID.
 */
async function deleteUser(id) {
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

/**
 * Deleta um barbeiro pelo ID.
 */
async function deleteBarbeiro(id) {
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