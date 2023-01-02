// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2011-2020 ETH Zurich.

import * as yargs from 'yargs';
import {checkLicenses, filterFailures, getUncoveredFiles} from './check';
import {spawnSync} from 'child_process';
import {findFiles} from './find';

// entry point for the binary version, e.g. when locally running it using `npx`

// turn no-console es-lint errors off for this file:
/* eslint no-console: 0 */
async function run(): Promise<void> {
    try {
        const argv = await yargs
            .usage('Usage: $0 <command> [options]')
            .command('check', 'Check license headers', function (y) {
                return y
                    .option('strict', {
                        description:
                            'Specifies whether files not covered by the configuration should be treated as errors',
                        type: 'boolean',
                        default: false
                    })
                    .option('gitignore', {
                        description: 'Ignore git-ignored files',
                        type: 'boolean',
                        default: false
                    });
            })
            .example(
                '$0 check --config config.js',
                'Check license headers using configuration stored in config.js'
            )
            .command(
                'update',
                'Update license headers. Currently, only updating "%year%" to the current year is supported'
            )
            // at least one command is required
            .demand(1, 'Please specify one of the commands!')
            .strict()
            // both command use the following two options:
            .option('c', {
                alias: 'config',
                type: 'string',
                demand: 'Please specify path to config file',
                nargs: 1,
                describe: 'Path to JSON config file',
                global: true
            })
            .option('path', {
                description: 'Path to working directory',
                type: 'string',
                default: process.cwd(),
                global: true
            })
            .help('h')
            .alias('h', 'help').argv;

        const path: string = argv.path;
        const configPath: string = argv.c;
        if (argv._.length === 1 && argv._[0] === 'check') {
            const strictMode: boolean = argv.strict;
            const gitignore: boolean = argv.gitignore;
            return check(path, configPath, strictMode, gitignore);
        } else {
            console.error(`unknown command specified, has to be 'check'`);
            process.exit(1);
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

async function check(
    path: string,
    configPath: string,
    strictMode: boolean,
    gitignore: boolean
): Promise<void> {
    const filter = gitignore ? await createFilterGitIgnored(path) : () => true;
    const results = await checkLicenses(path, configPath, filter);
    const errors = filterFailures(results);
    const missedFiles = await getUncoveredFiles(path, configPath, filter);

    // emit a warning for all missed files:
    for (const missedFile of missedFiles) {
        console.warn(`Config does not cover the file '${missedFile}'`);
    }

    // emit an error for all erroneous files:
    for (const error of errors) {
        console.error(error.message);
    }

    if (strictMode) {
        console.error(
            `${errors.length} error(s) and ${missedFiles.length} warning(s) found. Warnings are treated as errors.`
        );
        process.exit(errors.length === 0 && missedFiles.length === 0 ? 0 : 1);
    } else if (errors.length !== 0) {
        console.error(`${errors.length} error(s) found`);
        process.exit(1);
    } else {
        console.info(
            `${errors.length} error(s) and ${missedFiles.length} warning(s) found.`
        );
        process.exit(0);
    }
}

async function createFilterGitIgnored(
    path: string
): Promise<(p: string) => boolean> {
    const files = await findFiles(path, ['**'], []);

    function* chunks<T>(arr: T[], len: number): Generator<T[]> {
        for (let i = 0; i < arr.length; i += len) {
            yield arr.slice(i, i + len);
        }
    }

    const ignoredFiles = new Set<string>();

    for (const chunked of chunks(files, 100)) {
        const stdin = chunked.reduce((x, y) => `${x}\0${y}`);

        const result = spawnSync('git', ['check-ignore', '-z', '--stdin'], {
            input: Buffer.from(stdin, 'utf8'),
            stdio: ['pipe', 'pipe', 'inherit'],
            encoding: 'utf-8',
            cwd: path
        });

        for (const p of result.stdout.split('\0')) {
            ignoredFiles.add(p);
        }
    }

    return p => !ignoredFiles.has(p);
}

run();
