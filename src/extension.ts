import * as vscode from 'vscode';
import { InstanceTreeProvider } from "./InstanceTreeProvider";
import { EC2Instance } from "./models/ec2Instance.model";
import { SessionTreeProvider } from "./SessionTreeProvider";
import { Session } from './models/session.model';
import { RefreshManager } from './RefreshManager';

export async function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "aws-port-forwarder" is now active!');

	// Register providers
	const ec2InstanceListViewProvider = new InstanceTreeProvider(context);
	vscode.window.registerTreeDataProvider('apf.instance-list', ec2InstanceListViewProvider);

	const sessionListViewProvider = new SessionTreeProvider(context);
	vscode.window.registerTreeDataProvider('apf.session-list', sessionListViewProvider);

	// Register commands
	vscode.commands.registerCommand('apf.ec2-instances.refresh', () => {
		ec2InstanceListViewProvider.refresh();
	});
	vscode.commands.registerCommand('apf.session-list.refresh', () => {
		sessionListViewProvider.refresh();
	});
	vscode.commands.registerCommand('apf.ec2-instances.configureProfile', () => {
		ec2InstanceListViewProvider.configureProfile();
	});
	vscode.commands.registerCommand('apf.connectPortForward', async (node: EC2Instance) => {
		sessionListViewProvider.startPortForwardingSession(context, node);
	});
	vscode.commands.registerCommand('apf.connectRemotePortForward', async (node: EC2Instance) => {
		sessionListViewProvider.startRemotePortForwardingSession(context, node);
	});
	vscode.commands.registerCommand('apf.terminateSession', async (node: Session) => {
		sessionListViewProvider.terminateSession(context, node);
	});

	// Register the refresh manager
    context.subscriptions.push(new RefreshManager());
}

// This method is called when your extension is deactivated
export function deactivate() {}
