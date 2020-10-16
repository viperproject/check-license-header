// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2011-2020 ETH Zurich.

import * as path from 'path';
import {glob} from 'glob';

export async function findFiles(
    cwd: string,
    includePatterns: string[],
    excludePatterns: string[]
): Promise<string[]> {
    let includePattern: string;
    if (includePatterns.length === 0) {
        return Promise.resolve([]);
    } else if (includePatterns.length === 1) {
        includePattern = includePatterns[0];
    } else {
        includePattern = `{${includePatterns.join(',')}}`;
    }

    const options = {
        ignore: excludePatterns,
        cwd,
        nodir: true // only return files (no directories)
    };
    const files = await new Promise<string[]>((resolve, reject) => {
        glob(includePattern, options, (err, matches) => {
            if (err == null) {
                resolve(matches);
            } else {
                reject(
                    new Error(
                        `scanning files has failed with error '${err.message}'`
                    )
                );
            }
        });
    });
    // files are relative to cwd, hence join them:
    return files.map(f => path.join(cwd, f));
}
/*
async function getFilesRecursively(path: string): Promise<string[]> {
    const dirContent = await readdir(path);
    const stats = await Promise.all(dirContent.map(stat));
    const dirs = stats.filter(stat => stat.isDir);
    const files = stats.filter(stat => stat.isFile)
        .map(stat => stat.path);

    const recursiveFiles = await Promise.all(dirs.map(dir => getFilesRecursively(dir.path)))
        .then(flatten);
    return files.concat(recursiveFiles);
}

function readdir(path: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err == null) {
                resolve(files);
            } else {
                reject(new Error(`reading directory ${path} failed with error ${err.message}`));
            }
        });
    })
}

function stat(path: string): Promise<Status> {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err == null) {
                resolve({path: path, isDir: stats.isDirectory(), isFile: stats.isFile()});
            } else {
                reject(new Error(`getting file status for ${path} failed with error ${err.message}`));
            }
        })
    })
}

interface Status {
    path: string;
    isDir: boolean;
    isFile: boolean;
}

function flatten<T>(matrix: T[][]): T[] {

}
*/
