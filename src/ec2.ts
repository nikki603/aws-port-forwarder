import { EC2Client, DescribeInstancesCommand, Instance } from '@aws-sdk/client-ec2';
import { EC2Instance, Profile } from './InstanceTreeProvider'
import {
  TreeItemCollapsibleState
} from "vscode";
import { fromIni } from "@aws-sdk/credential-providers";

export async function listEC2Instances(profile: Profile): Promise<EC2Instance[]> {
  const credentials = fromIni({ profile: profile.name });
  const client = new EC2Client({
    region: profile.region,
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

  // Output the instance details
  instances.forEach((instance) => {
    console.log(`Instance ID: ${instance.InstanceId}`);
    console.log(`Instance State: ${instance.State?.Name}`);
    console.log('---');
  });

  return instances?.map(instance => {
    const nameTag = instance.Tags?.find(tag => tag.Key === 'Name');
    return new EC2Instance(
      nameTag?.Value || instance.InstanceId || '',
      instance.State?.Name || '',
      instance.InstanceId || '',
      instance.Platform || '',
      TreeItemCollapsibleState.None
    );
  })
  .sort((a, b) => a.label.localeCompare(b.label));
}