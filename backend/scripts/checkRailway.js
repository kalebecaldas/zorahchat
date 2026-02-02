/**
 * Check Railway Connection
 * Verifica se está conectado ao Railway e mostra info do banco
 */

const { initializeDatabase, getDb } = require('../database');

async function checkRailway() {
    try {
        console.log('🔍 Verificando conexão com Railway...\n');

        // Check environment
        const isDev = !process.env.DATABASE_URL;
        const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
        
        console.log('📦 Ambiente:');
        console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
        console.log(`   Banco: ${isDev ? 'SQLite (Local)' : 'PostgreSQL (Railway)'}`);
        console.log(`   Railway: ${isRailway ? '✅ Sim' : '❌ Não'}`);
        
        if (process.env.DATABASE_URL) {
            // Ocultar senha na URL
            const dbUrl = process.env.DATABASE_URL.replace(/:([^@]+)@/, ':****@');
            console.log(`   DATABASE_URL: ${dbUrl}`);
        }
        
        console.log('\n🔌 Conectando ao banco...');
        await initializeDatabase();
        const db = getDb();
        
        console.log('✅ Conectado!\n');
        
        console.log('📊 Estatísticas do Banco:');
        
        // Count users
        try {
            const users = await db.get('SELECT COUNT(*) as count FROM users');
            console.log(`   👤 Usuários: ${users.count}`);
        } catch (e) {
            console.log(`   👤 Usuários: Erro (${e.message})`);
        }
        
        // Count workspaces
        try {
            const workspaces = await db.get('SELECT COUNT(*) as count FROM workspaces');
            console.log(`   🏢 Workspaces: ${workspaces.count}`);
        } catch (e) {
            console.log(`   🏢 Workspaces: Erro (${e.message})`);
        }
        
        // Count channels
        try {
            const channels = await db.get('SELECT COUNT(*) as count FROM channels');
            console.log(`   📺 Canais: ${channels.count}`);
        } catch (e) {
            console.log(`   📺 Canais: Erro (${e.message})`);
        }
        
        // Count messages
        try {
            const messages = await db.get('SELECT COUNT(*) as count FROM messages');
            console.log(`   💬 Mensagens: ${messages.count}`);
        } catch (e) {
            console.log(`   💬 Mensagens: Erro (${e.message})`);
        }
        
        console.log('\n👥 Usuários:');
        try {
            const allUsers = await db.all('SELECT id, name, email, status FROM users LIMIT 10');
            if (allUsers.length === 0) {
                console.log('   (nenhum usuário)');
            } else {
                allUsers.forEach(u => {
                    const isMaster = u.email === 'kalebe.caldas@hotmail.com' ? '⭐' : '  ';
                    console.log(`   ${isMaster} [${u.id}] ${u.name} (${u.email})`);
                });
                if (allUsers.length === 10) {
                    console.log('   ... (mostrando apenas 10)');
                }
            }
        } catch (e) {
            console.log(`   Erro: ${e.message}`);
        }
        
        console.log('\n✅ Verificação completa!');
        
        if (!isRailway && process.env.DATABASE_URL) {
            console.log('\n⚠️  AVISO: DATABASE_URL está definido mas não está no Railway');
            console.log('   Você está conectado a um banco PostgreSQL externo.');
        } else if (!process.env.DATABASE_URL) {
            console.log('\n💡 DICA: Este é o banco LOCAL (SQLite)');
            console.log('   Para verificar o Railway, execute:');
            console.log('   railway run node scripts/checkRailway.js');
        }
        
    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        console.error('\nStack:', error.stack);
        throw error;
    }
}

checkRailway()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
