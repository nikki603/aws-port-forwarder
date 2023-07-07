/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { SSMClient, StartSessionCommand, TerminateSessionCommand, DescribeSessionsCommand, StartSessionCommandOutput } from '@aws-sdk/client-ssm';
import { EC2Instance } from "./models/ec2Instance.model";
import { Session } from "./models/session.model";
import { fromIni } from "@aws-sdk/credential-providers";
import { spawn } from 'child_process';
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts"; 
import { sort } from './utils';

export async function startPortForwardingSession(profile: string, region: string, target: EC2Instance, localPort: string, remotePort: string): Promise<void> {
    const credentials = fromIni({ profile: profile });
    const client = new SSMClient({
        region: region,
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

    startSSMPlugin(response, profile, region, command, client);
}

export async function startRemotePortForwardingSession(profile: string, region: string, target: EC2Instance, localPort: string, remotePort: string, remoteHost: string): Promise<void> {
    const credentials = fromIni({ profile: profile });
    const client = new SSMClient({
        region: region,
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
    startSSMPlugin(response, profile, region, command, client);
}

export async function listConnectedSessions(profile: string, region: string): Promise<Session[] | undefined> {
    const credentials = fromIni({ profile: profile });

    const stsclient = new STSClient({credentials: credentials});
    const stscommand = new GetCallerIdentityCommand({});
    const stsresponse = await stsclient.send(stscommand);

    const client = new SSMClient({
        region: region,
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
      region,
      vscode.TreeItemCollapsibleState.None
    );
  }) || [];
  const getLabel = (session: Session): string => session.label;
  return sort(sessionViewItems, getLabel);
}

export async function terminateSession(profile: string, region: string, sessionId: string): Promise<void> {
    const credentials = fromIni({ profile: profile });
    const client = new SSMClient({
        region: region,
        credentials: credentials
    });

    const command = new TerminateSessionCommand({
       SessionId: sessionId
    });

    const response = await client.send(command);
}

function startSSMPlugin(sessionResponse: StartSessionCommandOutput, profile: string, region: string, command: StartSessionCommand, client: SSMClient) {
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

/*
Error: {"errno":-2,"code":"ENOENT","syscall":"spawn session-manager-plugin","path":"session-manager-plugin","spawnargs":["{\"$metadata\":{\"httpStatusCode\":200,\"requestId\":\"353304da-e429-4238-8f95-4e2d3978a765\",\"attempts\":1,\"totalRetryDelay\":0},\"SessionId\":\"nicole.sands@ihsmarkit.com-01dc4c3150f53f6d3\",\"StreamUrl\":\"wss://ssmmessages.us-east-1.amazonaws.com/v1/data-channel/nicole.sands@ihsmarkit.com-01dc4c3150f53f6d3?role=publish_subscribe&cell-number=AAEAAdAv6B6/fyea7aVtsfJBENBdSq3VSy23SgK1JnZWSXr9AAAAAGSm18el9XyJ+NonD5wqNaz7mTpUPFe8YY3zL6IP86XMJ7u+GA==\",\"TokenValue\":\"AAEAAU9EpmAz1LyiZ4PZ06tBWR3y3NGM6Qaf9y7En0IBHN47AAAAAGSm18hksWGtzEEjsQZUYkPlwOMk4FLPn+E5nHGD8WJ8WtTxzKA+rpvqVHTiwkd0O4S8KDGsWM9g3oq4btGmXLlTmel6mTTyY+YF/AYgciAPNyyP/vgUikN/ZF7jSv9zM3tbAJnF/YjmIMxgaqqNqwD5zsq5Wd0T5PmwRLnALN5wHLX2n1hQvbydvnL6Ef7dXQldgdNybOZXRWE+JbH5H26BDsaeUr+vhjbPw07pHzbWN7OIPcJFzaa6gI7h7rzu7sqIzW911wWL1S194wPvdAkr1PaaDdtmtOAb5JWrDIg1oQLxkU/p4r2QaFMx5O8E058LeSCAuVMx7+iZ+UpA2J9h9TUCNxJBLGyXI1JSSjVLuU5z+U2HXjcrwPpHiM4DOT4FiDL2AXcfwd3OEmv8dFa7Bc6Icor0ZcCyfYqWj6wkQLaksCIp+CtI51N38lWIWXwl7a0XzVR7FAEXnP2rwonfuVSFwYeIoMqFztdEonVtFDuihY9mXsBzu/4Qd967/J4qHYYC3rKSRmzfgw++PclXPd4UxbeCC7/FbcuBSOP1kVZr9b6SITBnoUOWrYW3ZVLavBD3kDncrWpB9AUIESZeGTs6\"}","us-east-1","StartSession","default","{\"DocumentName\":\"AWS-StartPortForwardingSession\",\"Target\":\"i-069682c908990f158\",\"Reason\":\"22 -> Agents ADOPS (bdc-dev-linux):22\",\"Parameters\":{\"portNumber\":[\"22\"],\"localPortNumber\":[\"22\"]}}","https://ssm.us-east-1.amazonaws.com"]}
*/