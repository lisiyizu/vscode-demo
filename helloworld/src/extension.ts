import * as vscode from 'vscode';
// import path from 'path';
// import fs from 'fs';
import { uploadFile } from './upload';
const path = require('path');
const fs = require('fs');
import { html } from './template';

const imgType = ['jpg', 'jpeg', 'gif', 'png', 'bmp', 'svg'];
const audioType = ['mp3'];
const videoType = ['mp4'];

export function activate(context: vscode.ExtensionContext) {



	// context.subscriptions.push(vscode.languages.registerHoverProvider({
	// 	pattern: '**/components/**'
	// }, {
	// 	provideHover(document, position, token) {
	// 		const fileName    = document.fileName;
	// 		const workDir     = path.dirname(fileName);
	// 		const word        = document.getText(document.getWordRangeAtPosition(position));
	// 		return new vscode.Hover("你好");
	// 	}
	// }));

	// context.subscriptions.push(vscode.languages.registerHoverProvider('typescriptreact', {
	// 	provideHover(document, position, token) {
	// 		const fileName    = document.fileName;
	// 		const workDir     = path.dirname(fileName);
	// 		const word        = document.getText(document.getWordRangeAtPosition(position));

	// 		if (/\.tsx$/.test(fileName)) {
	// 				console.log('进入provideHover方法');
	// 				// const json = document.getText();
	// 				console.log("word", word);
	// 				const markdown = new vscode.MarkdownString();
	// 				markdown.appendMarkdown(word);
	// 				markdown.appendMarkdown(`\n`);
	// 				markdown.appendMarkdown(`预览图片![预览图](https://cdn.poizon.com/node-common/fa2b31239e9b8d18d0ff2a85186a665e.png)`);
	// 				const commentCommandUri1 = vscode.Uri.parse(`command:extension.demo.openWebview`);
	// 				const commentCommandUri2 = vscode.Uri.parse(`command:editor.action.addCommentLine`);
	// 				markdown.appendMarkdown(`[Add comment](${commentCommandUri1})\\n`);
	// 				markdown.appendMarkdown(`\n`);
	// 				markdown.appendMarkdown(`[转跳](${commentCommandUri2})`);
	// 				markdown.isTrusted = true;
	// 				return new vscode.Hover(markdown);
	// 		}
	// 	}
	// }));

	// context.subscriptions.push(vscode.commands.registerCommand('extension.demo.openWebview', function (uri) {
	// 	// 创建webview
	// 		const panel = vscode.window.createWebviewPanel(
	// 				'testWebview', // viewType
	// 				"WebView演示", // 视图标题
	// 				vscode.ViewColumn.One, // 显示在编辑器的哪个部位
	// 				{
	// 						enableScripts: true, // 启用JS，默认禁用
	// 						retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
	// 				}
	// 		);
	// 		panel.webview.html = `<html><body>你好，我是Webview</body></html>`
	// 	}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand(
		'extension.du.uploadImage', 
		async function () {
			const files: any = await vscode.window.showOpenDialog({
				canSelectFolders: false,
				canSelectMany: false,
				// filters: {
				// 	images: ['jpg', 'jpeg', 'gif', 'png', 'bmp', 'svg']
				// },
			});
			if (!files || !Array.isArray(files)) {
				return;
			};
			console.log("files", files);
			const file = files[0];
			const url = await uploadFile({ file });
			console.log("url=", url);
			
			const activeEditor = vscode.window.activeTextEditor;
			if (!url || !activeEditor || !activeEditor.selection || !activeEditor.selection.active) {
				return;
			}
			console.log("activeEditor.selection", activeEditor.selection);
			const activePosition = activeEditor.selection.active;
			activeEditor.edit((edit: any) => {
				edit.insert(activePosition, url);
			});
		})
	);

	context.subscriptions.push(vscode.languages.registerHoverProvider({ pattern: '**' }, {
		provideHover(doc, position, token) {
			console.log("doc", doc, position, token);
			const markdown = new vscode.MarkdownString();
			const fileName = doc.fileName;
			// const word = doc.getText(doc.getWordRangeAtPosition(position));
			const line = doc.lineAt(position).text;
			console.log('进入provideHover方法');
			// const json = doc.getText();
			console.log("fileName, word", fileName, line);
			const reg = /(http|https):\/\/([\w.]+\/?)[^';"\s]*/g;
			const arr = reg.exec(line);
			console.log("reg.exec(line)", arr);
			if (arr && arr.length) {
				const url = arr[0] || '';
				const urlBeginIndex = line.indexOf(url);
				const urlEndIndex = urlBeginIndex + url.length;
				const suffix = url.substring(url.lastIndexOf('.') + 1);
				const cursorPosition = position.character;
				console.log("suffix", suffix);
				// 鼠标处于url之上
				if (cursorPosition >= urlBeginIndex && cursorPosition <= urlEndIndex) {
					// 判断是否为图片
					if (imgType.includes(suffix)) {
						markdown.appendMarkdown(`![](${url})`);
					} else if (videoType.includes(suffix)) {// vscode.MarkdownString不支持媒体类
						// markdown.appendMarkdown("```HTML");
						// markdown.appendMarkdown("\n");
						markdown.appendMarkdown(`<video id="video" controls="" preload="none"><source id="mp4" src="${url}"></video>`);
						// markdown.appendMarkdown("\n");
						// markdown.appendMarkdown("```");
						// const commentCommandUri1 = vscode.Uri.parse(str);
						// markdown.appendMarkdown('\n');
						// markdown.appendMarkdown(`${commentCommandUri1}`);
					} else if (audioType.includes(suffix)) {// vscode.MarkdownString不支持媒体类
						markdown.appendMarkdown(`<audio id="audio" controls="" preload="none"><source id="mp3" src="${url}"></audio>`);
					}
					console.log("markdown", markdown);
					markdown.isTrusted = true;
					return new vscode.Hover(markdown);
				}
			}
			return null;
			// markdown.appendMarkdown(line);
			// markdown.appendMarkdown(`\n`);
			// markdown.appendMarkdown(`预览图片![预览图](https://cdn.poizon.com/node-common/fa2b31239e9b8d18d0ff2a85186a665e.png)`);
			// const commentCommandUri1 = vscode.Uri.parse(`command:extension.demo.openWebview`);
			// const commentCommandUri2 = vscode.Uri.parse(`command:editor.action.addCommentLine`);
			// markdown.appendMarkdown(`[Add comment](${commentCommandUri1})\\n`);
			// markdown.appendMarkdown(`\n`);
			// markdown.appendMarkdown(`[转跳](${commentCommandUri2})`);
			// markdown.isTrusted = true;
			// return new vscode.Hover(markdown);
		}
	}));

}
