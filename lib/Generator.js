const path = require('path')
const ora = require('ora')
const utils = require('util')
const downloadGitRepo = require('download-git-repo')
const { chalk } = require('@vue/cli-shared-utils')
const { getTemplateUrl } = require('./template')

async function wrapLoading (fn, msg, ...args) {
    const spinner = ora(msg)
    spinner.start()
    try {
        const result = await fn(...args)
        spinner.succeed()
        return result
    } catch (error) {
        spinner.fail('download template failed...')
    }
}

class Generator {
    constructor (name, targetDir, templateType) {
        this.name = name
        this.targetDir = targetDir
        this.templateType = templateType
        this.downloadGitRepo = utils.promisify(downloadGitRepo)
    }

    async download () {
        const url = getTemplateUrl(this.templateType)
        await wrapLoading(
            this.downloadGitRepo,
            'download template...',
            url,
            path.resolve(process.cwd(), this.targetDir)
        )
    }

    async create () {
        await this.download()
        console.log(`\r\nSuccessfully created project ${chalk.cyan(this.name)}`)
        console.log(`\r\n cd ${chalk.cyan(this.name)}`)
        console.log(` npm run dev\r\n`)
    }
}

module.exports = Generator