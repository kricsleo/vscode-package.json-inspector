import { ExtensionContext, languages, Position, TextDocument, Hover, Location, Uri, LocationLink, Range } from 'vscode'
import { dirname } from 'path'
import { constants } from 'fs'
import { access } from 'fs/promises'
import { exec } from 'child_process'
import { ofetch } from 'ofetch'

export function activate(context: ExtensionContext) {
  console.log('vscode-package.json-inspector start');
  const selector = [{ language: 'json', pattern: '**/package.json'}, { language: 'jsonc', pattern: '**/package.json'}]
  context.subscriptions.push(
    // provide hover detail
    languages.registerHoverProvider(selector, { provideHover }),
    // provide right-click to node_modules/
    languages.registerDefinitionProvider(selector, { provideDefinition }),
  )
}

async function provideDefinition(document: TextDocument, position: Position) {
  console.log('vscode-package.json-inspector definition');
  const dependency = await getDependencyPath(document, position)
  if(!dependency || !dependency.exsit) {
    return null
  }
  return <LocationLink[]>[{
    originSelectionRange: dependency.range,
    targetUri: Uri.file(dependency.path),
    targetRange: new Range(new Position(0, 0), new Position(0, 0))
  }]
}

async function provideHover(document: TextDocument, position: Position) {
  console.log('vscode-package.json-inspector hovering');
  const dependency = await getDependencyPath(document, position)
  if(!dependency || !dependency.exsit) {
    return null
  }
  const dependencyPkg = require(dependency.path)
  const [latestDependencyPkg, dependencyBundlePhobia] = await Promise.all([
    getLatestPkg(dependency.name, dependency.dir).catch(() => null),
    getBundlePhobiaPkg(`${dependency.name}@${dependencyPkg.version}`).catch((e) => {
      console.log('e', e)

    }),
  ])

  const content =
`${dependencyPkg.name}\n
${dependencyPkg.description || 'No description.'}\n
min+gzip: ${dependencyBundlePhobia?.gzip ? formatByteSize(dependencyBundlePhobia.gzip) : 'unknown'}\n
|         | current | latest |
|---------|---------|--------|
| version | ${dependencyPkg.version}  | ${latestDependencyPkg.version}  |
`
  return new Hover(content, dependency.range)
}

async function getDependencyPath(document: TextDocument, position: Position) {
  const pkgNameRule = '(?:@[a-z0-9-*~][a-z0-9-*._~]*/)?[a-z0-9-~][a-z0-9-._~]*'
  const safeDependencyWordRange = document.getWordRangeAtPosition(
    position,
    // reg: "lodash", (including prefix and suffix quotation marks to make it more accurate)
    new RegExp(`"${pkgNameRule}"`)
  )
  if(!safeDependencyWordRange) {
    return null
  }
  const dependencyWordRange = new Range(
    new Position(safeDependencyWordRange.start.line, safeDependencyWordRange.start.character + 1),
    new Position(safeDependencyWordRange.end.line, safeDependencyWordRange.end.character - 1)
  )
  const dependencyName = document.getText(safeDependencyWordRange).replace(/"/g, '')
  const cwd = dirname(document.fileName)
  const dependencyDir = `${cwd}/node_modules/${dependencyName}`
  const dependencyPkgJSON = `${dependencyDir}/package.json`
  const isDependencyExsit = await access(dependencyPkgJSON, constants.R_OK)
    .then(() => true)
    .catch(() => false)
  return {
    cwd,
    name: dependencyName,
    dir: dependencyDir,
    path: dependencyPkgJSON,
    exsit: isDependencyExsit, 
    range: dependencyWordRange 
  }
}

async function getLatestPkg(pkg: string, cwd: string) {
  const registry = await getNpmRegistry(cwd).catch(() => null)
  if(!registry) {
    return null
  }
  const pkgJSON = await ofetch(`/${pkg}/latest`, { 
    baseURL: registry, 
    headers: {
      // todo: fetch smallest metadata
      // @see https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md#abbreviated-metadata-format
      // Accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*'
    },
    retry: 0
  })
  return pkgJSON
}

async function getNpmRegistry(cwd: string) {
  const registry = await new Promise<string>((rs, rj) => {
    exec('npm config get registry', {cwd}, (e: Error | null, output: string) => {
      e ? rj(e) : rs(output.trim())
    })
  })
  return registry
}

/** bundlephobia only supports npmjs.com packages */
async function getBundlePhobiaPkg(pkg: string) {
  const result = await ofetch(`https://bundlephobia.com/api/size?package=${pkg}&record=true`)
  return result
}

/** size unit: B */
function formatByteSize(size: number) {
  if (Math.log10(size) < 3) {
    return size + 'B'
  } else if (Math.log10(size) < 6) {
    return Math.round(size / 1024) + 'kB'
  } else {
    return Math.round(size/1024/1024) + 'MB'
  }
}
