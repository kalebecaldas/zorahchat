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

        // Handle INSERT ... RETURNING id for lastID compatibility
        if (converted.trim().toUpperCase().startsWith('INSERT')) {
            // Remove trailing semicolon if present
            converted = converted.trim().replace(/;+$/, '');

            // Only add RETURNING if not already present
            if (!converted.toUpperCase().includes('RETURNING')) {
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
        const client = await this.pool.connect();
        try {
            const result = await client.query(normalized, params);

            // Emulate SQLite 'run' return object
            return {
                lastID: result.rows[0]?.id || result.rows[0]?.ID || 0,
                changes: result.rowCount
            };
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
