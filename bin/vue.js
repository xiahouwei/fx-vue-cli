#! /usr/bin/env node

const { chalk } = require('@vue/cli-shared-utils')
const program = require('commander')


// -V 获取版本号
program
    .version(require('../package.json').version)
    .description('风行 vue-cli 脚手架')
    .usage('<command> [options]')


// create 命令 3.x创建项目命令
program
    .command('create <app-name>')
    .description('create a new project powered by vue-cli-service')
    .option('-p, --preset <presetName>', 'Skip prompts and use saved or remote preset')
    .option('-d, --default', 'Skip prompts and use default preset')
    .option('-i, --inlinePreset <json>', 'Skip prompts and use inline JSON string as preset')
    .option('-m, --packageManager <command>', 'Use specified npm client when installing dependencies')
    .option('-r, --registry <url>', 'Use specified npm registry when installing dependencies (only for npm)')
    .option('-g, --git [message]', 'Force git initialization with initial commit message')
    .option('-n, --no-git', 'Skip git initialization')
    .option('-f, --force', 'Overwrite target directory if it exists')
    .option('--merge', 'Merge target directory if it exists')
    .option('-c, --clone', 'Use git clone when fetching remote preset')
    .option('-x, --proxy <proxyUrl>', 'Use specified proxy when creating project')
    .option('-b, --bare', 'Scaffold project without beginner instructions')
    .option('--skipGetStarted', 'Skip displaying "Get started" instructions')
    .action((name, otherD, cmd) => {
        require('../lib/src3.0/create')(name, otherD)
    })

program.on('--help', () => {
    console.log()
    console.log(`  Run ${chalk.cyan(`vue <command> --help`)} for detailed usage of given command.`)
    console.log()
})

program.commands.forEach(c => c.on('--help', () => console.log()))


// 解析命令行参数
program.parse(process.argv)
