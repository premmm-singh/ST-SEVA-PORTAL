import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function start() {
  console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════');
  console.log('\x1b[36m%s\x1b[0m', '  ST Seva Portal - Full Stack Unified Development');
  console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════');

  const backendRunning = await isPortOpen(8000);
  let backendProcess = null;

  if (backendRunning) {
    console.log('\x1b[32m%s\x1b[0m', '✔ Backend is already active on http://127.0.0.1:8000');
  } else {
    console.log('\x1b[33m%s\x1b[0m', '⚙ Starting FastAPI Backend on port 8000...');
    const winPython = path.join(__dirname, 'backend', 'venv', 'Scripts', 'python.exe');
    const unixPython = path.join(__dirname, 'backend', 'venv', 'bin', 'python');
    const pythonExe = fs.existsSync(winPython) ? winPython : (fs.existsSync(unixPython) ? unixPython : 'python');

    backendProcess = spawn(pythonExe, ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8000'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit',
      shell: true
    });

    backendProcess.on('error', (err) => {
      console.error('\x1b[31m%s\x1b[0m', 'Backend failed to spawn:', err.message);
    });
  }

  console.log('\x1b[33m%s\x1b[0m', '⚡ Starting Vite Frontend on port 5173...');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const frontendProcess = spawn(npmCmd, ['--prefix', 'frontend', 'run', 'dev'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  const cleanup = () => {
    console.log('\nStopping servers...');
    if (backendProcess) {
      try { backendProcess.kill(); } catch (e) {}
    }
    if (frontendProcess) {
      try { frontendProcess.kill(); } catch (e) {}
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

start();
