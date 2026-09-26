import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const viteCli = fileURLToPath(
  new URL('../node_modules/vite/bin/vite.js', import.meta.url)
);

function start(label, command, args) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: process.env
  });

  child.on('error', (error) => {
    console.error(`[${label}] failed to start:`, error.message);
    shutdown();
    process.exitCode = 1;
  });

  return child;
}

const children = [
  start('api', process.execPath, ['server/index.js']),
  start('client', process.execPath, [viteCli, '--host', '0.0.0.0'])
];

let shuttingDown = false;

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (child && !child.killed) {
      child.kill();
    }
  }
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});

for (const child of children) {
  child.on('exit', (code) => {
    if (shuttingDown) return;

    if (code !== 0 && code !== null) {
      console.error(`A development process exited with code ${code}.`);
      shutdown();
      process.exitCode = code;
    }
  });
}
