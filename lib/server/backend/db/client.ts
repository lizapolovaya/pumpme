import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { SQLITE_MIGRATIONS } from './migrations';

type SQLiteDatabase = InstanceType<typeof Database>;

let database: SQLiteDatabase | null = null;

export function getSqlitePath(): string {
    if (process.env.PUMPME_SQLITE_PATH) {
        return process.env.PUMPME_SQLITE_PATH;
    }

    if (process.env.VERCEL === '1') {
        return path.join(os.tmpdir(), 'pumpme.sqlite');
    }

    return path.join(process.cwd(), 'data', 'pumpme.sqlite');
}

export function getDatabase(): SQLiteDatabase {
    if (database) {
        return database;
    }

    const sqlitePath = getSqlitePath();
    fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });

    database = new Database(sqlitePath);
    database.pragma('foreign_keys = ON');
    database.pragma('journal_mode = WAL');

    runMigrations(database);

    return database;
}

export function closeDatabase(): void {
    if (!database) {
        return;
    }

    database.close();
    database = null;
}

function runMigrations(db: SQLiteDatabase): void {
    db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id TEXT PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);

    const appliedMigrationRows = db
        .prepare('SELECT id FROM schema_migrations')
        .all() as Array<{ id: string }>;
    const appliedMigrationIds = new Set(appliedMigrationRows.map((row) => row.id));
    const insertMigration = db.prepare('INSERT INTO schema_migrations (id) VALUES (?)');

    const applyMigration = db.transaction((migrationId: string, sql: string) => {
        db.exec(sql);
        insertMigration.run(migrationId);
    });

    for (const migration of SQLITE_MIGRATIONS) {
        if (appliedMigrationIds.has(migration.id)) {
            continue;
        }

        applyMigration(migration.id, migration.sql);
    }
}
