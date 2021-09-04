import * as vscode from 'vscode';
import { getObjectValue, setJSONFileText, handleScanFileInner, getStringText, setYAMLFileText } from './utils';
const fs = require('fs');
const path = require('path');

import { ViewLoader } from './view/ViewLoader';

interface LangType {
	defaultKey: string;
	language: object;
	langFilePath?: object;
	filePath?: string;
	type?: string;
};

let langObj: LangType = null;
let userKey: string = '';
let includePaths: string = '';
let defaultPath: string = '';
let includeKeys: string = '';
const fileReg = /\.(ts|js|tsx|jsx|vue|html)$/;
const excludeFileReg = /\.(vue|txt|jsx|tsx)$/;
const yamlReg = /\.(yaml|yml|xml)$/;
const languageIds = ['javascript', 'javascriptreact', 'vue', 'vue-html', 'typescript', 'typescriptreact'];

const configKey = 'dui18n';
const decorationType = vscode.window.createTextEditorDecorationType({});
const foregroundColor = new vscode.ThemeColor('editorCodeLens.foreground');

function openConfigCommand() {
	vscode.commands.executeCommand('workbench.action.openSettings', '国际多语言配置');// 用户区
}

async function checkConfig() {
	const config: any = await vscode.workspace.getConfiguration(configKey);
	if (!config || (!config.a.includePaths && !config.b.defaultPath && !config.c.includeKeys)) {// 初始化
		openConfigCommand();
		return false;
	}
	return true;
}

async function setConfig() {
	const config = await vscode.workspace.getConfiguration(configKey);
	includePaths = config.a.includePaths || '';
	defaultPath = config.b.defaultPath || '';
	includeKeys = config.c.includeKeys || '';
	// console.log("config", config, includePaths, defaultPath, includeKeys);
}

async function getFiles(includePaths: string) {
	// let glob = vscode.workspace.getConfiguration('autoimport').get<string>('filesToScan');
 	// const relativePattern = new vscode.RelativePattern(workspace, glob);
	const files = await vscode.workspace.findFiles(`{${includePaths}}`, `{**/node_modules/**, **/.git/**, **/@types/**, **/.vscode/**, **.d.ts}`);
	return files;
}

async function getLanguage() {
	if (!includePaths) {
		return null;
	}
	let langFilePath: any = {};
	let language: any = {};
	let defaultKey = '';
	const files = await getFiles(includePaths);
	console.log("getLanguage files", files);
	files.forEach((file) => {
		const fileName = path.basename(file.fsPath);
		const key = fileName.substring(0, fileName.indexOf('.'));
		// console.log("path.basename", fileName, key, path.basename(defaultPath));
		// 剔除index文件
		if (key === 'index'){
			return;
		}
		// 默认第一个有效文件，或者用户指定文件
		if ((defaultKey === '') || fileName === path.basename(defaultPath)) {
			defaultKey = key;
		}
		fs.readFile(file.fsPath, 'utf-8', (err: any, data: any) => {
			if (err) {
				return console.error(err);
			}
			// console.log("file.fsPath", file.fsPath);
			try {
				if (yamlReg.test(file.fsPath)) {
					return;
				}
				const startIndex = data.indexOf('{');
				const endIndex = data.lastIndexOf('}');
				if (startIndex < 0 || endIndex < 0) {// 不是返回对象的文件，忽略
					return;
				}
				const dataStr = data.substring(startIndex, endIndex + 1);
				// console.log("dataStr", dataStr);
				const obj = eval(`(${dataStr})`);
				language[key] = obj;
				langFilePath[key] = file.fsPath;
			} catch(e) {
				console.error("getLanguage error", e);
			}
		});
	});
	return { language, defaultKey, langFilePath, type: 'json' };
}

async function updateLanguage(obj: any = null, isGlobal: boolean = true) {
	if (isGlobal) {
		langObj = await getLanguage();
	} else {
		langObj = obj;
	}
}



function showDecoration(editor: vscode.TextEditor, positionObj: any, lang: object) {
	if (editor && positionObj) {
		const vsRanges: any[] = Object.entries(positionObj).map(([k, v]: any) => {
			const p: any = k.split('-');
			if (p && p.length === 2) {
				const startPosition = editor.document.positionAt(p[0]);
				const endPosition = editor.document.positionAt(p[1]);
				const range = new vscode.Range(startPosition, endPosition);
				const value = getObjectValue(lang, v);
				const text = getStringText(value); 
				return {
					range,
					renderOptions: {
						after: {
							contentText: `${text}`,
							color: foregroundColor,
						}
					}
				};
			}
			return null;
		}).filter(Boolean);
		editor.setDecorations(decorationType, vsRanges);
	}
}

