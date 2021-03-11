// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2011-2020 ETH Zurich.

import * as path from 'path';
import * as assert from 'assert';
import * as fs from 'fs';
import * as tmp from 'tmp';
import {
    checkLicensesWithConfig,
    CheckResult,
    checkLicenses,
    getUncoveredFiles,
    filterFailures
} from '../src/check';
import Config from '../src/Config';

const FILES_PATH = path.join(__dirname, 'data', 'files');
const HEADERS_PATH = path.join(__dirname, 'data', 'headers');

test('test check outdated license', async () => {
    const filename = 'mplv2-2019.scala';
    const config: Config = [
        {
            include: [filename],
            license: path.join(HEADERS_PATH, 'MPLv2.txt')
        }
    ];
    const results = await checkLicensesWithConfig(FILES_PATH, config);
    assert.strictEqual(results.length, 1);
    // %year% matches any year, doesn't have to be the current one
    assert.strictEqual(results[0].success, true);
    assert.strictEqual(
        results[0].filePath,
        path.join(FILES_PATH, filename)
    );
});

test('test check license with current year', async () => {
    const filename = 'mplv2-year.scala';

    const transform = (origContent: string) => {
        const currentYear = new Date().getFullYear();
        return origContent.replace('%year%', currentYear.toString());
    };
    const config: Config = [
        {
            include: [filename],
            license: path.join(HEADERS_PATH, 'MPLv2.txt')
        }
    ];
    const {
        tmpFolderPath: tmpFolderPath,
        result: result
    } = await runTestInTmpDir(filename, FILES_PATH, transform, config);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.filePath, path.join(tmpFolderPath, filename));
});

test('test check file with wrong license', async () => {
    const filename = 'cc0.gobra';
    const config: Config = [
        {
            include: [filename],
            license: path.join(HEADERS_PATH, 'MPLv2.txt')
        }
    ];
    const results = await checkLicensesWithConfig(FILES_PATH, config);
    assert.strictEqual(results.length, 1);
    // %year% matches any year, doesn't have to be the current one
    assert.strictEqual(results[0].success, false);
    assert.strictEqual(
        results[0].filePath,
        path.join(FILES_PATH, filename)
    );
});

/**
 * Creates a temporary directory and copies the file with 'filename' in 'origFolderPath' into the temp directory. Optionally, a transformation is applied on the content.
 * The resulting file in the temporary directory will have the same filename as the original one.
 * The function returns the path to the temporary folder (although it won't exist anymore) as well as the check result (the check runs in the temp directory)
 */
async function runTestInTmpDir(
    filename: string,
    origFolderPath: string,
    transformContent: ((origContent: string) => string) | null,
    config: Config
): Promise<{tmpFolderPath: string; result: CheckResult}> {
    // create a temporary directory
    const tmpDir = tmp.dirSync({unsafeCleanup: true});
    try {
        const origFile = path.join(origFolderPath, filename);
        const destFile = path.join(tmpDir.name, filename);
        if (transformContent) {
            const origContent = fs.readFileSync(origFile, 'utf8');
            const transformedContent = transformContent(origContent);
            fs.writeFileSync(destFile, transformedContent);
        } else {
            fs.copyFileSync(origFile, destFile);
        }

        // run now the check:
        const results = await checkLicensesWithConfig(tmpDir.name, config);
        assert.strictEqual(results.length, 1);
        return {tmpFolderPath: tmpDir.name, result: results[0]};
    } finally {
        // mark the temporary directory as safe to be deleted:
        tmpDir.removeCallback();
    }
}

test('all files in this repository should be covered', async () => {
    const workingDir = path.join(__dirname, '..');
    const configFile = path.join(
        __dirname,
        '..',
        '.github',
        'license-check',
        'license-config.json'
    );
    const results = await checkLicenses(workingDir, configFile);
    const failures = filterFailures(results);
    assert.strictEqual(failures.length, 0);
    const missingFiles = await getUncoveredFiles(workingDir, configFile);
    assert.strictEqual(missingFiles.length, 0);
});
