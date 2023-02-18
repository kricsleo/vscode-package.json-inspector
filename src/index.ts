import { window } from 'vscode'

export function activate() {
  console.log('vscode-package.json inspector start');
  window.showInformationMessage('Hello, vscode-package.json inspector!')
}

export function deactivate() {

}
