import * as vscode from 'vscode';
// import path from 'path';
// import fs from 'fs';
const path = require('path');
const fs = require('fs');

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.languages.registerHoverProvider('json', {
		provideHover(document, position, token) {
			const fileName    = document.fileName;
			const workDir     = path.dirname(fileName);
			const word        = document.getText(document.getWordRangeAtPosition(position));

			if (/\/package\.json$/.test(fileName)) {
					console.log('进入provideHover方法');
					const json = document.getText();
					console.log("fileName", fileName, workDir, word, json);
					return new vscode.Hover('aa');
					if (new RegExp(`"(dependencies|devDependencies)":\\s*?\\{[\\s\\S]*?${word.replace(/\//g, '\\/')}[\\s\\S]*?\\}`, 'gm').test(json)) {
							let destPath = `${workDir}/node_modules/${word.replace(/"/g, '')}/package.json`;
							if (fs.existsSync(destPath)) {
									const content = require(destPath);
									console.log('hover已生效');
									// hover内容支持markdown语法
									return new vscode.Hover(`* **名称**：${content.name}\n* **版本**：${content.version}\n* **许可协议**：${content.license}`);
							}
					}
			}
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
					return new vscode.Hover(word);
			}
		}
	}));
}