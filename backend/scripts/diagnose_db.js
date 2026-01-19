const { Client } = require('pg');

async function diagnose() {
    console.log('=== DIAGNÓSTICO DO BANCO ===\n');

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ DATABASE_URL não encontrada!');
        process.exit(1);
    }

    console.log('✅ DATABASE_URL encontrada');

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('✅ Conectado ao Postgres\n');

    // 1. Listar tabelas
    console.log('--- TABELAS NO BANCO ---');
    const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    `);
    console.log(tables.rows.map(r => r.table_name).join(', '));
    console.log('');

    // 2. Schema da tabela workspaces
    console.log('--- SCHEMA DA TABELA WORKSPACES ---');
    const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'workspaces'
        ORDER BY ordinal_position
    `);

    if (columns.rows.length === 0) {
        console.log('⚠️  Tabela workspaces não existe!');
    } else {
        columns.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}) ${col.column_default || ''}`);
        });
    }
    console.log('');

    // 3. Testar INSERT
    console.log('--- TESTE DE INSERT ---');
    try {
        const testResult = await client.query(`
            INSERT INTO workspaces (name, slug, owner_id) 
            VALUES ($1, $2, $3) 
            RETURNING id, name
        `, ['Test Workspace', 'test-workspace-' + Date.now(), 1]);

        console.log('✅ INSERT bem-sucedido!');
        console.log('ID retornado:', testResult.rows[0].id);
        console.log('Nome:', testResult.rows[0].name);

        // Limpar o teste
        await client.query('DELETE FROM workspaces WHERE id = $1', [testResult.rows[0].id]);
        console.log('✅ Teste limpo (workspace deletado)');
    } catch (err) {
        console.error('❌ Erro no INSERT:', err.message);
    }

    await client.end();
}

diagnose().catch(console.error);
