import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const cliPath = path.join(__dirname, '../../dist/cli.js');
const TEST_DIR = path.join(__dirname, 'test-output');

beforeEach(() => {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterAll(() => {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

afterEach(() => {
  clearTimeout(timeoutId);
});

let timeoutId: NodeJS.Timeout;

const runCLI = (inputs: string[]) => {
  return new Promise<void>((resolve, reject) => {
    const child = spawn('node', [cliPath, 'create'], { cwd: TEST_DIR });

    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
      console.log('CLI output:', output);

      if (output.includes('是否需要一级目录？')) {
        child.stdin.write(inputs.shift() + '\n');
      } else if (output.includes('请输入一级目录名称：')) {
        child.stdin.write(inputs.shift() + '\n');
      } else if (output.includes('是否需要创建二级目录？')) {
        child.stdin.write(inputs.shift() + '\n');
      } else if (output.includes('请输入二级目录名称：')) {
        child.stdin.write(inputs.shift() + '\n');
      } else if (output.includes('是否需要创建模板文件？')) {
        child.stdin.write(inputs.shift() + '\n');
      } else if (output.includes('是否需要创建 API 文件？')) {
        child.stdin.write(inputs.shift() + '\n');
      }
    });

    child.stderr.on('data', (data) => {
      console.error('CLI error:', data.toString());
    });

    child.on('close', (code) => {
      clearTimeout(timeoutId); // 清除超时
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`CLI exited with code ${code}`));
      }
    });

    timeoutId = setTimeout(() => {
      console.error('CLI execution timed out');
      child.kill();
      reject(new Error('CLI execution timed out'));
    }, 60000);
  });
};


test('should create a new template with first and second level directories', async () => {
  const inputs = ['y', 'firstLevel', 'y', 'secondLevel', 'y', 'y'];
  await runCLI(inputs);
}, 60000);

test('should create a new template without first level directory', async () => {
  const dirPath = path.join(TEST_DIR, 'src', 'views', 'existingDir');
  fs.mkdirSync(path.dirname(dirPath), { recursive: true }); // 确保父目录存在
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }

  const inputs = ['n', 'existingDir', 'y', 'secondLevel', 'y', 'y'];
  await runCLI(inputs);
}, 60000);