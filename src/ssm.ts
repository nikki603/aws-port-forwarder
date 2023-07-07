/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { SSMClient, StartSessionCommand, TerminateSessionCommand, DescribeSessionsCommand, StartSessionCommandOutput } from '@aws-sdk/client-ssm';
import { EC2Instance } from "./models/ec2Instance.model";
import { Session } from "./models/session.model";
import { fromIni } from "@aws-sdk/credential-providers";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { sort } from './utils';

export async function startPortForwardingSession(
        profile: string,
        region: string,
        target: EC2Instance,
        localPort: string,
        remotePort: string,
        startSSMPlugin: (a: StartSessionCommandOutput, b: string, c: string, d: StartSessionCommand, e: SSMClient) => void): Promise<void> {
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

export async function startRemotePortForwardingSession(
        profile: string,
        region: string,
        target: EC2Instance,
        localPort: string,
        remotePort: string,
        remoteHost: string,
        startSSMPlugin: (a: StartSessionCommandOutput, b: string, c: string, d: StartSessionCommand, e: SSMClient) => void): Promise<void> {
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

    const stsclient = new STSClient({ credentials: credentials });
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
