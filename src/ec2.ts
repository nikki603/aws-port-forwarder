/* eslint-disable @typescript-eslint/naming-convention */
import { EC2Client, DescribeInstancesCommand, DescribeRegionsCommand } from '@aws-sdk/client-ec2';
import { EC2Instance } from "./models/ec2Instance.model";
import {
  TreeItemCollapsibleState
} from "vscode";
import { fromIni } from "@aws-sdk/credential-providers";
import { sort } from './utils';

export async function getRegions(profile: string): Promise<string[]> {
  const credentials = fromIni({ profile: profile });
  const client = new EC2Client({
    credentials: credentials
  });

  const command = new DescribeRegionsCommand({});
  const response = await client.send(command);

  const regions = response.Regions?.map(region => {
    return region.RegionName;
  }) || [];
  const getSortField = (r: string): string => r;
  return sort(regions, getSortField);
}

export async function listEC2Instances(profile: string, region: string): Promise<EC2Instance[]> {
  const credentials = fromIni({ profile: profile });
  const client = new EC2Client({
    region: region,
    credentials: credentials
  });

  const command = new DescribeInstancesCommand({
    Filters: [
      { Name: 'instance-state-name', Values: ['running'] }
    ]
  });
  const response = await client.send(command);

  // Process the response to obtain the EC2 instances
  const instances = response.Reservations?.flatMap(
    (reservation) => reservation.Instances ?? []
  ) ?? [];

  var instanceItems = instances?.map(instance => {
    const nameTag = instance.Tags?.find(tag => tag.Key === 'Name');
    return new EC2Instance(
      nameTag?.Value || instance.InstanceId || '',
      instance.State?.Name || '',
      instance.InstanceId || '',
      instance.Platform || '',
      instance.PrivateIpAddress || '',
      instance.PublicIpAddress || '',
      TreeItemCollapsibleState.None
    );
  }) || [];
  const getLabel = (i: EC2Instance): string => i.label;
  return sort(instanceItems, getLabel);
}