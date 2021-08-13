// 通过环境变量获取用户home目录, 或者使用user-home插件来获取
const downloadDirectory = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.fx-vue-templates`

module.exports = {
    downloadDirectory
}