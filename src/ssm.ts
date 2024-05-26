/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import { SSMClient, StartSessionCommand, TerminateSessionCommand, DescribeSessionsCommand, StartSessionCommandOutput, DescribeInstanceInformationCommand, InstanceInformation } from '@aws-sdk/client-ssm';
import { EC2InstanceTreeItem } from "./models/ec2Instance.model";
import { Session } from "./models/session.model";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { sort } from './utils';
import {
    TreeItemCollapsibleState
  } from "vscode";
import { ManagedInstance } from "./models/managedInstance.model";
import { InstanceBase } from "./models/instanceBase.model";

export async function startPortForwardingSession(
        profile: string,
        region: string,
        target: InstanceBase,
        localPort: string,
        remotePort: string,
        startSSMPlugin: (a: StartSessionCommandOutput, b: string, c: string, d: StartSessionCommand, e: SSMClient) => Promise<string | undefined>): Promise<void> {
    const credentialProvider = fromNodeProviderChain({ profile });
    const client = new SSMClient({
        region: region,
        credentials: credentialProvider
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

    await startSSMPlugin(response, profile, region, command, client);
}

export async function startRemotePortForwardingSession(
        profile: string,
        region: string,
        target: InstanceBase,
        localPort: string,
        remotePort: string,
        remoteHost: string,
        startSSMPlugin: (a: StartSessionCommandOutput, b: string, c: string, d: StartSessionCommand, e: SSMClient) => Promise<string | undefined>): Promise<void> {
    const credentialProvider = fromNodeProviderChain({ profile });
    const client = new SSMClient({
        region: region,
        credentials: credentialProvider
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
    await startSSMPlugin(response, profile, region, command, client);
}

export async function listConnectedSessions(profile: string, region: string): Promise<Session[] | undefined> {
    try {
        const credentialProvider = fromNodeProviderChain({ profile });

        const stsclient = new STSClient({ credentials: credentialProvider });
        const stscommand = new GetCallerIdentityCommand({});
        const stsresponse = await stsclient.send(stscommand);

        const client = new SSMClient({
            region: region,
            credentials: credentialProvider
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
    } catch (error) {
        console.log(JSON.stringify(error));
        return undefined;
    }
    
}

export async function terminateSession(profile: string, region: string, sessionId: string): Promise<void> {
    const credentialProvider = fromNodeProviderChain({ profile });
    const client = new SSMClient({
        region: region,
        credentials: credentialProvider
    });

    const command = new TerminateSessionCommand({
        SessionId: sessionId
    });

    const response = await client.send(command);
}

export async function listManagedInstances(profile: string, region: string): Promise<ManagedInstance[] | EC2InstanceTreeItem[]> {
    try {
        const credentialProvider = fromNodeProviderChain({ profile });

        const client = new SSMClient({
            region: region,
            credentials: credentialProvider
        });

        let nextToken: string | undefined;
        let allInstances: InstanceInformation[] = [];

        do {
            const command = new DescribeInstanceInformationCommand({
                Filters: [
                {
                    Key: "ResourceType",
                    Values: ["ManagedInstance"],
                },
                {
                    Key: "PingStatus",
                    Values: ["Online"],
                }
                ],
                NextToken: nextToken
            });

            const response = await client.send(command);

            const instances = response.InstanceInformationList;
            allInstances = allInstances.concat(instances || []);
            nextToken = response.NextToken;

        } while (nextToken);

        var instanceItems = allInstances?.map(instance => {
            return new ManagedInstance(
              instance.Name || instance.InstanceId || '',
              instance.PingStatus || '',
              instance.InstanceId || '',
              instance.PlatformType || '',
              instance.IPAddress || '',
              TreeItemCollapsibleState.None
            );
          }) || [];
          const getLabel = (i: ManagedInstance): string => i.label;
          return sort(instanceItems, getLabel);
    } catch (error) {
        console.error(JSON.stringify(error));
        return [];
    }
}
