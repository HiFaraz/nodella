#!/usr/bin/env node

/**
 * Nodella
 * Copyright(c) 2017 Faraz Syed
 * MIT Licensed
 * 
 * ASCII art credits: http://patorjk.com/software/taag
 */

'use strict';

/**
 * TODOs
 * Detect Node version from package.json engines
 * Write new Node version to package.json engines
 * Re-install self as global module?
 */

/**
 * Module dependencies
 */
const colors = require('colors/safe');
const exec = require('child_process').exec;
const request = require('request-promise');
const rimraf = require('rimraf');
const semver = require('semver');
const yargs = require('yargs');

/**
 * Configuration
 */
colors.setTheme({
  data: 'grey',
  debug: 'blue',
  error: 'red',
  help: 'cyan',
  info: 'green',
  input: 'grey',
  prompt: 'grey',
  silly: 'rainbow',
  verbose: 'cyan',
  warn: 'yellow',
});

/**
 * Constants
 */
const NODE_VERSIONS_URL = 'https://nodejs.org/dist/index.json';

/**
 * Command line options
 */
const argv = yargs
  .usage(
    `${colors.green(`
  
  ███╗   ██╗ ██████╗ ██████╗ ███████╗██╗     ██╗      █████╗ 
  ████╗  ██║██╔═══██╗██╔══██╗██╔════╝██║     ██║     ██╔══██╗
  ██╔██╗ ██║██║   ██║██║  ██║█████╗  ██║     ██║     ███████║
  ██║╚██╗██║██║   ██║██║  ██║██╔══╝  ██║     ██║     ██╔══██║
  ██║ ╚████║╚██████╔╝██████╔╝███████╗███████╗███████╗██║  ██║
  ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝
`)}Test Node.js version upgrades on your code\n\nUsage: nodella --manager=[npm|yarn] [options]`
  )
  .help('help')
  .alias('help', 'h')
  .options({
    build: {
      default: 'build',
      description: 'Build script name',
    },
    log: {
      choices: ['debug', 'info'],
      default: 'debug',
      description: 'Log level',
    },
    manager: {
      choices: ['npm', 'yarn'],
      demand: true,
      description: 'Package manager',
    },
    'no-build': {
      default: false,
      description: 'Skip the build script',
      type: 'boolean',
    },
    target: {
      default: 'latest',
      description: 'Target Node.js version',
    },
    test: {
      default: 'test',
      description: 'Test script name',
    },
  })
  .version()
  .alias('version', 'v').argv;

/**
 * Working data
 */
const versions = {};
const results = { code: 0 };
const timer = process.hrtime();

getCurrentNodeVersion()
  .then(function(version) {
    versions.current = version;
  })
  .then(getTargetVersion)
  .then(function(version) {
    versions.target = version;
  })
  .then(function() {
    compareVersions(versions);
  })
  .then(function() {
    return installNodeVersion(versions.target);
  })
  .then(function() {
    return testNodeVersion(versions.target)
      .then(declareUpgradeSuccess)
      .catch(declareUpgradeFailure);
  })
  .then(function() {
    return testNodeVersion(versions.current)
      .then(declareReversionSuccess)
      .catch(declareReversionFailure);
  })
  .then(declareResults)
  .catch(function(error) {
    log('error', 'Unexpected error', error);
    process.exit(error.code);
  });

function compareVersions(versions) {
  log('info', `Current Node.js version is v${versions.current}`);
  log('info', `Latest Node.js version is v${versions.target}`);
  if (versions.current === versions.target) {
    log(
      'info',
      `Already using ${argv.target === 'latest'
        ? 'latest'
        : 'target'} Node.js version (v${versions.target})`
    );
    process.exit(0);
  }
}

