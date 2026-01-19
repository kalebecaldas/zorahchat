const { Pool } = require('pg');

class PostgresAdapter {
    constructor(connectionString) {
        this.pool = new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false } // Required for Railway/Heroku
        });
        console.log('[DB ADAPTER] Initialized PostgreSQL connection');
    }

    // Convert SQLite '?' placeholders to Postgres '$1, $2...'
    _normalizeQuery(sql) {
        let i = 1;
        let converted = sql.replace(/\?/g, () => `$${i++}`);

        // Fix Common SQLite vs Postgres Syntax differences

        // 1. AUTOINCREMENT -> GENERATED ALWAYS AS IDENTITY (Handled in schema creation, not here)
        // 2. DATETIME DEFAULT CURRENT_TIMESTAMP -> checks usually handled in DDL

        // Tables without 'id' column (composite primary keys)
        const TABLES_WITHOUT_ID = ['workspace_users'];

        // Handle INSERT ... RETURNING id for lastID compatibility
        if (converted.trim().toUpperCase().startsWith('INSERT')) {
            // Remove trailing semicolon if present
            converted = converted.trim().replace(/;+$/, '');

            // Check if this is a table without id column
            const hasTableWithoutId = TABLES_WITHOUT_ID.some(table =>
                converted.toLowerCase().includes(`insert into ${table}`)
            );

            // Only add RETURNING if not already present AND table has id column
            if (!hasTableWithoutId && !converted.toUpperCase().includes('RETURNING')) {
                converted += ' RETURNING id';
            }
        }

        return converted;
    }

    async exec(sql) {
        const client = await this.pool.connect();
        try {
            await client.query(sql);
            return true;
        } finally {
            client.release();
        }
    }

    async run(sql, params = []) {
        const normalized = this._normalizeQuery(sql);
        console.log('[DB ADAPTER] RUN Query:', normalized);
        console.log('[DB ADAPTER] RUN Params:', params);

        const client = await this.pool.connect();
        try {
            const result = await client.query(normalized, params);

            // Emulate SQLite 'run' return object
            const returnValue = {
                lastID: result.rows[0]?.id || result.rows[0]?.ID || 0,
                changes: result.rowCount
            };

            console.log('[DB ADAPTER] RUN Result:', returnValue);
            return returnValue;
        } catch (err) {
            // Silenciar erros comuns esperados (migrações)
            const expectedErrors = ['already exists', 'duplicate column'];
            const isExpectedError = expectedErrors.some(msg => err.message.toLowerCase().includes(msg));

            if (!isExpectedError) {
                console.error('[DB ADAPTER] RUN ERROR:', err.message);
                console.error('[DB ADAPTER] Failed Query:', normalized);
                console.error('[DB ADAPTER] Failed Params:', params);
            }
            throw err;
        } finally {
            client.release();
        }
    }

    async get(sql, params = []) {
        const normalized = this._normalizeQuery(sql);
        const client = await this.pool.connect();
        try {
            const result = await client.query(normalized, params);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async all(sql, params = []) {
        const normalized = this._normalizeQuery(sql);
        const client = await this.pool.connect();
        try {
            const result = await client.query(normalized, params);
            return result.rows;
        } finally {
            client.release();
        }
    }

    async close() {
        await this.pool.end();
    }
}

module.exports = PostgresAdapter;
