/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { SSMClient, StartSessionCommand } from '@aws-sdk/client-ssm';
import { EC2Instance, Profile } from './InstanceTreeProvider';
import { fromIni } from "@aws-sdk/credential-providers";

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