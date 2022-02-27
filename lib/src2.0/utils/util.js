const TEMPLATE_REPO = 'direct:https://gitee.com/xiahouwei/fx-vue-cli-template.git'
// const TEMPLATE_REPO = 'xiahouwei/fx-vue-cli-template'

// 通过环境变量获取用户home目录, 或者使用user-home插件来获取
const downloadDirectory = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.fx-vue-templates`


// 获取模板远程仓库地址
function getTemplateUrl (templateName) {
    return templateName === 'fx' ? TEMPLATE_REPO : `vuejs-templates/${templateName}`
}

module.exports = {
    downloadDirectory,
    getTemplateUrl
}