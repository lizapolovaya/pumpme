import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { getSqlitePath } from '../../lib/server/backend/db';

test('getSqlitePath prefers explicit env override', () => {
    const originalPath = process.env.PUMPME_SQLITE_PATH;
    const originalVercel = process.env.VERCEL;

    process.env.PUMPME_SQLITE_PATH = '/custom/pumpme.sqlite';
    process.env.VERCEL = '1';

    assert.equal(getSqlitePath(), '/custom/pumpme.sqlite');

    if (originalPath === undefined) {
        delete process.env.PUMPME_SQLITE_PATH;
    } else {
        process.env.PUMPME_SQLITE_PATH = originalPath;
    }

    if (originalVercel === undefined) {
        delete process.env.VERCEL;
    } else {
        process.env.VERCEL = originalVercel;
    }
});

test('getSqlitePath uses temp storage on Vercel by default', () => {
    const originalPath = process.env.PUMPME_SQLITE_PATH;
    const originalVercel = process.env.VERCEL;

    delete process.env.PUMPME_SQLITE_PATH;
    process.env.VERCEL = '1';

    assert.equal(getSqlitePath(), path.join(os.tmpdir(), 'pumpme.sqlite'));

    if (originalPath === undefined) {
        delete process.env.PUMPME_SQLITE_PATH;
    } else {
        process.env.PUMPME_SQLITE_PATH = originalPath;
    }

    if (originalVercel === undefined) {
        delete process.env.VERCEL;
    } else {
        process.env.VERCEL = originalVercel;
    }
});
