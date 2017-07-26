```
███╗   ██╗ ██████╗ ██████╗ ███████╗██╗     ██╗      █████╗ 
████╗  ██║██╔═══██╗██╔══██╗██╔════╝██║     ██║     ██╔══██╗
██╔██╗ ██║██║   ██║██║  ██║█████╗  ██║     ██║     ███████║
██║╚██╗██║██║   ██║██║  ██║██╔══╝  ██║     ██║     ██╔══██║
██║ ╚████║╚██████╔╝██████╔╝███████╗███████╗███████╗██║  ██║
╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝
```

Test Node.js version upgrades on your code

# Installation

```bash
$ npm install --global nodella
```

# Usage

```bash
Usage: nodella --manager=[npm|yarn] [options]

Options:
  --help, -h     Show help                                             [boolean]
  --build        Build script name                            [default: "build"]
  --log          Log level         [choices: "debug", "info"] [default: "debug"]
  --manager      Package manager             [required] [choices: "npm", "yarn"]
  --no-build     Skip the build script                [boolean] [default: false]
  --target       Target Node.js version                      [default: "latest"]
  --test         Test script name                              [default: "test"]
  --version, -v  Show version number                                   [boolean]
```

You may need to run this as an administrator or privileged user in order to suppress security warnings from your operating system. This is essential for automated checks.

# Requirements

You must must have `nvm` installed and available on the `PATH`