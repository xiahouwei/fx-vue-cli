module.exports = cli => {
    // 添加bable插件预选项
    cli.injectFeature({
      name: 'fxLogger',
      value: 'fxLogger',
      short: 'fxLogger',
      description: 'use fx-logger(风行日志功能模块)?',
      checked: true
    }),

    cli.injectPrompt({
      name: 'fxLogger',
      when: answers => answers.features.includes('fxLogger'),
      type: 'list',
      message: '请选择风行日志功能模块',
      description: '风行日志功能模块具体配置',
      choices: [
        {
          name: 'fxLogger-pc',
          value: 'fxLoggerPc'
        },
        {
          name: 'fxLogger-mobile',
          value: 'fxLoggerMobile'
        }
      ]
    })

    // 交互后的回调
    cli.onPromptComplete((answers, options) => {
      if (answers.cssPreprocessor) {
        options.cssPreprocessor = answers.cssPreprocessor
      }
    })
  
  }
  