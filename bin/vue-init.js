#! /usr/bin/env node

const { chalk } = require('@vue/cli-shared-utils') // chalk 用于改变终端字体颜色, 进行高亮
const program = require('commander') // commander 插件用于声明解析命令


/**
 * 2.x创建项目命令
 * -V 获取版本号
 * -f 覆盖路径
 */
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
        require('../lib/src2.0/init')(program.args[0], args)
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

