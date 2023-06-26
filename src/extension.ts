// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { EC2Instance, InstanceTreeProvider } from "./InstanceTreeProvider";
import { SessionTreeProvider } from "./SessionTreeProvider";
import { startPortForwardingSession } from './ssm';
import { RefreshManager } from './RefreshManager';
// import { SharedCredentialsProviderFactory } from './auth/providers/sharedCredentialsProviderFactory'
// import { CredentialsProviderManager } from './auth/providers/credentialsProviderManager'
// import {
//     initializeComputeRegion
// } from './shared/extensionUtilities'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "aws-port-forwarder" is now active!');

	// await initializeComputeRegion()
	// initializeCredentialsProviderManager()

	const ec2InstanceListViewProvider = new InstanceTreeProvider(context);
	vscode.window.registerTreeDataProvider('apf.instance-list', ec2InstanceListViewProvider);

	const sessionListViewProvider = new SessionTreeProvider(context);
	vscode.window.registerTreeDataProvider('apf.session-list', sessionListViewProvider);

	// Refresh
	vscode.commands.registerCommand('apf.ec2-instances.refresh', () => {
		ec2InstanceListViewProvider.refresh();
	});
	vscode.commands.registerCommand('apf.session-list.refresh', () => {
		sessionListViewProvider.refresh();
	});

	// Configure account
	vscode.commands.registerCommand('apf.ec2-instances.configureProfile', () => {
		ec2InstanceListViewProvider.configureProfile();
	});

	vscode.commands.registerCommand('apf.connectPortForward', async (node: EC2Instance) => {
		startPortForwardingSession(context, node);
	});

	// Register the refresh manager
    context.subscriptions.push(new RefreshManager());
}

// This method is called when your extension is deactivated
export function deactivate() {}
