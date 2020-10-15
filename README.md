# check-license-header

[![Test Status](https://github.com/viperproject/check-license-header/workflows/build-test/badge.svg?branch=main)](https://github.com/viperproject/check-license-header/actions?query=workflow%3Abuild-test+branch%3Amain)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](./LICENSE)

GitHub action to check whether all files have a specified copyright license header.

## Usage
```
- name: Check license headers
  uses: viperproject/check-license-header@v1
  env:
    # This token is provided by Actions, you do not need to create your own token
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Inputs

### Outputs

## Create a new Release
1. Checkout this repository
2. Create a new release branch (replace `v1`): `git checkout -b releases/v1`
3. Run `npm run package`
4. Force add the dist folder: `git add -f dist`
5. Commit: `git commit -m "<commit message>`
6. Push release branch: `git push`
7. Create a GitHub release with a tag, e.g. `v1.0.0`
8. Move the major tag (e.g. `v1`) to the latest release:
```
git tag -fa v1 -m "Update v1 tag"
git push origin v1 --force
```

[More information](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)