function declareResults() {
  if (results.upgrade) {
    const success = `
  
  ███████╗██╗   ██╗ ██████╗ ██████╗███████╗███████╗███████╗
  ██╔════╝██║   ██║██╔════╝██╔════╝██╔════╝██╔════╝██╔════╝
  ███████╗██║   ██║██║     ██║     █████╗  ███████╗███████╗
  ╚════██║██║   ██║██║     ██║     ██╔══╝  ╚════██║╚════██║
  ███████║╚██████╔╝╚██████╗╚██████╗███████╗███████║███████║
  ╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝╚══════╝╚══════╝╚══════╝
`;
    success.split('\n').forEach(line => log('info', colors.green(line)));
    log('info', `You can successfully upgrade to Node.js v${versions.target}`);
  } else {
    const failure = `
  
  ███████╗ █████╗ ██╗██╗     ██╗   ██╗██████╗ ███████╗
  ██╔════╝██╔══██╗██║██║     ██║   ██║██╔══██╗██╔════╝
  █████╗  ███████║██║██║     ██║   ██║██████╔╝█████╗  
  ██╔══╝  ██╔══██║██║██║     ██║   ██║██╔══██╗██╔══╝  
  ██║     ██║  ██║██║███████╗╚██████╔╝██║  ██║███████╗
  ╚═╝     ╚═╝  ╚═╝╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
`;
    failure.split('\n').forEach(line => log('info', colors.red(line)));
    log('warn', `You cannot upgrade to Node.js v${versions.target}`);
  }
  if (results.reversion) {
    log('info', `Reverted to Node.js v${versions.current}`);
  } else {
    log('warn', `Failed to revert to Node.js v${versions.current}`);
  }
  log(
    'info',
    `Nodella test completed in ${Math.floor(process.hrtime(timer)[1] / 1e6) /
      1e3} seconds`
  );
  process.exit(results.code || '1'); // only failures try to update the code. If they erase the code, signal a failure with code '`'
}

function declareReversionFailure(code) {
  results.code = code;
  results.reversion = false;
}

function declareReversionSuccess() {
  results.reversion = true;
}

function declareUpgradeFailure(code) {
  results.code = code;
  results.upgrade = false;
}

function declareUpgradeSuccess() {
  results.upgrade = true;
}

function deleteNodeModules() {
  log('debug', 'Deleting node_modules ...');
  rimraf.sync('node_modules');
}

function findLatestVersion(versionList) {
  return JSON.parse(versionList).sort(
    (a, b) => (semver.gt(a.version, b.version) ? -1 : 1)
  )[0];
}

function getCurrentNodeVersion() {
  return run('node -v', { suppress: true }).then(semver.clean);
}

function getTargetVersion() {
  if (argv.target !== 'latest') {
    return semver.clean(argv.target);
  } else {
    return request(NODE_VERSIONS_URL)
      .then(findLatestVersion)
      .then(listing => semver.clean(listing.version));
  }
}

function installNodeModules() {
  const command = `${argv.manager} install`;
  log('debug', `Installing dependencies with \`${command}\` ...`);
  return run(command);
}

function installNodeVersion(version) {
  log('debug', `Installing Node.js v${version} ...`);
  return run(`nvm install ${version}`);
}

function log(level, ...args) {
  const logger = console[level] || console.log;
  if (argv.log === 'debug' || level === 'info') {
    logger('nodella', colors[level](level), ...args);
  }
}

function run(command, options) {
  const _options = options || { suppress: false };
  _options.suppress = _options.suppress || false;
  return new global.Promise(function(resolve, reject) {
    let result = '';
    const task = exec(command);
    task.stdout.on('data', function(data) {
      result = result.concat(`\n${data.toString()}`);
      if (_options.suppress === false) {
        data.toString().split('\n').forEach(line => log('debug', line));
      }
    });

    task.stderr.on('data', function(data) {
      result = result.concat(data.toString());
      data.toString().split('\n').forEach(line => log('debug', line));
    });

    task.on('close', function(code) {
      if (Number(code) === 0) {
        resolve(result.trim());
      } else {
        log('error', `failed on command ${command}`);
        reject(code);
      }
    });
  });
}

function runBuildScript() {
  if (argv['no-build'] === false) {
    const buildCommand = `${argv.manager} run ${argv.build}`;
    log('debug', `Building codebase with \`${buildCommand}\` ...`);
    return run(buildCommand);
  }
}

function runTests() {
  const testCommand = `${argv.manager} run ${argv.test}`;
  log('debug', `Running tests with \`${testCommand}\` ...`);
  return run(testCommand);
}

function testNodeVersion(version) {
  return useNodeVersion(version)
    .then(deleteNodeModules)
    .then(installNodeModules)
    .then(runBuildScript)
    .then(runTests);
}

function useNodeVersion(version) {
  log('debug', `Switching to Node.js v${version} ...`);
  return run(`nvm use ${version}`);
}
