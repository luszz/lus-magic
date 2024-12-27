#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import ejs from 'ejs';
import ora from 'ora';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = process.cwd();

const program = new Command();

program
  .command('create')
  .description('创建一个新的模板')
  .action(async () => {
    try {

      const { needFirstLevel } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'needFirstLevel',
          message: '是否需要一级目录？',
          default: true,
        },
      ]);


      let firstLevelDir = '';
      let selectedFile = '';
      if (needFirstLevel) {
        const { dirName } = await inquirer.prompt([
          {
            type: 'input',
            name: 'dirName',
            message: '请输入一级目录名称：',
          },
        ]);
        firstLevelDir = dirName;

        const dirPath = path.join(baseDir, 'src', 'views', firstLevelDir);
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`一级目录已创建：${dirPath}`);
      } else {
        const files = await fs.readdir(path.join(baseDir, 'src', 'views'));
        const response = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedFile',
            message: '请选择 src/views 下的一个文件：',
            choices: files,
          },
        ]);
        selectedFile = response.selectedFile;
        firstLevelDir = selectedFile;
      }

      const { needSecondLevel } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'needSecondLevel',
          message: '是否需要创建二级目录？',
          default: true,
        },
      ]);


      let newFolderPath = path.join(baseDir, 'src', 'views', firstLevelDir);
      let secondLevelDirName = '';

      if (needSecondLevel) {
        const response = await inquirer.prompt([
          {
            type: 'input',
            name: 'secondLevelDirName',
            message: '请输入二级目录名称：',
          },
        ]);

        secondLevelDirName = response.secondLevelDirName;
        newFolderPath = path.join(newFolderPath, secondLevelDirName);
        await fs.mkdir(newFolderPath, { recursive: true });
        console.log(`二级目录已创建：${newFolderPath}`);
      }

      const { createTemplates } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'createTemplates',
          message: '是否需要创建模板文件 (index.vue, columns.tsx)？',
          default: true,
        },
      ]);


      if (createTemplates) {
        const spinner = ora('正在创建模板文件...').start();

        try {
          const componentsPath = path.join(newFolderPath, 'components');
          await fs.mkdir(componentsPath, { recursive: true });
          console.log(`components 文件夹已创建：${componentsPath}`);

          const indexVueTemplatePath = path.join(__dirname, 'templates', 'index.vue.ejs');
          const indexVueTemplate = await fs.readFile(indexVueTemplatePath, 'utf-8');
          const indexVueContent = ejs.render(indexVueTemplate, { componentName: path.basename(newFolderPath) });
          await fs.writeFile(path.join(newFolderPath, 'index.vue'), indexVueContent);

          const columnsTsxTemplatePath = path.join(__dirname, 'templates', 'columns.tsx.ejs');
          const columnsTsxTemplate = await fs.readFile(columnsTsxTemplatePath, 'utf-8');
          const columnsTsxContent = ejs.render(columnsTsxTemplate, {});
          await fs.writeFile(path.join(newFolderPath, 'columns.tsx'), columnsTsxContent);

          spinner.succeed('模板文件创建成功');
        } catch (error) {
          spinner.fail('模板文件创建失败');
          console.error(error);
        }
      }

      const { createApiFiles } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'createApiFiles',
          message: '是否需要创建 API 文件 (index.ts, model.d.ts)？',
          default: true,
        },
      ]);


      if (createApiFiles) {
        const spinner = ora('正在创建 API 文件...').start();

        try {
          let apiPath = path.join(baseDir, 'src', 'api');

          if (needFirstLevel && needSecondLevel) {
            apiPath = path.join(apiPath, firstLevelDir, secondLevelDirName);
          } else if (!needFirstLevel && needSecondLevel) {
            apiPath = path.join(apiPath, selectedFile, secondLevelDirName);
          }

          await fs.mkdir(apiPath, { recursive: true });
          console.log(`API 目录已创建：${apiPath}`);

          const indexTsTemplatePath = path.join(__dirname, 'templates', 'index.ts.ejs');
          const indexTsTemplate = await fs.readFile(indexTsTemplatePath, 'utf-8');
          const indexTsContent = ejs.render(indexTsTemplate, {});
          await fs.writeFile(path.join(apiPath, 'index.ts'), indexTsContent);

          const modelDtsTemplatePath = path.join(__dirname, 'templates', 'model.d.ts.ejs');
          const modelDtsTemplate = await fs.readFile(modelDtsTemplatePath, 'utf-8');
          const modelDtsContent = ejs.render(modelDtsTemplate, {});
          await fs.writeFile(path.join(apiPath, 'model.d.ts'), modelDtsContent);

          spinner.succeed('API 文件创建成功');
        } catch (error) {
          spinner.fail('API 文件创建失败');
          console.error(error);
        }
      }

      process.exit(0);
    } catch (error) {
      if (error instanceof Error) {
        console.error('操作被中断或发生错误:', error.message);
      } else {
        console.error('操作被中断或发生错误:', error);
      }
      process.exit(1);
    }
  });

program.parse(process.argv);