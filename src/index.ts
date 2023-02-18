import { ExtensionContext, languages, Position, TextDocument, Hover, Location, Uri, LocationLink, Range } from 'vscode'
import { dirname } from 'path'
import { constants } from 'fs'
import { access } from 'fs/promises'

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
  const content =
`${dependencyPkg.name}\n
${dependencyPkg.description || 'No description.'}\n
current version: ${dependencyPkg.version}
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
  const dependencyWordRange = document.getWordRangeAtPosition(
    position,
    new RegExp(pkgNameRule)
  )
  const dependencyName = document.getText(safeDependencyWordRange).replace(/"/g, '')
  const currentDir = dirname(document.fileName)
  const dependencyPkgJSON = `${currentDir}/node_modules/${dependencyName}/package.json`
  const isDependencyExsit = await access(dependencyPkgJSON, constants.R_OK)
    .then(() => true)
    .catch(() => false)
  return { path: dependencyPkgJSON, exsit: isDependencyExsit, range: dependencyWordRange }
}
