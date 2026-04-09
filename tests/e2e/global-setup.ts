import fs from 'node:fs';
import path from 'node:path';

export default async function globalSetup() {
    const dir = path.join(process.cwd(), '.playwright');
    const sqlitePath = path.join(dir, 'pumpme-e2e.sqlite');

    fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(sqlitePath)) {
        fs.rmSync(sqlitePath);
    }
}
