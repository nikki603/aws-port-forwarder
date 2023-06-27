/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { SSMClient, StartSessionCommand, TerminateSessionCommand, DescribeSessionsCommand, StartSessionCommandOutput } from '@aws-sdk/client-ssm';
import { Profile } from "./models/profile.model";
import { EC2Instance } from "./models/ec2Instance.model";
import { Session } from "./models/session.model";
import { fromIni } from "@aws-sdk/credential-providers";
import { spawn } from 'child_process';
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts"; 
import { profilesKey } from './constants';
import { sort } from './utils';

export async function startPortForwardingSession(context: vscode.ExtensionContext, target: EC2Instance, localPort: string, remotePort: string): Promise<void> {
    const profile: Profile | undefined = context.globalState.get(profilesKey);
    if (!profile) {
        throw new Error('profile');
    }
    const credentials = fromIni({ profile: profile.name });
    const client = new SSMClient({
        region: profile.region,
        credentials: credentials
    });

    const command = new StartSessionCommand({
        DocumentName: 'AWS-StartPortForwardingSession',
        Target: target.instanceId,
        Reason: `${localPort} -> ${target.label}:${remotePort}`,
        Parameters: {
            "portNumber": [remotePort],
            "localPortNumber": [localPort],
        }
    });

    const response = await client.send(command);

    startSSMPlugin(response, profile, command, client);
}

export async function startRemotePortForwardingSession(context: vscode.ExtensionContext, target: EC2Instance, localPort: string, remotePort: string, remoteHost: string): Promise<void> {
    const profile: Profile | undefined = context.globalState.get(profilesKey);
    if (!profile) {
        throw new Error('profile');
    }
    const credentials = fromIni({ profile: profile.name });
    const client = new SSMClient({
        region: profile.region,
        credentials: credentials
    });

    const command = new StartSessionCommand({
        DocumentName: 'AWS-StartPortForwardingSessionToRemoteHost',
        Target: target.instanceId,
        Reason: `${localPort} -> ${remoteHost}:${remotePort}`,
        Parameters: {
            "host": [remoteHost],
            "portNumber": [remotePort],
            "localPortNumber": [localPort],
        }
    });

    const response = await client.send(command);
    startSSMPlugin(response, profile, command, client);
}

export async function listConnectedSessions(profile: Profile): Promise<Session[] | undefined> {
    const credentials = fromIni({ profile: profile.name });

    const stsclient = new STSClient({credentials: credentials});
    const stscommand = new GetCallerIdentityCommand({});
    const stsresponse = await stsclient.send(stscommand);

    const client = new SSMClient({
        region: profile.region,
        credentials: credentials
    });

    const command = new DescribeSessionsCommand({
        State: 'Active',
        Filters: [ 
            { 
                key: "Owner", 
                value: stsresponse.Arn, 
            },
        ]
    });

    const response = await client.send(command);

  const sessions = response.Sessions;

  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/classes/describesessionscommand.html
  var sessionViewItems = sessions?.map(session => {
    return new Session(
      session.Reason || session.SessionId || '',
      session.SessionId || '',
      session.Status || '',
      session.Target || '',
      session.StartDate || new Date(),
      session.DocumentName || '',
      session.Reason || '',
      profile,
      vscode.TreeItemCollapsibleState.None
    );
  }) || [];
  const getLabel = (session: Session): string => session.label;
  return sort(sessionViewItems, getLabel);
}

export async function terminateSession(context: vscode.ExtensionContext, sessionId: string): Promise<void> {
    const profile: Profile | undefined = context.globalState.get(profilesKey);
    if (!profile) {
        throw new Error('profile');
    }
    const credentials = fromIni({ profile: profile.name });
    const client = new SSMClient({
        region: profile.region,
        credentials: credentials
    });

    const command = new TerminateSessionCommand({
       SessionId: sessionId
    });

    const response = await client.send(command);
}

function startSSMPlugin(sessionResponse: StartSessionCommandOutput, profile: Profile, command: StartSessionCommand, client: SSMClient) {
    const ssmPluginArgs: string[] = [
        JSON.stringify(sessionResponse),
        profile.region,
        'StartSession',
        profile.name,
        JSON.stringify(command.input),
        `https://ssm.${profile.region}.amazonaws.com`
    ];

    const child = spawn('session-manager-plugin', ssmPluginArgs);

    const sessionId = sessionResponse.SessionId;
    child.stdout.on('data', (data) => {
        console.log(`${data}`);
        vscode.window.showInformationMessage(`${data}`);
    });
    child.on('error', (err) => {
        console.error(`Error: ${JSON.stringify(err)}`);
        vscode.window.showErrorMessage('Failed to start SSM plugin.');
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
}