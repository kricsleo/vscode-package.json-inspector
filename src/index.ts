import { window, ExtensionContext, languages, CancellationToken, Position, TextDocument, Hover, Location, Uri } from 'vscode'
import { dirname } from 'path'
import { constants } from 'fs'
import { access } from 'fs/promises'

export function activate(context: ExtensionContext) {
  console.log('vscode-package.json234 inspector start');
  window.showInformationMessage('Hello, vscode-package.json inspector!')
  context.subscriptions.push(
    // provide right-click to node_modules/
    languages.registerDefinitionProvider(
      [{ language: 'json', pattern: '**/package.json'}, { language: 'jsonc', pattern: '**/package.json'}],
      { provideDefinition }
    ),
    // provide hover detail
    // languages.registerHoverProvider('json', { provideHover })
  )
}

async function provideDefinition(
  document: TextDocument,
  position: Position,
  token: CancellationToken
) {
  if(!isPkgJSON(document.fileName)) {
    return null
  }
  const safeDependencyWordRange = document.getWordRangeAtPosition(
    position,
    // reg: "lodash", (including prefix and suffix quotation marks to make it more accurate)
    new RegExp('"(?:@[a-z0-9-*~][a-z0-9-*._~]*/)?[a-z0-9-~][a-z0-9-._~]*"')
  )
  const dependencyName = document.getText(safeDependencyWordRange).replace(/"/g, '')
  const currentDir = dirname(document.fileName)
  const dependencyPkgJSON = `${currentDir}/node_modules/${dependencyName}/package.json`
  const isDependencyExsit = await access(dependencyPkgJSON, constants.R_OK)
    .then(() => true)
    .catch(() => false)
    console.log('isDependencyExsit', dependencyName, dependencyPkgJSON, isDependencyExsit)
  if(isDependencyExsit) {
    return new Location(
      Uri.file(dependencyPkgJSON),
      new Position(0, 0)
    );
//     const dependencyPkg = await import(dependencyPkgJSON)
//     const content =
// `### ${dependencyPkg.name}
// ${dependencyPkg.description || 'No description.'}
// current version: ${dependencyPkg.version}
// `
//       return new Hover(content)
  }
}

function provideHover(
  document: TextDocument,
  position: Position,
  token: CancellationToken
) {

}

function isPkgJSON(filename: string) {
  return /\/?package\.json$/.test(filename)
} 

