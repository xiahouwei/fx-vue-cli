const execa = require('execa') // 终端运行插件
const inquirer = require('inquirer')
const PromptModuleAPI = require('./PromptModuleAPI')
const { clearConsole } = require('./util/clearConsole')
const { savePreset } = require('./options')

// 如果当前的预选项为manual模式, 则必然提问此描述
const isManualMode = answers => answers.preset === '__manual__'

// Creator类
class Creator {
    constructor (name, context, promptModules) {
        this.name = name
        this.context = context
        // 获取 预设选项(上次创建过的) 和 预设选项具体选项(例如babel, ts, vuex)
        const { presetPrompt, featurePrompt } = this.resolveIntroPrompts()
        this.presetPrompt = presetPrompt
        this.featurePrompt = featurePrompt
        // 项目配置的文件放在package.json 还是 congfig.js 是否存储presetPrompts
        this.outroPrompts = this.resolveOutroPrompts()
        // 预选项内的每个具体细节
        this.injectedPrompts = []
        this.promptCompleteCbs = []
        this.createCompleteCbs = []

        this.run = this.run.bind(this)

        // 循环预选项模块并执行, 根据每一个模块来进行交互显示
        const promptAPI = new PromptModuleAPI(this)
        promptModules.forEach(m => m(promptAPI))
    }

    async create (preset = null) {
        // 如果没有指定预选项, 则提示用户选择一个已存在的, 或者生成一个预选项
        if (!preset) {
            preset = await this.promptAndResolvePreset()
        }
    }

    run (command, args) {
        if (!args) { [command, ...args] = command.split(/\s+/) }
        return execa(command, args, { cwd: this.context })
    }

    // 提示并获取用户的预选项答案
    async promptAndResolvePreset (answers = null) {
        if (!answers) {
            await clearConsole(true)
            // 和用户进行交互, 获取用户选择的预选项结果
            answers = await inquirer.prompt(this.resolveFinalPrompts())
            console.log(answers)
        }
        let preset
        if (answers.preset && answers.preset !== '__manual__') {
            // TODO
            console.log('读取预选项')
        } else {
            preset = {
                useConfigFiles: answers.useConfigFiles === 'files',
                plugins: {}
            }
            answers.features = answers.features || []
            // 执行预选项回调, 根据用户的选择 以及 每一个预选项设置的回调 来填充preset
            this.promptCompleteCbs.forEach(cb => cb(answers, preset))
        }

        // 保存预选项到本地
        if (answers.save && answers.saveName) {
            savePreset(answers.saveName, preset)
        }
      
        return preset
    }

    // 获取 预设选项 和 预设选项描述
    resolveIntroPrompts () {
        const presetPrompt = {
            name: 'preset',
            type: 'list',
            message: `Please pick a preset:`,
            choices: [
                {
                    name: 'Manually select features',
                    value: '__manual__'
                }
            ]
        }
        const featurePrompt = {
            name: 'features',
            when: isManualMode,
            type: 'checkbox',
            message: 'Check the features needed for your project:',
            choices: [],
            pageSize: 10
        }
        return {
            presetPrompt,
            featurePrompt
        }
    }

    // 项目配置的文件放在package.json 还是 congfig.js 是否存储presetPrompts
    resolveOutroPrompts () {
        const outroPrompts = [
            {
                name: 'useConfigFiles',
                when: isManualMode,
                type: 'list',
                message: 'Where do you prefer placing config for Babel, PostCSS, ESLint, etc.?',
                choices: [
                    {
                        name: 'In dedicated config files',
                        value: 'files'
                    },
                    {
                        name: 'In package.json',
                        value: 'pkg'
                    }
                ]
            },
            {
                name: 'save',
                when: isManualMode,
                type: 'confirm',
                message: 'Save this as a preset for future projects?',
                default: false
            },
            {
                name: 'saveName',
                when: answers => answers.save,
                type: 'input',
                message: 'Save preset as:'
            }
        ]

        return outroPrompts
    }

    // 获取最终需要跟用户交互的预选项
    resolveFinalPrompts () {
        // 注入的提示只在manual模式下显示
        this.injectedPrompts.forEach(prompt => {
            const originalWhen = prompt.when || (() => true)
            prompt.when = answers => {
                return isManualMode(answers) && originalWhen(answers)
            }
        })
        const prompts = [
            this.presetPrompt,
            this.featurePrompt,
            ...this.injectedPrompts,
            ...this.outroPrompts
        ]
        return prompts
    }
}
module.exports = Creator