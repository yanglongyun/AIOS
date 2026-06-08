// @ts-nocheck
import { runShellCommand } from "../services/shell/run.js";

const shell = ({ command, cwd, timeout, mode } = {}) =>
  runShellCommand({ command, cwd, timeout, mode });

export { shell };
