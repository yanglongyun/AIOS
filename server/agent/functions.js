import { exec } from 'child_process';

export const shell = ({ command }) => {
  return new Promise((resolve) => {
    exec(String(command || ''), { timeout: 30000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        resolve(`exit code ${err.code}\n${stderr || err.message}`);
        return;
      }
      resolve(stdout || stderr || '(no output)');
    });
  });
};