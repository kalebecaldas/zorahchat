/**
 * Reset Railway Database (PostgreSQL)
 * 
 * CUIDADO: Este script deleta TODOS os dados do banco de produção!
 * 
 * Como executar no Railway:
 * 1. Via Railway CLI:
 *    railway run node scripts/resetRailway.js
 * 
 * 2. Via web (criar um endpoint temporário)
 * 
 * 3. Conectar diretamente ao PostgreSQL e executar SQLs
 */

const bcryptjs = require('bcryptjs');
const { getDb, initializeDatabase } = require('../database');

const MASTER_EMAIL = 'kalebe.caldas@hotmail.com';
const MASTER_PASSWORD = 'mxskqgltne';
const MASTER_NAME = 'Master Admin';

async function resetRailwayDatabase() {
    try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  RAILWAY DATABASE RESET');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('🔍 Detectando tipo de banco...');

        await initializeDatabase();
        const db = getDb();

        // Detectar se é PostgreSQL ou SQLite
        const isPostgres = !!process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgres');
        
        console.log(`📦 Banco: ${isPostgres ? 'PostgreSQL (Railway)' : 'SQLite (Local)'}`);
        console.log('');
        
        if (!isPostgres) {
            console.log('⚠️  AVISO: Este script deve ser executado apenas no Railway!');
            console.log('   Para ambiente local, use: node scripts/forceReset.js');
            console.log('');
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            const answer = await new Promise(resolve => {
                readline.question('Continuar mesmo assim? (digite "SIM" para confirmar): ', resolve);
            });
            readline.close();
            
            if (answer !== 'SIM') {
                console.log('❌ Operação cancelada.');
                return;
            }
        }

        console.log('⚠️  ESTA AÇÃO IRÁ:');
        console.log('   ❌ DELETAR TODOS os usuários (exceto master)');
        console.log('   ❌ DELETAR TODOS os workspaces');
        console.log('   ❌ DELETAR TODAS as mensagens');
        console.log('   ❌ DELETAR TODOS os canais');
        console.log('   ❌ DELETAR TODOS os dados');
        console.log('');
        console.log('⏰ Iniciando em 5 segundos...');
        console.log('   (Pressione Ctrl+C para cancelar)');
        console.log('');
        
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('🗑️  Deletando todos os dados...');
        console.log('');

        // Lista de tabelas na ordem correta (respeitando foreign keys)
        const tables = [
            'admin_audit_log',
            'mentions',
            'notifications',
            'read_receipts',
            'message_reactions',
            'message_attachments',
            'messages',
            'channel_members',
            'channels',
            'direct_messages',
            'workspace_users',
            'workspaces',
            'users'
        ];

        // Para PostgreSQL, precisamos usar TRUNCATE com CASCADE
        if (isPostgres) {
            console.log('🐘 Usando comandos PostgreSQL...');
            
            for (const table of tables) {
                try {
                    await db.run(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
                    console.log(`  ✓ ${table}`);
                } catch (error) {
                    console.log(`  • ${table} (${error.message})`);
                }
            }
        } else {
            // SQLite
            console.log('💾 Usando comandos SQLite...');
            await db.run('PRAGMA foreign_keys = OFF');
            
            for (const table of tables) {
                try {
                    await db.run(`DELETE FROM ${table}`);
                    console.log(`  ✓ ${table}`);
                } catch (error) {
                    console.log(`  • ${table} (${error.message})`);
                }
            }
            
            await db.run('PRAGMA foreign_keys = ON');
        }

        console.log('');
        console.log('🔐 Criando usuário master...');
        
        const hashedPassword = await bcryptjs.hash(MASTER_PASSWORD, 10);

        // Para PostgreSQL, usamos RETURNING; para SQLite, lastID
        if (isPostgres) {
            const result = await db.get(
                'INSERT INTO users (name, email, password, status) VALUES ($1, $2, $3, $4) RETURNING id',
                [MASTER_NAME, MASTER_EMAIL, hashedPassword, 'online']
            );
            console.log(`✅ Master criado (ID: ${result.id})`);
        } else {
            const result = await db.run(
                'INSERT INTO users (name, email, password, status) VALUES (?, ?, ?, ?)',
                [MASTER_NAME, MASTER_EMAIL, hashedPassword, 'online']
            );
            console.log(`✅ Master criado (ID: ${result.lastID})`);
        }

        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ RESET CONCLUÍDO COM SUCESSO!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('📊 Estado do Banco:');
        console.log('   Usuários: 1 (master)');
        console.log('   Workspaces: 0');
        console.log('   Mensagens: 0');
        console.log('');
        console.log('🔐 Credenciais Master:');
        console.log('   Email: kalebe.caldas@hotmail.com');
        console.log('   Senha: mxskqgltne');
        console.log('');
        console.log('🔗 Próximo Passo:');
        console.log('   Acesse: https://sua-app.railway.app/login');
        console.log('   E faça login com as credenciais acima');
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('');
        console.error('❌ ERRO ao resetar banco:', error.message);
        console.error('');
        console.error('Stack:', error.stack);
        throw error;
    }
}

// Executar
resetRailwayDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
