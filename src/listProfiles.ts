import { loadSharedConfigFiles } from "@aws-sdk/shared-ini-file-loader";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";

export async function listProfiles(): Promise<string[]> {
  const configs = await loadSharedConfigFiles({ignoreCache: true});
  return Object.keys({
    ...configs.configFile,
    ...configs.credentialsFile,
  });
}

export async function isValidProfile(profile: string): Promise<boolean> {
  try {
    const credentialProvider = fromNodeProviderChain({ profile });
    const stsclient = new STSClient({ credentials: credentialProvider });
    const stscommand = new GetCallerIdentityCommand({});
    const stsresponse = await stsclient.send(stscommand);
    return stsresponse.Account !== undefined;
  }
  catch (err) {
    console.error(JSON.stringify(err));
    return false;
  }
}