import * as vscode from "vscode"; 
import { spawn } from "child_process";
import * as net from 'net';

const windows = 'win32';
const macos = 'darwin';

export async function getAvailablePort(): Promise<number> {
    let start = vscode.workspace.getConfiguration('apf').get<number>('rdp.portRange.startNumber', 20000);
    let end = vscode.workspace.getConfiguration('apf').get<number>('rdp.portRange.endNumber', 29999);

    validatePorts(start, end);

    let attempts = 0;
    let port = 0;
    do {
        port = Math.floor(Math.random() * (end - start + 1)) + start;
        
        if (attempts++ >= 1000) {
            const err = `Open port can\'t be found in a timely manner in the given range ${start}-${end}`;
            console.error(err);
            vscode.window.showErrorMessage(err);
            throw new Error(err);
        }
    }
    while (await isPortInUse(port));

    return port;
}

export async function startRdpSession(localPortNumber: number): Promise<void> {
    let rdpEnabled = vscode.workspace.getConfiguration('apf').get<boolean>('rdp.enabled', false);
    if (!rdpEnabled) {
        return;
    }

    switch (process.platform) {
        case windows:
            startWindows(localPortNumber);
            break;
        case macos:
            startMac(localPortNumber);
            break;
        default:
            break;
    }
}

function isPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer()
        .once('error', () => resolve(true))
        .once('listening', () => {
          server.close(() => resolve(false));
        })
        .listen(port);
    });
}

function validatePorts(start: number, end: number) {
    if (start > end) {
        const err = `Invalid port range configured for RDP sessions: ${start}-${end}`;
        console.error(err);
        vscode.window.showErrorMessage(err);
        throw new Error(err);
    }
}

function startWindows(localPortNumber: number) {
    const rdpArgs: string[] = [
        '/f', //fullscreen
        `/v:localhost:${localPortNumber}`
    ];

    runCommand('mstsc', rdpArgs);
}

function startMac(localPortNumber: number) {
    const rdpArgs: string[] = [
        '-a',
        '/Applications/Microsoft\ Remote\ Desktop.app',
        `rdp://full%20address=s:localhost:${localPortNumber}&screen%20mode%20id:i:2`
    ];

    runCommand('open', rdpArgs);
}

function runCommand(command: string, args: string[]) {
    const child = spawn(command, args);

    child.on('error', (err) => {
        console.error(`Error: ${JSON.stringify(err)}`);
        vscode.window.showErrorMessage('Failed to start Microsoft Remote Desktop');
    });
}
