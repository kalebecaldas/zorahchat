const { Client } = require('pg');

const REQUIRED_TABLES = {
    users: `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            avatar_url TEXT,
            status TEXT DEFAULT 'online',
            status_message TEXT,
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `,
    workspaces: `
        CREATE TABLE IF NOT EXISTS workspaces (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            avatar_url TEXT,
            owner_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id)
        )
    `,
    workspace_users: `
        CREATE TABLE IF NOT EXISTS workspace_users (
            workspace_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            role TEXT DEFAULT 'member',
            permissions TEXT DEFAULT 'read,write',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (workspace_id, user_id),
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `,
    channels: `
        CREATE TABLE IF NOT EXISTS channels (
            id SERIAL PRIMARY KEY,
            workspace_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            type TEXT DEFAULT 'public',
            created_by INTEGER,
            is_default BOOLEAN DEFAULT false,
            is_private BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    `,
    direct_messages: `
        CREATE TABLE IF NOT EXISTS direct_messages (
            id SERIAL PRIMARY KEY,
            workspace_id INTEGER NOT NULL,
            user1_id INTEGER NOT NULL,
            user2_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
            FOREIGN KEY (user1_id) REFERENCES users(id),
            FOREIGN KEY (user2_id) REFERENCES users(id),
            UNIQUE(workspace_id, user1_id, user2_id)
        )
    `,
    messages: `
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            channel_id INTEGER,
            dm_id INTEGER,
            user_id INTEGER NOT NULL,
            content TEXT,
            attachment_url TEXT,
            attachment_type TEXT,
            attachment_name TEXT,
            has_mentions BOOLEAN DEFAULT false,
            file_size INTEGER,
            file_dimensions TEXT,
            edited_at TIMESTAMP,
            deleted_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (channel_id) REFERENCES channels(id),
            FOREIGN KEY (dm_id) REFERENCES direct_messages(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `,
    mentions: `
        CREATE TABLE IF NOT EXISTS mentions (
            id SERIAL PRIMARY KEY,
            message_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(message_id, user_id)
        )
    `,
    notifications: `
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('dm', 'mention', 'channel_invite', 'system')),
            title TEXT NOT NULL,
            content TEXT,
            link TEXT,
            read BOOLEAN DEFAULT false,
            metadata TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `,
    channel_members: `
        CREATE TABLE IF NOT EXISTS channel_members (
            id SERIAL PRIMARY KEY,
            channel_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            added_by INTEGER NOT NULL,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (added_by) REFERENCES users(id),
            UNIQUE(channel_id, user_id)
        )
    `,
    message_reactions: `
        CREATE TABLE IF NOT EXISTS message_reactions (
            id SERIAL PRIMARY KEY,
            message_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            emoji TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(message_id, user_id, emoji)
        )
    `,
    read_receipts: `
        CREATE TABLE IF NOT EXISTS read_receipts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            channel_id INTEGER,
            dm_id INTEGER,
            last_read_message_id INTEGER,
            last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (channel_id) REFERENCES channels(id),
            FOREIGN KEY (dm_id) REFERENCES direct_messages(id),
            UNIQUE(user_id, channel_id, dm_id)
        )
    `,
    workspace_join_requests: `
        CREATE TABLE IF NOT EXISTS workspace_join_requests (
            id SERIAL PRIMARY KEY,
            workspace_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(workspace_id, user_id)
        )
    `
};

async function verifyAndCreateTables() {
    console.log('=== VERIFICAÇÃO E CRIAÇÃO DE TABELAS ===\n');

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ DATABASE_URL não encontrada!');
        process.exit(1);
    }

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Conectado ao PostgreSQL\n');

        // Listar tabelas existentes
        const existingTablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        const existingTables = new Set(existingTablesResult.rows.map(r => r.table_name));
        console.log(`📋 Tabelas existentes (${existingTables.size}):`, Array.from(existingTables).join(', ') || 'nenhuma');
        console.log('');

        // Criar tabelas faltantes
        let created = 0;
        let skipped = 0;

        for (const [tableName, createSQL] of Object.entries(REQUIRED_TABLES)) {
            try {
                if (existingTables.has(tableName)) {
                    console.log(`⏭️  ${tableName}: já existe`);
                    skipped++;
                } else {
                    await client.query(createSQL);
                    console.log(`✅ ${tableName}: criada`);
                    created++;
                }
            } catch (err) {
                console.error(`❌ ${tableName}: ERRO ao criar -`, err.message);
            }
        }

        console.log(`\n📊 Resumo:`);
        console.log(`   Criadas: ${created}`);
        console.log(`   Já existiam: ${skipped}`);
        console.log(`   Total necessárias: ${Object.keys(REQUIRED_TABLES).length}`);

        // Criar índices
        console.log('\n📌 Criando índices...');
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_channel_members_channel ON channel_members(channel_id)',
            'CREATE INDEX IF NOT EXISTS idx_channel_members_user ON channel_members(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read)',
            'CREATE INDEX IF NOT EXISTS idx_mentions_message ON mentions(message_id)',
            'CREATE INDEX IF NOT EXISTS idx_mentions_user ON mentions(user_id)'
        ];

        for (const indexSQL of indexes) {
            try {
                await client.query(indexSQL);
                console.log('✅ Índice criado');
            } catch (err) {
                console.log('⏭️  Índice já existe ou erro:', err.message);
            }
        }

        console.log('\n🎉 Verificação concluída!');

    } catch (err) {
        console.error('\n❌ ERRO GERAL:', err.message);
    } finally {
        await client.end();
    }
}

verifyAndCreateTables();
