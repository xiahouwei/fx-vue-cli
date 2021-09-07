const path = require('path')
const exists = require('fs').existsSync
const rm = require('rimraf').sync
const ora = require('ora') // 终端loading插件
const { promisify } = require('util')
const downloadGitRepo = require('download-git-repo')
const { chalk } = require('@vue/cli-shared-utils')
const Metalsmith = require('metalsmith') // 静态网站生成器, 用来遍历文件
const { render } = require('consolidate').handlebars // 整合模板引擎
const ask = require('./ask')
const async = require('async') // 异步封装插件
const Handlebars = require('handlebars')
const { downloadDirectory, getTemplateUrl } = require('./utils/util')
const getOptions = require('./options')
const filter = require('./filter')
const templateDir = `${downloadDirectory}/template`

// 注册Handlebars模板规则
Handlebars.registerHelper('if_eq', function (a, b, opts) {
    return a === b
        ? opts.fn(this)
        : opts.inverse(this)
})
  
Handlebars.registerHelper('unless_eq', function (a, b, opts) {
    return a === b
        ? opts.inverse(this)
        : opts.fn(this)
})

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
    constructor (templateName, name, targetDir) {
        this.templateName = templateName
        this.name = name
        this.targetDir = targetDir
        this.downloadGitRepo = promisify(downloadGitRepo)
    }

    // 下载template到临时路径, 编译后移动到工作路径
    async downloadAndGenerator (done) {
        const url = getTemplateUrl(this.templateName)
        const target = path.resolve(process.cwd(), this.targetDir)
        // 如果存在临时目录则删除
        if (exists(downloadDirectory)) rm(downloadDirectory)
        const success = await wrapLoading(this.downloadGitRepo, `download template:${url}`)(url, downloadDirectory)
        if (success) {
            // 获取模板内的meta数据
            const opts = getOptions(this.name, downloadDirectory)
            // 有可能要根据meta数据 注册一些handlerbars规则
            opts.helpers && Object.keys(opts.helpers).map(key => {
                Handlebars.registerHelper(key, opts.helpers[key])
            })
            // 通过metalsmith进行模板渲染, 然后生成到指定路径
            const metalsmith = Metalsmith(templateDir)
            // 对用户进行项目信息采集, 以及模板渲染
            metalsmith
                .use(this.askQuestions(opts.prompts))
                .use(this.renderTemplateFiles)

            // 在指定目录生成文件
            metalsmith.clean(false)
                .source('.')
                .destination(target)
                .build((err) => {
                    if (!err) {
                        done()
                    } else {
                        console.log(err)
                    }
                })
        }
    }

    // 向用户收集项目信息
    askQuestions (prompts) {
        return (files, metalsmith, done) => {
            ask(prompts, metalsmith.metadata(), done)
        }
    }

    // 删除到某些不需要的文件
    filterFiles (filters) {
        return (files, metalsmith, done) => {
            filter(files, filters, metalsmith.metadata(), done)
        }
    }

    // 模板渲染 生成文件
    renderTemplateFiles (files, metalsmith, done) {
        const keys = Object.keys(files)
        const metalsmithMetadata = metalsmith.metadata()
        // 并发执行
        async.each(keys, (file, next) => {
            const str = files[file].contents.toString()
            // 判断是否存在模板变量
            // if (!/\<\%\=.+\%\>/.test(str)) {
            //     return next()
            // }
            if (!/{{([^{}]+)}}/g.test(str)) {
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

    successMessageHander () {
        console.log(`\r\nSuccessfully created project ${chalk.cyan(this.name)}`)
        console.log(`\r\n cd ${chalk.cyan(this.name)}`)
        console.log(` npm run dev\r\n`)
    }
}

module.exports = Generator