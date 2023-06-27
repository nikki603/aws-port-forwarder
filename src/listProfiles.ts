import { loadSharedConfigFiles } from "@aws-sdk/shared-ini-file-loader";

export async function listProfiles(): Promise<string[]> {
  const configs = await loadSharedConfigFiles();
  return Object.keys({
    ...configs.configFile,
    ...configs.credentialsFile,
  });
}