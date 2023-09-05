import * as vscode from "vscode"; 
import { StartSessionCommandOutput, StartSessionCommand, SSMClient, TerminateSessionCommand } from "@aws-sdk/client-ssm";
import { spawn } from "child_process";

export function startSSMPluginAndWait(sessionResponse: StartSessionCommandOutput, profile: string, region: string, command: StartSessionCommand, client: SSMClient): Promise<string | undefined>  {
    return new Promise((resolve, reject) => {
        const ssmPluginArgs: string[] = [
            JSON.stringify(sessionResponse),
            region,
            'StartSession',
            profile,
            JSON.stringify(command.input),
            `https://ssm.${region}.amazonaws.com`
        ];
        
        const child = spawn('session-manager-plugin', ssmPluginArgs);
        
        const sessionId = sessionResponse.SessionId;
        child.stdout.on('data', (data) => {
            console.log(`${data}`);
            vscode.window.showInformationMessage(`${data}`);
            vscode.commands.executeCommand('apf.session-list.refresh', 'ssm_plugin_data');
            if (data.toString().includes('Waiting for connections')) {
                resolve(sessionId);
            }
        });
        child.on('error', (err) => {
            console.error(`Error: ${JSON.stringify(err)}`);
            vscode.window.showErrorMessage('Failed to start SSM plugin.');
            vscode.commands.executeCommand('apf.session-list.refresh', 'ssm_plugin_error');
            reject();
        });
        child.on('exit', async function () {
            console.log(`Closing Session ${sessionId}`);
            const input = {
                SessionId: sessionId,
            };
            const command = new TerminateSessionCommand(input);
            await client.send(command);
            console.log(`Closed session ${sessionId}`);
        });
      });
}
