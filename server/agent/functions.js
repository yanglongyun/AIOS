import { exec } from 'child_process';
import { maskSensitiveInText, prepareShellCommand } from './utils.js';

export const shell = ({ command }) => {
  return new Promise((resolve) => {
    let prepared;
    try {
      prepared = prepareShellCommand(command);
    } catch (e) {
      resolve(`tool error: ${e.message}`);
      return;
    }

    exec(prepared.command, { timeout: 30000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      const maskedStdout = maskSensitiveInText(stdout, prepared.secrets);
      const maskedStderr = maskSensitiveInText(stderr, prepared.secrets);
      if (err) {
        resolve(`exit code ${err.code}\n${maskedStderr || err.message}`);
        return;
      }
      resolve(maskedStdout || maskedStderr || '(no output)');
    });
  });
};
