const chalk = require('chalk')
const { toShortPluginId } = require('@vue/cli-shared-utils')


// 对预设选项进行转义, 其实是一种映射关系
exports.getFeatures = (preset) => {
  const features = []
  if (preset.router) {
    features.push('vue-router')
  }
  if (preset.vuex) {
    features.push('vuex')
  }
  if (preset.cssPreprocessor) {
    features.push(preset.cssPreprocessor)
  }
  const plugins = Object.keys(preset.plugins).filter(dep => {
    return dep !== '@vue/cli-service'
  })
  features.push.apply(features, plugins)
  return features
}

exports.formatFeatures = (preset, lead, joiner) => {
  const features = exports.getFeatures(preset)
  return features.map(dep => {
    dep = toShortPluginId(dep)
    return `${lead || ''}${chalk.yellow(dep)}`
  }).join(joiner || ', ')
}
