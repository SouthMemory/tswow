import { exec } from 'child_process';
import { promises as fs } from 'fs'; // 使用 fs 的 promises API 以方便 async/await 使用
import { wfs } from '../util/FileSystem';
import { FilePath, resfp } from '../util/FileTree';
import { term } from '../util/Terminal';

export async function DownloadFile(url: string, file: FilePath) {
    // 检查文件是否存在
    if (wfs.exists(file)) {
        return;
    }

    // 获取完整文件路径和目录
    const filePath = resfp(file);
    const directory = wfs.dirname(filePath);

    // 检查目录是否存在，如果不存在则创建
    try {
        await fs.access(directory);
    } catch (error) {
        await fs.mkdir(directory, { recursive: true });
        term.log('build', `Created directory: ${directory}`);
    }

    // 构建 PowerShell 命令，使用 Invoke-WebRequest
    const psCommand = `powershell -Command "Invoke-WebRequest -Uri '${url}' -OutFile '${filePath}' -Proxy 'http://127.0.0.1:33210'"`;

    try {
        term.log('build', `Downloading ${url} using PowerShell Invoke-WebRequest (this can take a long time)`);
        term.log("build", "using proxy http://127.0.0.1:33210");

        // 使用 exec 执行 PowerShell 命令
        await new Promise((resolve, reject) => {
            exec(psCommand, (error, stdout, stderr) => {
                if (error) {
                    term.error('build', `Error downloading file: ${stderr}`);
                    reject(new Error(`Failed to download ${url}: ${error.message}`));
                    return;
                }
                term.success('build', `Finished downloading ${url}`);
                resolve(stdout);
            });
        });
    } catch (error) {
        throw new Error(`Failed to download ${url}: ${error.message}`);
    }
}
