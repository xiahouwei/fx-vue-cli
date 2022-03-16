exports.getPromptModules = () => {
    return [
      'babel',
      'typescript',
      'pwa',
      'router',
      'vuex',
      'cssPreprocessors',
      'linter',
      'unit',
      'e2e'
      // 'fx-logger'
    ].map(file => require(`../promptModules/${file}`))
  }
  