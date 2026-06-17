// @ts-nocheck
import { runShellCommand } from "../utils/shell.js";

const shell = ({ command, cwd, timeout, mode } = {}) =>
  runShellCommand({ command, cwd, timeout, mode });

export { shell };
