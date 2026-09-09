import { spawn } from 'node:child_process';

console.log('🚀 A iniciar STRIKER (Frontend + Backend)...');

const server = spawn('npm', ['--prefix', 'server', 'run', 'dev'], { stdio: 'inherit', shell: true });
const client = spawn('npm', ['--prefix', 'client', 'run', 'dev'], { stdio: 'inherit', shell: true });

process.on('SIGINT', () => {
  server.kill();
  client.kill();
  process.exit();
});
