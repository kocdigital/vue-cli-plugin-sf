# Vue CLI Plugin SF

This is a Vue CLI plugin for integrating with SF. It automates the setup of the "Mainframe" environment by downloading necessary assets and configuring your Vue project to use them during development and build.

## Features

-   **Automated Mainframe Setup**: Automatically downloads and extracts the `mainframe_xpublic.zip` from a specified URL.
-   **Webpack Configuration**: Injects the Mainframe's `index.html` as the template and sets up asset copying.
-   **Seamless Integration**: Wraps standard `vue-cli-service` commands.

## Installation

```bash
npm install --save-dev vue-cli-plugin-sf
```

## Configuration

Create a `sf.config.js` file in the root of your project to configure the plugin.

```javascript
// <projectRoot>/sf.config.js
module.exports = {
    /**
     * Pages folder name relative to `<projectRoot>/src` directory.
     * Example: If your pages are in `src/views`, set this to 'views'.
     */
    pagesFolder: 'views',

    /**
     * Base URL for the Mainframe zip file.
     * The plugin will look for `${mainFrameUrl}/mainframe_xpublic.zip`.
     */
    mainFrameUrl: 'https://example.com'
}
```

## Usage

After installation and configuration, you can use the standard Vue CLI commands. The plugin wraps these commands to perform its setup tasks.

### Development Server

```bash
vue-cli-service serve
```

**What it does:**
1.  Reads `sf.config.js`.
2.  Downloads `mainframe_xpublic.zip` from the configured `mainFrameUrl` to `node_modules/.cache/mainframe_xpublic.zip`.
3.  Extracts the zip to `node_modules/.cache/mainframe`.
4.  Updates the Webpack configuration to:
    -   Use the extracted `index.html` as the HTML template.
    -   Copy the extracted Mainframe assets to the output directory.
5.  Starts the standard Vue development server.

### Build for Production

```bash
vue-cli-service build
```

**What it does:**
1.  Executes the build process (currently wraps the standard build command).

## Project Structure

The plugin expects a standard Vue CLI project structure.

```
my-project/
├── sf.config.js        # Plugin configuration
├── package.json
├── src/
│   ├── views/          # (Or whatever you configured as pagesFolder)
│   └── ...
└── ...
```

## Under the Hood

The plugin uses `node_modules/.cache` to store the downloaded Mainframe assets, ensuring they are available for the build process without cluttering your source control.

