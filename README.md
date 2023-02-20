<h1 align="center">
  <img src="./icon.png" alt="logo" width="128" />
  <p>Npm package.json Inspector for VS Code</p>
</h1>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=kricsleo.vscode-package-json-inspector" target="_blank"><img src="https://img.shields.io/visual-studio-marketplace/v/kricsleo.vscode-package-json-inspector?label=VS%20Code%20Marketplace&logo=visual-studio-code&style=for-the-badge" alt="Visual Studio Marketplace Version"></a>
</p>

## Preview

### Hover to see metadata of package

<p align="center">
  <img src="./screenshot/hover.png" alt="preview hover" width="600" />
</p>

- `title`: with a link if the package provide the `homepage` field
- `description`: hidden if no description
- `entry`: entry file of package(`main`/`module`/`types` or `typings`)
- `version`: currently using and the latest version
- `bundle info`: `size`/`tree shakeable` .etc. , only for public npm packages(powered by [bundlephobia.com](https://bundlephobia.com))

### **<kbd>cmd</kbd> + click** to goto node_modules

<p align="center">
  <img src="./screenshot/click.gif" alt="preview click" width="600" />
</p>

## Install

👉 Install it in the [marketplace of VS Code](https://marketplace.visualstudio.com/items?itemName=kricsleo.vscode-package-json-inspector)


## License

[MIT](./LICENSE) License © 2023 [Kricsleo](https://github.com/kricsleo)
