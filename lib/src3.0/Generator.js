const ejs = require('ejs')
const { toShortPluginId, matchesPluginId } = require('@vue/cli-shared-utils')
const GeneratorAPI = require('./GeneratorAPI')
const writeFileTree = require('./util/writeFileTree')
const normalizeFilePaths = require('./util/normalizeFilePaths')
const injectImportsAndOptions = require('./util/injectImportsAndOptions')


class Generator {
    constructor (context, {
        // package.json
        pkg = {},
        // 插件
        plugins = [],
        // create回调
        completeCbs = [],
        files = {},
        // 立即调用
        invoking = false
    }) {
        // 上下文
        this.context = context
        // 插件
        this.plugins = plugins
        // 原始package.json
        this.originalPkg = pkg
        // 浅拷贝后的package.json
        this.pkg = Object.assign({}, pkg)
        this.imports = {}
        this.rootOptions = {}
        this.completeCbs = completeCbs
        this.configTransforms = {}
        // for conflict resolution
        this.depSources = {}
        // 虚拟文件树
        this.files = files
        this.fileMiddlewares = []
        this.postProcessFilesCbs = []
        // exit messages
        this.exitLogs = []

        // 获取rootOptions
        const cliService = plugins.find(p => p.id === '@vue/cli-service')
        const rootOptions = cliService
        // 循环执行每个插件的行为
        plugins.forEach(({ id, apply, options }) => {
            /**
             * GeneratorAPI 为每个插件的行为 提供了 需要的函数 比如:
             * hasPlugin：判断项目中是否有某个插件
             * extendPackage：拓展 package.json 配置
             * render：利用 ejs 渲染模板文件
             * onCreateComplete：内存中保存的文件字符串全部被写入文件后的回调函数
             * exitLog：当 generator 退出的时候输出的信息
             * genJSConfig：将 json 文件生成为 js 配置文件
             * injectImports：向文件当中注入import语法的方法
             * injectRootOptions：向 Vue 根实例中添加选项
             */
            const api = new GeneratorAPI(id, this, options, rootOptions)
            apply(api, options, rootOptions, invoking)
        })
    }

    async generate ({
        extractConfigFiles = false,
        checkExisting = false
    } = {}) {
        // 保存文件系统后再应用插件进行比较  
        const initialFiles = Object.assign({}, this.files)
        // 这里执行每个插件的generate函数, 进行ejs模板渲染, 在内存中生成files
        await this.resolveFiles()
        // 生成package.json
        this.files['package.json'] = JSON.stringify(this.pkg, null, 2) + '\n'
        // 把内存的文件保存到执行目录
        await writeFileTree(this.context, this.files, initialFiles)
    }

    // 解析文件 
    async resolveFiles () {
        const files = this.files
        // 执行文件中间件中的 每一个插件的 render方法
        for (const middleware of this.fileMiddlewares) {
            await middleware(files, ejs.render)
        }

        // 修正windows路径
        normalizeFilePaths(files)

        // 处理main.js文件内的导入和vue根选项注入
        Object.keys(files).forEach(file => {
            files[file] = injectImportsAndOptions(
                files[file],
                this.imports[file],
                this.rootOptions[file]
            )
        })
    }

    // 判断是否存在此插件
    hasPlugin (_id) {
        if (_id === 'router') _id = 'vue-router'
        if (['vue-router', 'vuex'].includes(_id)) {
            const pkg = this.pkg
            return ((pkg.dependencies && pkg.dependencies[_id]) || (pkg.devDependencies && pkg.devDependencies[_id]))
        }
        return [
            ...this.plugins.map(p => p.id),
            ...Object.keys(this.pkg.devDependencies || {}),
            ...Object.keys(this.pkg.dependencies || {})
        ].some(id => matchesPluginId(_id, id))
    }
}

module.exports = Generator