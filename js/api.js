/* Conteúdo de db.js */

// ===============================================
// FUNÇÕES USERS (CLIENTES)
// ===============================================
async function getUserById(id) {
    const { data, error } = await supabaseClient.from('users').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') console.error('Erro ao buscar usuário por ID:', error);
    return data;
}
async function getUserByCpfAndPassword(cpf, hashedPassword) {
    const { data, error } = await supabaseClient.from('users').select('*').eq('cpf', cpf).eq('password', hashedPassword).single();
    if (error && error.code !== 'PGRST116') console.error('Erro ao buscar usuário por CPF/Senha:', error);
    return data;
}
async function emailOrCpfExists(email, cpf) {
    const { data, error } = await supabaseClient.from('users').select('id, email, cpf').or(`email.eq.${email},cpf.eq.${cpf}`);
    if (error) console.error('Erro ao verificar email/cpf:', error);
    return data.length > 0;
}
async function createNewUser(newUser) {
    const { data, error } = await supabaseClient.from('users').insert([newUser]).select().single();
    if (error) console.error('Erro ao criar novo usuário:', error);
    return data;
}
async function updateUser(user) {
    try {
        const { historico, password, ...userData } = user;
        if (!userData.id) throw new Error('ID do usuário ausente.');
        const { data, error } = await supabaseClient.from('users').update(userData).eq('id', userData.id);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('❌ Erro inesperado em updateUser:', err);
        return false;
    }
}
async function getAllUsers() {
    const { data, error } = await supabaseClient.from('users').select('*');
    if (error) console.error('Erro ao buscar todos os usuários:', error);
    return data || [];
}
async function deleteUser(id) {
    await supabaseClient.from('cortes').delete().eq('cliente_id', id);
    await supabaseClient.from('agendamentos').delete().eq('cliente_id', id);
    const { error } = await supabaseClient.from('users').delete().eq('id', id);
    if (error) console.error('Erro ao deletar usuário:', error);
    return !error;
}

// ===============================================
// FUNÇÕES BARBEIROS
// ===============================================
async function getBarbeiroById(id) {
    const { data, error } = await supabaseClient.from('barbeiros').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') console.error('Erro ao buscar barbeiro por ID:', error);
    return data;
}
async function getBarbeiroByCpfAndPassword(cpf, hashedPassword) {
    const { data, error } = await supabaseClient.from('barbeiros').select('*').eq('cpf', cpf).eq('password', hashedPassword).single();
    if (error && error.code !== 'PGRST116') console.error('Erro ao buscar barbeiro por CPF/Senha:', error);
    return data;
}
async function barbeiroCpfOrEmailExists(email, cpf) {
    const { data, error } = await supabaseClient.from('barbeiros').select('id').or(`email.eq.${email},cpf.eq.${cpf}`);
    if (error) console.error('Erro ao verificar email/cpf do barbeiro:', error);
    return data.length > 0;
}
async function getAllBarbeiros() {
    const { data, error } = await supabaseClient.from('barbeiros').select('*');
    if (error) console.error('Erro ao buscar todos os barbeiros:', error);
    return data || [];
}
async function createNewBarbeiro(newBarbeiro) {
    const { data, error } = await supabaseClient.from('barbeiros').insert([newBarbeiro]).select().single();
    if (error) console.error('Erro ao criar novo barbeiro:', error);
    return data;
}
async function deleteBarbeiro(id) {
    await supabaseClient.from('cortes').delete().eq('barbeiro_id', id);
    await supabaseClient.from('agendamentos').delete().eq('barbeiro_id', id);
    const { error } = await supabaseClient.from('barbeiros').delete().eq('id', id);
    if (error) console.error('Erro ao deletar barbeiro:', error);
    return !error;
}

// ===============================================
// FUNÇÕES CORTES
// ===============================================
async function createCorte(newCorte) {
    const { data, error } = await supabaseClient.from('cortes').insert([newCorte]).select().single();
    if (error) console.error('Erro ao registrar novo corte:', error);
    return data;
}
async function getCortesByUserId(userId) {
    const { data, error } = await supabaseClient.from('cortes').select('*, barbeiros(nome)').eq('cliente_id', userId).order('data_hora', { ascending: false });
    if (error) console.error('Erro ao buscar cortes do usuário:', error);
    return data || [];
}
async function getAllCortes() {
    const { data, error } = await supabaseClient.from('cortes').select('*, users(nome, cpf, email, pontos, cortes_gratis), barbeiros(nome)');
    if (error) console.error('Erro ao buscar todos os cortes:', error);
    return data || [];
}

// ===============================================
// FUNÇÕES AGENDAMENTOS
// ===============================================
async function createAgendamento(newAgendamento) {
    const { data, error } = await supabaseClient.from('agendamentos').insert([newAgendamento]).select().single();
    if (error) console.error('Erro ao criar novo agendamento:', error);
    return data;
}
async function getAgendamentosByBarbeiroAndDate(barbeiroId, dataString) {
    const dataInicio = `${dataString}T00:00:00.000Z`;
    const dataFim = `${dataString}T23:59:59.999Z`;
    const { data, error } = await supabaseClient.from('agendamentos').select('*, users(nome)').eq('barbeiro_id', barbeiroId).eq('status', 'pendente').gte('data_hora', dataInicio).lte('data_hora', dataFim).order('data_hora', { ascending: true });
    if (error) console.error('Erro ao buscar agendamentos:', error);
    return data || [];
}
async function getAgendamentosByBarbeiro(barbeiroId) {
    const { data, error } = await supabaseClient.from('agendamentos').select('*, users(nome)').eq('barbeiro_id', barbeiroId).eq('status', 'pendente').order('data_hora', { ascending: true });
    if (error) console.error('Erro ao buscar agendamentos:', error);
    return data || [];
}

/**
 * NOVO: Atualiza o status de um agendamento (ex: 'concluido' ou 'cancelado')
 */
async function updateAgendamentoStatus(agendamentoId, novoStatus) {
    const { data, error } = await supabaseClient
        .from('agendamentos')
        .update({ status: novoStatus })
        .eq('id', agendamentoId)
        .select()
        .single();
        
    if (error) {
        console.error('Erro ao atualizar status do agendamento:', error);
        return null;
    }
    return data;
}