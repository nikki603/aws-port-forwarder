/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { SSMClient, StartSessionCommand, TerminateSessionCommand } from '@aws-sdk/client-ssm';
import { EC2Instance, Profile } from './InstanceTreeProvider';
import { fromIni } from "@aws-sdk/credential-providers";
import { spawn } from 'child_process';

const profilesKey = 'apf.profiles';

export async function startPortForwardingSession(context: vscode.ExtensionContext, target: EC2Instance): Promise<string | undefined> {
    const profile: Profile | undefined = context.globalState.get(profilesKey);
    if (!profile) {
        throw new Error('profile');
    }
    const credentials = fromIni({ profile: profile.name });
    const client = new SSMClient({
        region: profile.region,
        credentials: credentials
    });

    const localPort = await vscode.window.showInputBox({
        prompt: 'Enter local host port',
        placeHolder: '22'
    });
    if (!localPort) {
        throw new Error('localPort');
    }

    const remotePort = await vscode.window.showInputBox({
        prompt: 'Enter remote host port',
        placeHolder: '22'
    });
    if (!remotePort) {
        throw new Error('remotePort');
    }

    const command = new StartSessionCommand({
        DocumentName: 'AWS-StartPortForwardingSession',
        Target: target.instanceId,
        Reason: 'Remote access from aws-port-forwarder vscode extension',
        Parameters: {
            "portNumber": [remotePort],
            "localPortNumber": [localPort],
        }
    });

    const response = await client.send(command);

    const sessionId = response.SessionId;
    const ssmPluginArgs : string[] = [ 
        JSON.stringify(response),
        profile.region,
        'StartSession',
        profile.name,
        JSON.stringify(command.input), 
        `https://ssm.${profile.region}.amazonaws.com`
    ];

    const p = process;
    const child = spawn('session-manager-plugin', ssmPluginArgs);

    child.stdout.on('data', (data) => {
        console.log(`apf: ${data}`);
      });
    child.on('error', (err) => {
        console.error('Failed to start SSM plugin.');
      }); 
    child.on('exit', async function () {
        console.log(`Closing Session ${sessionId}`);
        const input = {
            SessionId: sessionId,
          };
          const command = new TerminateSessionCommand(input);
          const response = await client.send(command);
          console.log(`Closed session ${sessionId}`);
    });

    return sessionId;
}

export async function startRemotePortForwardingSession(context: vscode.ExtensionContext, target: EC2Instance): Promise<void> {
    const profile: Profile | undefined = context.globalState.get(profilesKey);
    if (!profile) {
        throw new Error('profile');
    }
    const credentials = fromIni({ profile: profile.name });
    const client = new SSMClient({
        region: profile.region,
        credentials: credentials
    });

    const localPort = await vscode.window.showInputBox({
        prompt: 'Enter local host port',
        placeHolder: '22'
    });
    if (!localPort) {
        throw new Error('localPort');
    }

    const remoteHost = await vscode.window.showInputBox({
        prompt: 'Enter remote host'
    });
    if (!remoteHost) {
        throw new Error('remoteHost');
    }

    const remotePort = await vscode.window.showInputBox({
        prompt: 'Enter remote host port',
        placeHolder: '22'
    });
    if (!remotePort) {
        throw new Error('remotePort');
    }

    const command = new StartSessionCommand({
        DocumentName: 'AWS-StartPortForwardingSessionToRemoteHost',
        Target: target.instanceId,
        Reason: 'Remote access from aws-port-forwarder vscode extension',
        Parameters: {
            "host": [remoteHost],
            "portNumber": [remotePort],
            "localPortNumber": [localPort],
        }
    });

    const response = await client.send(command);

    const sessionId = response.SessionId;
}