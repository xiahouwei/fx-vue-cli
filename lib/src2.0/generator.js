const fs = require('fs')
const path = require('path')
const ora = require('ora') // 终端loading插件
const { promisify } = require('util')
const downloadGitRepo = require('download-git-repo')
const { chalk } = require('@vue/cli-shared-utils')
const ncp = promisify(require('ncp')) // 转移文件
const Metalsmith = require('metalsmith') // 遍历文件
const { render } = require('consolidate').ejs // 整合模板引擎
const ask = require('./ask')
const async = require('async') // 异步封装插件
const { downloadDirectory, getTemplateUrl } = require('./utils/util')


// loading封装
const wrapLoading = (fn, msg) => async (...args) => {
    const spinner = ora(msg)
    spinner.start()
    try {
        await fn(...args)
        spinner.succeed()
        return true
    } catch (error) {
        spinner.fail('download template failed...')
    }
}

// 生成器类
class Generator {
    constructor (name, targetDir) {
        this.name = name
        this.targetDir = targetDir
        this.downloadGitRepo = promisify(downloadGitRepo)
    }

    // 下载template到临时路径, 编译后移动到工作路径
    async downloadAndGenerator (done) {
        const url = getTemplateUrl()
        const target = path.resolve(process.cwd(), this.targetDir)
        const success = await wrapLoading(this.downloadGitRepo, 'download template...')(url, downloadDirectory)
        if (success) {
            // 如果存在 ask.js 文件, 则根据文件对用户采集信息
            if (!fs.existsSync(path.join(downloadDirectory, 'meta.js'))) {
                await ncp(downloadDirectory, target)
                done()
            } else {
                // 通过metalsmith进行模板渲染, 然后生成到指定路径
                const metalsmith = Metalsmith(downloadDirectory)
                const prompts = require(path.join(downloadDirectory, 'meta.js'))
                // 对用户进行项目信息采集, 以及模板渲染
                metalsmith
                    .use(this.askQuestions(prompts))
                    .use(this.renderTemplateFiles)

                // 在指定目录生成文件
                metalsmith.clean(false)
                    .source('.')
                    .destination(target)
                    .build((err) => {
                        if (!err) {
                            done()
                        }
                    })
            }
        }
    }

    // 模板渲染 生成文件
    renderTemplateFiles (files, metalsmith, done) {
        const keys = Object.keys(files)
        const metalsmithMetadata = metalsmith.metadata()
        delete files['meta.js']
        // 并发执行
        async.each(keys, (file, next) => {
            if (!file.endsWith('.json')) {
                return next()
            }
            const str = files[file].contents.toString()
            // 判断是否存在模板变量
            if (!/\<\%\=.+\%\>/.test(str)) {
                return next()
            }
            // 根据meta中的数据进行模板渲染 且 生成文件
            render(str, metalsmithMetadata, (err, res) => {
                if (err) {
                    err.message = `[${file}] ${err.message}`
                    return next(err)
                }
                files[file].contents = Buffer.from(res)
                next()
            })
        }, done)

    }

    // 执行下载, 且在终端显示结果
    async create () {
        this.downloadAndGenerator(() => this.successMessageHander())
    }

    askQuestions (prompts) {
        return (files, metalsmith, done) => {
            ask(prompts, metalsmith.metadata(), done)
        }
    }

    successMessageHander () {
        console.log(`\r\nSuccessfully created project ${chalk.cyan(this.name)}`)
        console.log(`\r\n cd ${chalk.cyan(this.name)}`)
        console.log(` npm run dev\r\n`)
    }
}

module.exports = Generator