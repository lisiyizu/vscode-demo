import * as vscode from 'vscode';
import { uploadFile } from './upload';

const imgType = /\.(jpg|jpeg|png|svg|gif|webp|apng)$/g;
const audioType = /\.(mp3|m4a|aac|oga)$/g;
const videoType = /\.(mp4|webm|wav)$/g;

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerTextEditorCommand(
		'extension.du.upload', 
		async function () {
			try {
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
				// console.log("files", files);
				const file = files[0];
				const url = await uploadFile({ file });
				// console.log("url=", url);
				
				const activeEditor = vscode.window.activeTextEditor;
				if (!url || !activeEditor || !activeEditor.selection || !activeEditor.selection.active) {
					return;
				}
				// console.log("activeEditor.selection", activeEditor.selection);
				const activePosition = activeEditor.selection.active;
				activeEditor.edit((edit: any) => {
					edit.insert(activePosition, url);
				});
			} catch(e) {
				console.error(e);
				vscode.window.showErrorMessage('上传失败');
			}
		})
	);

	context.subscriptions.push(vscode.languages.registerHoverProvider({ pattern: '**' }, {
		provideHover(doc, position) {
			// console.log("doc", doc, position);
			// const fileName = doc.fileName;
			// const word = doc.getText(doc.getWordRangeAtPosition(position));
			const line = doc.lineAt(position).text;
			// console.log('进入provideHover方法');
			// console.log("fileName, word", fileName, line);
			const reg = /(http|https):\/\/([\w.]+\/?)[^';"\s]*/g;
			const arr = reg.exec(line);
			// console.log("reg.exec(line)", arr);
			if (arr && arr.length) {
				const url = arr[0] || '';
				const urlBeginIndex = line.indexOf(url);
				const urlEndIndex = urlBeginIndex + url.length;
				const cursorPosition = position.character;
				const markdown = new vscode.MarkdownString();
				// 鼠标处于url之上
				if (cursorPosition >= urlBeginIndex && cursorPosition <= urlEndIndex) {
					switch(true) {
						// 判断是否为图片
						case imgType.test(url):
							markdown.appendMarkdown(`![](${url})`);
							break;
						// 判断是否为视频文件
						case videoType.test(url):
							// vscode.MarkdownString不支持媒体类
							markdown.appendMarkdown(`<video id="video" controls="" preload="none"><source id="mp4" src="${url}"></video>`);
							break;
						// 判断是否为音频文件
						case audioType.test(url):
							// vscode.MarkdownString不支持媒体类
							markdown.appendMarkdown(`<audio id="audio" controls="" preload="none"><source id="mp3" src="${url}"></audio>`);
							break;
					}
					markdown.isTrusted = true;
					return new vscode.Hover(markdown);
				}
			}
			return null;
		}
	}));
}

export function deactivate() {}
