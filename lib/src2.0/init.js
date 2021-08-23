// create 创建项目 命令逻辑实现
const path = require('path')
const fsextra = require('fs-extra') // fx扩展模块
const fs = require('fs')
const inquirer = require('inquirer') // 终端交互
const { chalk, error, stopSpinner, exit } = require('@vue/cli-shared-utils')
const Generator = require('./generator')


async function init (projectName, options) {
	// 获取目标目录
	const cwd = process.cwd()
	const targetDir = path.resolve(cwd, projectName || '.')

	// 当存在目录则与用户交互 
	if (fsextra.existsSync(targetDir)) {
		// 有强制属性 则进行覆盖
		if (options.force) {
			await fsextra.remove(targetDir)
		} else {
			// 询问用户是覆盖 还是 放弃
			const { action } = await inquirer.prompt([
				{
					name: 'action',
					type: 'list',
					message: `Target directory ${chalk.cyan(targetDir)} already exists. Pick an action:`,
					choices: [
						{ name: 'Overwrite', value: 'overwrite' },
						{ name: 'Cancel', value: false }
					]
				}
			])
			if (!action) {
				return
			} else if (action === 'overwrite') {
				console.log(`\nRemoving ${chalk.cyan(targetDir)}...`)
				await fsextra.remove(targetDir)
			}
		}
	} 
	createDir(projectName, targetDir)
}
function createDir (projectName, targetDir) {
	fs.mkdir(`./${projectName}`, function (err) {
		if (err) {
			console.log(`\nCreate ${chalk.cyan(targetDir)} failed...`)
		} else {
			const generator = new Generator(projectName, targetDir)
			generator.create()
		}
	})
}
module.exports = (...args) => {
	return init(...args)
}