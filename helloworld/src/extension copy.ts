// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';


function commentLine() {
	vscode.commands.executeCommand('editor.action.addCommentLine');
}

async function printDefinitionsForActiveEditor() {
	const activeEditor = vscode.window.activeTextEditor;
	if (!activeEditor) {
			return;
	}

	const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
			'vscode.executeDefinitionProvider',
			activeEditor.document.uri,
			activeEditor.selection.active
	);
	
	if (!definitions) {
		return;
	}
	
	for (const definition of definitions) {
			console.log(definition);
			console.log(definition);
	}
}

function hoverProvider() {
	vscode.languages.registerHoverProvider(
		'javascript',
		new class implements vscode.HoverProvider {
				provideHover(
						_document: vscode.TextDocument,
						_position: vscode.Position,
						_token: vscode.CancellationToken
				): vscode.ProviderResult<vscode.Hover> {
						const commentCommandUri = vscode.Uri.parse(`command:editor.action.addCommentLine`);
						const contents = new vscode.MarkdownString(`[Add comment](${commentCommandUri})`);

						// command URIs如果想在Markdown 内容中生效, 你必须设置`isTrusted`。
						// 当创建可信的Markdown 字符, 请合理地清理所有的输入内容
						// 以便你期望的命令command URIs生效
						contents.isTrusted = true;

						return new vscode.Hover(contents);
				}
		}()
);
}

function sayHello(context: vscode.ExtensionContext) {
	const command = 'myExtension.sayHello';

	const commandHandler = (name: string = 'world') => {
			console.log(`Hello ${name}!!!`);
			vscode.window.showInformationMessage(`Hello ${name}!!!`);
	};

	const disposable = vscode.commands.registerCommand(command, commandHandler);

	context.subscriptions.push(disposable);

	vscode.commands.executeCommand(command);
}

function textListener(context: vscode.ExtensionContext) {
	let activeEditor = vscode.window.activeTextEditor;
	// const text = activeEditor?.document.getText();
	// console.log("text", text);
	vscode.workspace.onDidChangeTextDocument(
    event => {
			console.log("onDidChangeTextDocument event", event);
        if (activeEditor && event.document === activeEditor.document) {
					console.log("event.document === activeEditor.document");
        }
			console.log("onDidChangeTextDocument event text", event.document.getText());
    },
    null,
    context.subscriptions
	);
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "helloworld" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('helloworld.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello VS Code from helloworld!');
	});

	context.subscriptions.push(disposable);

	let disposable2 = vscode.commands.registerCommand('helloworld.showTime', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		// const time = new Date();
		// vscode.window.showWarningMessage(`现在的时间是${time}`);
		// commentLine();
		// printDefinitionsForActiveEditor();
		// hoverProvider();
		// vscode.window.showErrorMessage(`与starling的远程交互依赖vscode-starling.sid配置项`, '打开配置项').then(selection => {
		// 	if (selection === '打开配置项') {
		// 		vscode.commands.executeCommand('workbench.action.openSettings');
		// 	}
		// });
		// const lang: string | undefined = await vscode.window.showQuickPick(['en', 'zh', 'ja'], {
		// 	placeHolder: '第一步：选择语言',
		// });
		// vscode.window.showWarningMessage(`选择的是${lang}`);
	});

	context.subscriptions.push(disposable2);

	// const watcher = vscode.workspace.createFileSystemWatcher('*/components/*.tsx', false, false, false);
	// watcher.onDidChange(e => { // 文件发生更新
	// 	console.log('js changed,', e.fsPath);
	// 	vscode.window.showWarningMessage(`文件发生更新${e.fsPath}`);
	// });
	// watcher.onDidCreate(e => { // 新建了js文件
	// 	console.log('js created,', e.fsPath);
	// 	vscode.window.showWarningMessage(`新建了js文件${e.fsPath}`);
	// });
	// watcher.onDidDelete(e => { // 删除了js文件
	// 	console.log('js deleted,', e.fsPath);
	// 	vscode.window.showWarningMessage(`删除了js文件${e.fsPath}`);
	// });

	// sayHello(context);

	context.subscriptions.push(vscode.commands.registerCommand('helloworld.textListener', () => {
		textListener(context);
	}));
}

vscode.commands.executeCommand('helloworld.textListener');
// this method is called when your extension is deactivated
export function deactivate() {}
