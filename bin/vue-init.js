#! /usr/bin/env node

const { chalk } = require('@vue/cli-shared-utils')
const program = require('commander')


// -V 获取版本号
program
    .version(require('../package.json').version)
    .description('风行 vue-cli2.0 脚手架')
    .usage('<app-name>')
    .option('-f, --force', 'Overwrite target directory if it exists')
    .action((args) => {
        if (program.args.length < 1) {
            console.log('error: missing required argument "app-name"')
            return program.help()
        }
        require('../lib/init')(program.args[0], args)
    })


program.on('--help', () => {
    console.log('  Examples:')
    console.log()
    console.log(chalk.gray('    # create a new project with template'))
    console.log('    $ fx-vue-init my-project')
    console.log()
})

// 解析命令行参数
program.parse(process.argv)

