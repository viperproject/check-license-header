// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2011-2020 ETH Zurich.

import * as fs from 'fs';
import * as path from 'path';
import {Config, LicenseConfig} from './config';
import {findFiles} from './find';
import {parseConfig} from './parse';

const CURRENT_YEAR_IDENTIFIER = '%year%';

export async function checkLicenses(
    cwd: string,
    configPath: string,
    filterPath: (p: string) => boolean = () => true
): Promise<CheckResult[]> {
    const config = await getConfig(configPath);
    return checkLicensesWithConfig(cwd, config, filterPath);
}

function getConfig(configPath: string): Promise<Config> {
    const configString = fs.readFileSync(configPath, 'utf8');
    return parseConfig(configString);
}

export async function checkLicensesWithConfig(
    cwd: string,
    config: Config,
    pathFilter: (p: string) => boolean = () => true
): Promise<CheckResult[]> {
    const results = await Promise.all(
        config.map(c => checkLicense(cwd, c, pathFilter))
    );
    return flatten(results);
}

export async function getUncoveredFiles(
    cwd: string,
    configPath: string,
    pathFilter: (p: string) => boolean = () => true
): Promise<string[]> {
    const config = await getConfig(configPath);
    return getUncoveredFilesWithConfig(cwd, config, pathFilter);
}

export async function getUncoveredFilesWithConfig(
    cwd: string,
    config: Config,
    pathFilter: (p: string) => boolean = () => true
): Promise<string[]> {
    // get all files:
    const allFiles = new Set(
        (await findFiles(cwd, ['**'], [])).filter(pathFilter)
    );
    // get files covered by config:
    const converedFilesResults = await Promise.all(
        config.map(c => getFiles(cwd, c))
    );
    const coveredFiles = new Set<string>(flatten(converedFilesResults));
    const remainingFiles = setminus(allFiles, coveredFiles);
    return [...remainingFiles];
}

export function filterFailures(results: CheckResult[]): CheckFailure[] {
    return results.filter(r => !r.success).map(f => f as CheckFailure);
}

function setminus<T>(set1: Set<T>, set2: Set<T>): Set<T> {
    const copy = new Set(set1);
    for (const elem of set2) {
        copy.delete(elem);
    }
    return copy;
}

async function checkLicense(
    cwd: string,
    licenseConfig: LicenseConfig,
    pathFilter: (p: string) => boolean
): Promise<CheckResult[]> {
    if (!licenseConfig.license) {
        // no license provided
        return [];
    }
    let licensePath: string;
    if (path.isAbsolute(licenseConfig.license)) {
        licensePath = licenseConfig.license;
    } else {
        licensePath = path.join(cwd, licenseConfig.license);
    }
    const errorMessageGenerator = (file: string): string =>
        `'${file}' does not contain license from '${licensePath}'`;
    const licenseString = fs.readFileSync(licensePath, 'utf8');
    const licenseRegex = convertHeaderToRegex(licenseString);
    const files = await getFiles(cwd, licenseConfig);
    return await Promise.all(
        files
            .filter(pathFilter)
            .map(f => contains(f, licenseRegex, errorMessageGenerator))
    );
}

function getFiles(
    cwd: string,
    licenseConfig: LicenseConfig
): Promise<string[]> {
    const excludePatterns = licenseConfig.exclude || [];
    return findFiles(cwd, licenseConfig.include, excludePatterns);
}

function convertHeaderToRegex(header: string): RegExp {
    let modifiedHeader = header;

    // escape characters that have a special meaning in a regex
    // taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
    modifiedHeader = modifiedHeader.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    // replace sequences of the following form to the corresponding regex
    // "%regexp:\d{x}%" is escaped "%regexp:\\d\{x\}%" where x is a number digits
    // the corresponding regex to find this escaped sequence is "%regexp:\\\\d\\{(\d+)\\}%"
    // this character sequence should be replaced by "\d{x}"
    modifiedHeader = modifiedHeader.replace(
        /%regexp:\\\\d\\{(\d+)\\}%/g,
        '\\d{$1}'
    );

    // replace "%year%" by a regex that matches 4 digits:
    modifiedHeader = modifiedHeader.replace(CURRENT_YEAR_IDENTIFIER, '\\d{4}');
    return new RegExp(modifiedHeader);
}

function contains(
    file: string,
    regex: RegExp,
    errorMessageGenerator: (faultyFile: string) => string
): Promise<CheckResult> {
    return new Promise((resolve, reject) => {
        fs.readFile(file, 'utf8', (err, data) => {
            if (err == null) {
                // check whether data contains a match:
                if (regex.test(data)) {
                    resolve(new CheckSuccess(file));
                } else {
                    resolve(
                        new CheckFailure(file, errorMessageGenerator(file))
                    );
                }
            } else {
                reject(
                    new Error(
                        `Error while reading file '${file}': '${err.message}'`
                    )
                );
            }
        });
    });
}

function flatten<T>(matrix: T[][]): T[] {
    const res: T[] = [];
    for (const elem of matrix) {
        res.push(...elem);
    }
    return res;
}

export interface CheckResult {
    success: boolean;
    filePath: string;
}

export class CheckSuccess implements CheckResult {
    private readonly path: string;

    constructor(filePath: string) {
        this.path = filePath;
    }

    get success(): boolean {
        return true;
    }

    get filePath(): string {
        return this.path;
    }
}

export class CheckFailure implements CheckResult {
    private readonly path: string;
    private readonly msg: string;

    constructor(filePath: string, msg: string) {
        this.path = filePath;
        this.msg = msg;
    }

    get success(): boolean {
        return false;
    }

    get filePath(): string {
        return this.path;
    }

    get message(): string {
        return this.msg;
    }
}
