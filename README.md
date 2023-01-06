# check-license-header

[![Test Status](https://github.com/viperproject/check-license-header/workflows/build-test/badge.svg?branch=main)](https://github.com/viperproject/check-license-header/actions?query=workflow%3Abuild-test+branch%3Amain)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](./LICENSE)

GitHub action to check whether all files have a specified copyright license header.

## Usage
```
- name: Check license headers
  uses: viperproject/check-license-header@v2
  with:
    path: <working directory>
    config: <path to JSON config file>
    strict: <boolean indicating whether files not covered by the configuration should be reported as errors>
```

### Config File
This is an example for a config file:
```
[
    {
        "include": [
            "**/*.ts"
        ],
        "exclude": [
            "src/test/main.test.ts",
            "node_modules/**"
        ],
        "license": "./.github/license-check/header-ETH-MPLv2.txt"
    },
    {
        "include": [
            "node_modules/**"
        ]
    }
]
```
Multiple config 'blocks' can be declared. A config block has to have the `include` field specifying an array of glob patterns.
`exclude` optionally defines glob patterns for files that would be included but should be ignored.
`license` is another optional field specifying the path to the file containing the license header that the specified files should have. 
The path can either be absolute or relative to the input argument `path`.
Specifying no `license` field means that the licenses for these files do not matter.
In particular, warnings are emitted for files that are not covered by any pattern.
In the example above, no header check is performed for files in the folder "node_modules" and in addition no warning is emitted for them.

Currently, two special patterns are supported in files containing a license header:
- `%regexp:\d{x}%` gets translated to a regex that matches 'x' digits. This can for example be used to specify the year in which the file was created.
- `%year%` is similar and will be translated to a regex matching 4 digits. Although it's typically used to express the current year, the checks do not enforce that the actual headers contain the current year. Therefore, this is currently equivalent to `%regexp:\d{4}%`

## Run with CLI
`npx github:viperproject/check-license-header#v1 check --config <path to config>` can be used to locally run the checks.

## Create a new Release
1. Checkout this repository and pull remote changes `git pull`
2. Checkout or create a release branch (replace `v2` with the major version number): 
  - `git checkout releases/v2; git pull origin main` or 
  - `git checkout -b releases/v2`
3. Run `rm -rf dist; rm -rf node_modules; npm ci`
4. Run `npm run package`
5. Force add the dist folder: `git add -f dist`
6. Commit: `git commit -m "<commit message>`
7. Push release branch: `git push`
8. Create a GitHub release with a tag, e.g. `v2.0.0`
9. Move the major tag (e.g. `v2`) to the latest release:
```
git tag -fa v2 -m "Update v2 tag"
git push origin v2 --force
```

[More information](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)
