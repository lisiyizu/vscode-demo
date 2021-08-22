import * as vscode from 'vscode';
// import path from 'path';
// import fs from 'fs';
const path = require('path');
const fs = require('fs');

export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.languages.registerHoverProvider({
		pattern: '**/components/**'
	}, {
		provideHover(document, position, token) {
			const fileName    = document.fileName;
			const workDir     = path.dirname(fileName);
			const word        = document.getText(document.getWordRangeAtPosition(position));
			return new vscode.Hover("你好");
		}
	}));

	context.subscriptions.push(vscode.languages.registerHoverProvider('typescriptreact', {
		provideHover(document, position, token) {
			const fileName    = document.fileName;
			const workDir     = path.dirname(fileName);
			const word        = document.getText(document.getWordRangeAtPosition(position));

			if (/\.tsx$/.test(fileName)) {
					console.log('进入provideHover方法');
					// const json = document.getText();
					console.log("word", word);
					const markdown = new vscode.MarkdownString();
					markdown.appendMarkdown(word);
					markdown.appendMarkdown(`\n`);
					markdown.appendMarkdown(`预览图片![预览图](https://cdn.poizon.com/node-common/fa2b31239e9b8d18d0ff2a85186a665e.png)`);
					const commentCommandUri1 = vscode.Uri.parse(`command:extension.demo.openWebview`);
					const commentCommandUri2 = vscode.Uri.parse(`command:editor.action.addCommentLine`);
					markdown.appendMarkdown(`[Add comment](${commentCommandUri1})\\n`);
					markdown.appendMarkdown(`\n`);
					markdown.appendMarkdown(`[转跳](${commentCommandUri2})`);
					markdown.isTrusted = true;
					return new vscode.Hover(markdown);
			}
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.demo.openWebview', function (uri) {
		// 创建webview
			const panel = vscode.window.createWebviewPanel(
					'testWebview', // viewType
					"WebView演示", // 视图标题
					vscode.ViewColumn.One, // 显示在编辑器的哪个部位
					{
							enableScripts: true, // 启用JS，默认禁用
							retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
					}
			);
			panel.webview.html = `<html><body>你好，我是Webview</body></html>`
		}));
}