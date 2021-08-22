import * as vscode from 'vscode';

/**
 * 监听的文件类型
 */
const FILE_TYPES = ['.vue', '.tsx', '.jsx', '.ts', '.js'];

export function activate(context: vscode.ExtensionContext) {

	vscode.languages.registerHoverProvider('typescript', {
		provideHover(doc: vscode.TextDocument) {
			return new vscode.Hover('For *all* TypeScript documents.');
		}
	});
	vscode.workspace.onDidChangeTextDocument(
    event => {
			console.log("onDidChangeTextDocument event", event);
			const { fileName='' } = event.document;
			const suffixIndex = fileName.lastIndexOf('.');
			const fileType = fileName.substring(suffixIndex);
			console.log("fileType", fileType);
			const activeEditor = vscode.window.activeTextEditor;
			console.log("activeEditor", activeEditor);
			
			// 当前编辑页面且符合的文件类型
			if (activeEditor && event.document === activeEditor.document && FILE_TYPES.includes(fileType)) {
				
				const line = activeEditor?.selection.active.line;
				const lineAt = event.document.lineAt;
				const lineText = lineAt(line).text;
				console.log("lineText", lineText);
				if (lineText === 'import') {
					vscode.window.showInformationMessage(lineText);
				}
				const markdown = new vscode.MarkdownString(`你好`, true);
				markdown.appendMarkdown('lala');
				markdown.isTrusted = true;
  			const hover = new vscode.Hover(markdown);
			}
    },
    null,
    context.subscriptions
	);
}
