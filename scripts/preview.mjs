#!/usr/bin/env zx

const pkg = await fs.readJson('./package.json')
const vsixPath = `${pkg.name}-${pkg.version}.vsix`
const extensionId = pkg.publisher + '.' + pkg.name

await $`npm run build`
await $`code --uninstall-extension ${extensionId}`
await $`code --install-extension ${vsixPath}`

console.log('✨', chalk.green.bold(vsixPath + ' installed.'))