import { loadSharedConfigFiles } from "@aws-sdk/shared-ini-file-loader";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { fromIni } from "@aws-sdk/credential-providers";

export async function listProfiles(): Promise<string[]> {
  const configs = await loadSharedConfigFiles({ignoreCache: true});
  return Object.keys({
    ...configs.configFile,
    ...configs.credentialsFile,
  });
}

export async function isValidProfile(profile: string): Promise<boolean> {
  try {
    const credentials = fromIni({ profile: profile });
    const stsclient = new STSClient({ credentials: credentials });
    const stscommand = new GetCallerIdentityCommand({});
    const stsresponse = await stsclient.send(stscommand);
    return stsresponse.Account !== undefined;
  }
  catch (err) {
    console.error(JSON.stringify(err));
    return false;
  }
  
}