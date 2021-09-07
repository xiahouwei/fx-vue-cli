const inquirer = require('inquirer')
const async = require('async')
const evaluate = require('./eval')


// 收集用户填写的项目信息
function ask (prompts, data, done) {
    // 按顺序循环异步执行
    async.eachSeries(Object.keys(prompts), (key, next) => {
        prompt(data, key, prompts[key], next)
    }, done)
}

function prompt (data, key, prompt, done) {
    // 如果when的表达式结果为false, 就忽略prompt
    if (prompt.when && !evaluate(prompt.when, data)) {
        return done()
    }

    // 设置默认值
    let promptDefault = prompt.default
    if (typeof prompt.default === 'function') {
        promptDefault = function () {
            return prompt.default.bind(this)(data)
        }
    }

    inquirer.prompt([{
        type: prompt.type,
        name: key,
        message: prompt.message,
        default: promptDefault,
        choices: prompt.choices || []
    }]).then(answers => {
        if (typeof answers[key] === 'string') {
            data[key] = answers[key].replace(/"/g, '\\"')
        } else {
            data[key] = answers[key]
        }
        done()
    }).catch(done)
}

module.exports = ask