function getI18NKey(keyStr: string) {
	let res = keyStr;
	res = res.split(',')[0];
	res = res.replace(/[\t\n'"]/g, '');
	return res;
}

function getKeyPosition(text: any, keys: string) {
	const positionObj: any = {};// key: 左括号位置+右括号位置，value: i18n的字符串
	if (keys && text) {
		keys.split(',').forEach((k) => {
			const key = (k || '').trim() + '(';
			let index = -1, startIndex = 0;
			while((index = text.indexOf(key, startIndex)) > -1) {
				const leftCol = index + key.length;// 左括号位置
				const rightCol = text.indexOf(')', leftCol);// 右括号位置
				if (rightCol > -1) {
					const value = getI18NKey(text.substring(leftCol, rightCol));
					// key: 左括号位置+右括号位置，value: i18n的字符串
					positionObj[`${leftCol}-${rightCol+1}`] = value;
					startIndex = leftCol;
				} else {
					break
				}
			}
		})
	}
	return positionObj;
}

/**
 * 判断当前文档是否包含i18n的引用
 * @param str 
 * @param keys 
 * @returns 
 */
function checkText(str: string, keys: string) {
	return keys.split(',').reduce((pre, cur) => {
		const key = (cur || '').trim() + '(';
		if (str.indexOf(key) > -1) {
			return pre + 1;
		}
		return pre;
	}, 0);
}

/**
 * 渲染文档，添加标签
 * @param includeKeys 
 */
function renderDecoration() {
	const activeEditor = vscode.window.activeTextEditor;
	const { defaultKey, language={} } = langObj || {};
	console.log("langObj", langObj);
	const langKey = userKey || defaultKey;
	const lang = language[langKey];
	if (activeEditor && lang) {
		const { fileName, getText } = activeEditor.document || {};
		const contentText = getText ? getText() : '';
		// 判断当前文档是否包含i18n的引用
		if (includeKeys && fileReg.test(fileName) && checkText(contentText, includeKeys)) {
			const positionObj = getKeyPosition(contentText, includeKeys);
			console.log("positionObj", positionObj);
			showDecoration(activeEditor, positionObj, lang);
		}
	}
}

// 内部特殊引用方式
async function scanInnerFile() {
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		const { fileName, getText } = activeEditor.document || {};
		const contentText = getText ? getText() : '';
		if (/\.(vue)$/.test(fileName) && contentText.indexOf('</i18n>') > -1) {
			const obj = handleScanFileInner(contentText, fileName);
			if (obj && obj.language) {
				// 设置语言库
				await updateLanguage(obj, false);
			} else {
				// 重置语言库位空
				await updateLanguage(null, false);
			}
		}
	}
}

export async function activate(context: vscode.ExtensionContext) {
	try {
		const isValid = checkConfig();
		if (!isValid) {
			return;
		}
		// 读取配置并设置
		await setConfig();
		// 设置语言库
		await updateLanguage();
		// 扫描内部特殊引用方式
		await scanInnerFile();
		// 渲染语言
		renderDecoration();

		// 监听文件保存
		vscode.workspace.onDidSaveTextDocument(
			async (event) => {
				let activeEditor = vscode.window.activeTextEditor;
				if (activeEditor && event.fileName === activeEditor.document.fileName) {
					const fileName = activeEditor.document.fileName;
					if (!excludeFileReg.test(fileName) && includePaths) {
						const files = await getFiles(includePaths);
						const fileNames = files.map(item => item.fsPath);
						// console.log("fileNames", fileNames, fileName);
						if (fileNames.includes(fileName)) {
							// 更新语言库
							await updateLanguage();
						}
					}
				}
			},
			null,
			context.subscriptions
		);

		// 监听活动文件窗口
		vscode.window.onDidChangeActiveTextEditor(async editor => {
			const activeEditor = vscode.window.activeTextEditor;
			if (activeEditor && activeEditor.document === editor?.document) {
				// 扫描内部特殊引用方式
				await scanInnerFile();
				// 渲染语言
				renderDecoration();
			}
		});

		// 监听配置的变化
		vscode.workspace.onDidChangeConfiguration(async (event) => {
			if (event.affectsConfiguration(configKey)) {
				console.log("onDidChangeConfiguration");
				await setConfig();
				// 设置语言库
				await updateLanguage();
			}
		});

		// 监听命令-设置多语言配置
		context.subscriptions.push(vscode.commands.registerTextEditorCommand(
			'extension.du.i18n.setting', 
			async function () {
				openConfigCommand()
			})
		);

		// 监听命令-切换显示语言
		context.subscriptions.push(vscode.commands.registerTextEditorCommand(
			'extension.du.i18n.change', 
			async function () {
				const { defaultKey, language={} } = langObj || {};
				const langKey = userKey || defaultKey;
				if (!Object.keys(language).length) {
					openConfigCommand()
				} else {
					const items = Object.keys(language).map((k) => ({ label: k, value: k }));
					const selected = await vscode.window.showQuickPick(items, { placeHolder: langKey });
					if (selected && selected.value !== userKey) {
						userKey = selected.value;
						renderDecoration();
					}
				}
			})
		);

		// 监听自定义命令-用于接收下一层返回的数据并进行处理
		context.subscriptions.push(vscode.commands.registerCommand(
			'extension.du.i18n.receive', 
			async function (event) {
				console.log("registerCommand callback extension.du.i18n.receive", event);
				if (event) {
					switch(event.type) {
						case 'READY':// 渲染完成，可以传递参数
							const { defaultKey, language={}, type } = langObj || {};
							const langKey = userKey || defaultKey;
							const payload = {
								defaultLang: langKey,
								langs: Object.keys(language),
								defaultFormat: type
							};
							ViewLoader.postMessageToWebview({
								type: 'TRANSLATE-POST',
								payload,
							});
							break;

						case 'TRANSLATE-WRITE':// 写入文件
							const data = event.payload || {};
							if (data.lang) {
								const { langFilePath={}, filePath, type } = langObj || {};
								const fsPath = langFilePath[data.lang] || filePath;
								if (fsPath && data.text) {
									if (type === 'yaml') {
										if (setYAMLFileText(fsPath, data.lang, data.text)) {
											return ViewLoader.postMessageToWebview({
												type: 'TRANSLATE-SHOWMSG',
												payload: true,
											});
										}
									} else {
										if (setJSONFileText(fsPath, data.text)) {
											return ViewLoader.postMessageToWebview({
												type: 'TRANSLATE-SHOWMSG',
												payload: true,
											});
										}
									}
								}
							}
							return ViewLoader.postMessageToWebview({
								type: 'TRANSLATE-SHOWMSG',
								payload: false,
							});
							break;
					}
				}
			})
		);

		// 监听命令-批量新增
		context.subscriptions.push(vscode.commands.registerTextEditorCommand(
			'extension.du.i18n.add', 
			async function () {
				ViewLoader.showWebview(context);
			})
		);

		// 处理转跳到变量声明处
		const provideDefinition = (document, position) => {
			try {
				const { getText, getWordRangeAtPosition, lineAt } = document || {};
				const { langFilePath={}, filePath, defaultKey, language={}, type } = langObj || {};
				const langKey = userKey || defaultKey;
				const fsPath = langFilePath[langKey] || filePath;
				const lang = language[langKey];
				// console.log('langObj: ', langObj);
				// console.log('lang: ', lang, langKey, fsPath);
				// 若当前文案不属于i18n，直接返回
				if (!lang || !langKey || !fsPath) {
					return;
				}

				// 变量引用的位置（当前窗口）
				let word = getText(getWordRangeAtPosition(position));
				// console.log('word: ', word);
				let originWord = word;
				let value = getObjectValue(lang, word);
				if (!value) {
					const lineText = lineAt(position).text;
					// console.log('lineText: ', lineText);
					const character = position.character;
					// 从character向前后查找字符'和"
					// console.log("character", character);
					let endIndex = -1, beginIndex = -1;
					let endIndex1 = lineText.indexOf("'", character);
					let endIndex2 = lineText.indexOf('"', character);
					endIndex = endIndex1 > endIndex2 && endIndex2 > -1 ? endIndex2 : endIndex1;
					let str = lineText.substring(0, endIndex);
					let beginIndex1 = str.lastIndexOf("'");
					let beginIndex2 = str.lastIndexOf('"');
					beginIndex = beginIndex1 < beginIndex2 ? beginIndex2 : beginIndex1;
				
					// console.log("beginIndex", beginIndex, endIndex);
					word = lineText.substring(beginIndex + 1, endIndex);
					// console.log("word2", word);
					value = getObjectValue(lang, word);
				}
				// console.log("fsPath", fsPath);
				// console.log("value", value);
				// 初步判定是否属于i18n文档引用变量
				if (fs.existsSync(fsPath) && value) {
					let statIndex = 0;
					const data = fs.readFileSync(fsPath, 'utf-8');
					if (type === 'yaml') {
						statIndex = data.indexOf(`${langKey}:`);
					}
					let index = data.indexOf(word, statIndex);
					if (index < 0) {
						index = data.indexOf(originWord, statIndex);
						// 没有查询到对应的位置，也直接返回
						if (index < 0) {
							return;
						}
					}
					// 查找变量定义的行和列位置（要转跳的窗口）
					let str = data.substring(0, index);
					let lineArr = str.split('\n');
					let lineIndex = lineArr.length - 1;
					// console.log("lineArr", lineArr);
					let charIndex = (lineArr[lineIndex] || '').length;
					lineIndex = lineIndex > -1 ? lineIndex : 0;
					charIndex = charIndex > -1 ? (charIndex + originWord.length) : 0;
					// console.log("position", lineIndex, charIndex);
					return new vscode.Location(vscode.Uri.file(fsPath), new vscode.Position(lineIndex, charIndex));
				}
			} catch(e) {
				console.error("provideDefinition error", e);
			}
		}

		// 监听命令-处理点击转跳到变量声明处
		context.subscriptions.push(vscode.languages.registerDefinitionProvider(languageIds, {
			provideDefinition
		}));

	} catch(e) {
		console.error("du-i18n activate error", e);
	}
}

export function deactivate() {}
