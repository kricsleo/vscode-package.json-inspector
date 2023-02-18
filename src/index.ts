import { window, ExtensionContext, languages, CancellationToken, Position, TextDocument, Hover, Location, Uri } from 'vscode'
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
  const dependency = await getDependencyPath(document, position)
  if(!dependency || !dependency.exsit) {
    return null
  }
  return new Location(
    Uri.file(dependency.path),
    new Position(0, 0)
  );
}

async function provideHover(document: TextDocument, position: Position) {
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
  return new Hover(content)
}

async function getDependencyPath(document: TextDocument, position: Position) {
  // if(!isPkgJSON(document.fileName)) {
  //   return null
  // }
  const safeDependencyWordRange = document.getWordRangeAtPosition(
    position,
    // reg: "lodash", (including prefix and suffix quotation marks to make it more accurate)
    new RegExp('"(?:@[a-z0-9-*~][a-z0-9-*._~]*/)?[a-z0-9-~][a-z0-9-._~]*"')
  )
  if(!safeDependencyWordRange) {
    return null
  }
  const dependencyName = document.getText(safeDependencyWordRange).replace(/"/g, '')
  const currentDir = dirname(document.fileName)
  const dependencyPkgJSON = `${currentDir}/node_modules/${dependencyName}/package.json`
  const isDependencyExsit = await access(dependencyPkgJSON, constants.R_OK)
    .then(() => true)
    .catch(() => false)
  return { path: dependencyPkgJSON, exsit: isDependencyExsit }
}

function isPkgJSON(filename: string) {
  return /\/?package\.json$/.test(filename)
} 

