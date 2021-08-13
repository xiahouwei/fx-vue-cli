// create 创建项目 命令逻辑实现
const path = require('path')
const fsextra = require('fs-extra')
const fs = require('fs')
const inquirer = require('inquirer')
const { chalk, error, stopSpinner, exit } = require('@vue/cli-shared-utils')
const validateProjectName = require('validate-npm-package-name')
const Generator = require('./Generator')


async function create (projectName, options) {
	// 获取目标目录
	const cwd = process.cwd()
	const targetDir = path.resolve(cwd, projectName || '.')

	// 校验项目名称是否符合规范
	const result = validateProjectName(projectName)
	if (!result.validForNewPackages) {
		console.error(chalk.red(`Invalid project name: "${projectName}"`))
		result.errors && result.errors.forEach(err => {
			console.error(chalk.red.dim('Error: ' + err))
		})
		result.warnings && result.warnings.forEach(warn => {
			console.error(chalk.red.dim('Warning: ' + warn))
		})
		exit(1)
	}
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
			const generator = new Generator(projectName, targetDir, 'default')
			generator.create()
		}
	})
}
module.exports = (...args) => {
	return create(...args)
}