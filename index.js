#!/usr/bin/env node

// Los imports
const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const shell = require('shelljs')
const chalk = require('chalk')

const render = require('./utils/template').render

// Obtener las opciones de template

const TEMPLATE_OPTIONS = fs.readdirSync(path.join(__dirname, 'templates'))

// console.log(TEMPLATE_OPTIONS)

const QUESTIONS = [
    {
        name: 'template',
        type: 'list',
        message: '¿Que tipo de proyecto quieres generar?',
        choices: TEMPLATE_OPTIONS,
    },
    {
        name: 'proyecto',
        type: 'input',
        message: '¿Cual es el nombre del proyecto?',
        validate: function(input) {
            if (/^([a-z@]{1}[a-z\-\.\\\/0-9]{0,213})+$/.test(input)) {
                return true
            }

            return 'El nombre del proyecto solo puede tener 214 caracteres, no puede empezar con mayusculas y tiene que empezar en minusculas o con una @'
        },
    },
]

const DIR_ACTUAL = process.cwd()

inquirer.prompt(QUESTIONS).then(respuestas => {
    const template = respuestas['template']
    const proyecto = respuestas['proyecto']

    const templatePath = path.join(__dirname, 'templates', template)
    const pathTarget = path.join(DIR_ACTUAL, proyecto)

    if (!createProject(pathTarget)) return
    createDirectoriesFilesContent(templatePath, proyecto)
    postProcess(templatePath, targetPath)
})

function createProject(projectPath) {
    // Comprobar que no existe el directorio
    if (fs.existsSync(projectPath)) {
        console.log(
            chalk.red(
                'No puedes crear el proyecto porque ya existe, intenta con otro'
            )
        )
        return false
    }

    fs.mkdirSync(projectPath)
    return true
}

function createDirectoriesFilesContent(templatePath, projectName) {
    const listFileDirectories = fs.readdirSync(templatePath)

    listFileDirectories.forEach(item => {
        const originalPath = path.join(templatePath, item)
        const stats = fs.statSync(originalPath)
        const writePath = path.join(DIR_ACTUAL, projectName, item)

        if (stats.isFile()) {
            let contents = fs.readFileSync(originalPath, 'utf-8')
            contents = render(contents, { projectName })
            fs.writeFileSync(writePath, contents, 'utf-8')
            // Informacion adicional
            const CREATE = chalk.green('CREATE ')
            const SIZE = stats['size']
            console.log(`${CREATE} ${originalPath} (${SIZE}) bytes`)
        } else if (stats.isDirectory()) {
            fs.mkdirSync(writePath)
            createDirectoriesFilesContent(
                path.join(templatePath, item),
                path.join(projectName, item)
            )
        }
    })
}

function postProcess(templatePath, targetPath) {
    const isNode = fs.existsSync(path.join(templatePath, 'package.json'))

    if (isNode) {
        shell.cd(pathTarget)
        console.log(
            chalk.yellow(`Instalando las dependencias en ${targetPath}`)
        )
        const result = shell.exec('npm i')
        if (result.code != 0) {
            return false
        }
    }
}
