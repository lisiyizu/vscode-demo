const path = require('path');
const fs = require('fs');
const YAML = require('yaml');
const merge = require('lodash/merge');
// TODO prettier是在是太大了，承受不起呀
// const prettier = require("prettier");
// // @ts-ignore
// import prettier from "https://unpkg.com/prettier@2.3.2/esm/standalone.mjs";
// // @ts-ignore
// import parserBabel from "https://unpkg.com/prettier@2.3.2/esm/parser-babel.mjs";
// // @ts-ignore
// import parserTypescript from "https://unpkg.com/prettier@2.3.2/esm/parser-typescript.mjs";
// // @ts-ignore
// import parserYaml from "https://unpkg.com/prettier@2.3.2/esm/parser-yaml.mjs";
// const prettier = require("prettier/standalone");
// const parserBabel = require("prettier/parser-babel");
// const parserTypescript = require("prettier/parser-typescript");
// const parserYaml = require("prettier/parser-yaml");
// import * as prettier from 'prettier/standalone';
// import * as parserBabel from 'prettier/parser-babel';
// import * as parserTypescript from 'prettier/parser-typescript';
// import * as parserYaml from 'prettier/parser-yaml';

// import * as prettier from 'prettier/standalone/esm/standalone.mjs';
// import * as parserBabel from 'prettier/parser-babel/esm/parser-babel.mjs';
// import * as parserTypescript from 'prettier/parser-typescript/esm/parser-typescript.mjs';
// import * as parserYaml from 'prettier/parser-yaml/esm/parser-yaml.mjs';

/**
 * 获取复制对象的value
 * 如{ "a.b": 1, a: { c: 2, d: [{e: 'e'}, {f: 'f'}] } }，获取obj, 'a.d.1.f'
 * @param obj 
 * @param key 
 * @returns 
 */
export function getObjectValue(obj: any, key: string) {
  if (Object.prototype.toString.call(obj) === '[object Object]') {
    if (Object(obj).hasOwnProperty(key)) {
      return obj[key];
    } else {
      if (key.indexOf('.')) {
        return key.split('.').reduce((pre, k) => Object(pre).hasOwnProperty(k) ? pre[k] : undefined, obj);
      }
    }
  }
  return undefined;
}

export function getStringText(val: any) {
  if (Array.isArray(val) || Object.prototype.toString.call(val) === '[object Object]') {
    return JSON.stringify(val);
  }
  return val ? val.toString() : val;
}

export function setJSONFileText(path: string, text: string) {
  try {
    const data = fs.readFileSync(path, 'utf-8');
    const index = data.lastIndexOf('}');
    if (index > -1) {
      // 判断前面是否需要添加逗号
      const lastComma = data.lastIndexOf(',', index);
      const s = data.substring(lastComma + 1, index);
      const content = s.replace(/[\t\n\s]/g, '');
      let newText = content ? `,${text}` : text;
      let arr = (newText || '').split('\n');
      newText = arr.map((c, i) => i < arr.length - 1 ? ('\t' + c) : c).join('\n');
      const newStr= data.slice(0, index) + newText + data.slice(index);
      return writeFileToLine(path, newStr);
    }
    return false;
  } catch(e) {
    console.error("setJSONFileText e", e);
    return false;
  }
}

export function setYAMLFileText(path: string, key: string, text: string) {
  try {
    // console.log("path", path);
    const data = fs.readFileSync(path, 'utf-8');
    if (data && key) {
      // 公司内部自定义的格式
      if (/\.(vue)$/.test(path) && data.indexOf('</i18n>') > -1) {
        const startIndex = data.indexOf('<i18n>') + 6;
        const endIndex = data.indexOf('</i18n>', startIndex);
        const yamlStr = data.substring(startIndex, endIndex);
        // console.log("yamlStr", yamlStr);
        const yamlObj = YAML.parse(yamlStr);
        
        // const keyStartIndex = yamlStr.indexOf(`${key}:`);
        // let keyEndIndex = yamlStr.length;
        // Object.keys(yamlObj).forEach((k) => {
        //   const p = yamlStr.indexOf(`${k}:`, keyStartIndex + 1);
        //   // 筛选出下一个key的开始位置
        //   if (p > -1 && p < keyEndIndex) {
        //     keyEndIndex = p;
        //   }
        // });
        // const index = keyEndIndex - 1;
        // let newText = (text || '').split('\n').map(c => '\s' + c).join('\n');
        // newText = yamlStr.slice(0, index) + text +  yamlStr.slice(index);
        // console.log("newText", newText);

        const keyStr = YAML.stringify(yamlObj[key]) + text;
        yamlObj[key] = YAML.parse(keyStr);
        const newText = '\n' + YAML.stringify(yamlObj);
        const newStr= data.slice(0, startIndex) + newText + data.slice(endIndex);
        return writeFileToLine(path, newStr);
      } else {
        if (/\.(yaml|yml)$/.test(path)) {
          const yamlObj = YAML.parse(data);

          // const keyStartIndex = data.indexOf(`${key}:`);
          // let keyEndIndex = data.length;
          // Object.keys(yamlObj).forEach((k) => {
          //   const p = data.indexOf(`${k}:`, keyStartIndex + 1);
          //   // 筛选出下一个key的开始位置
          //   if (p > -1 && p < keyEndIndex) {
          //     keyEndIndex = p;
          //   }
          // });
          // const index = keyEndIndex - 1;
          // let newText = (text || '').split('\n').map(c => '\s' + c).join('\n');
          // newText = data.slice(0, index) + '\n' + newText +  data.slice(index);
          // console.log("newText", newText);
          const keyStr = YAML.stringify(yamlObj[key]) + text;
          yamlObj[key] = YAML.parse(keyStr);
          const newText = YAML.stringify(yamlObj);
          return writeFileToLine(path, newText);
        }
      }
    }
    return false;
  } catch(e) {
    console.error("setYAMLFileText e", e);
    return false;
  }
}

export function writeFileToLine(path: string, str: string) {
  try {
    // // TODO
    // let parser = 'babel';
    // // let plugins: any = [parserBabel];
    // switch(true) {
    //   case /\.json$/.test(path):
    //     parser = 'json';
    //     // plugins = [parserBabel];
    //     break;

    //   case /\.ts$/.test(path):
    //     parser = 'babel-ts';
    //     // plugins = [parserBabel, parserTypescript];
    //     break;

    //   case /\.(yaml|yml)$/.test(path):
    //     parser = 'yaml';
    //     // plugins = [parserBabel, parserYaml];
    //     break;
    // }
    // const newStr = prettier.format(str, {
    //   parser,
    //   // plugins,
    //   tabWidth: 2,
    //   singleQuote: true,
    //   semi: false,
    // })
    fs.writeFileSync(path, str);
    return true;
  } catch(e) {
    console.error("writeFileToLine e", e);
    return false;
  }
}

export function handleScanFileInner(data: string, filePath: string) {
	try {
		// 公司内部自定义的格式
		if (data && data.indexOf('</i18n>') > -1) {
      const i18nSrcReg = /<i18n\ssrc=+(([\s\S])*?)>(.*\s)?<\/i18n>/g;
			let yamlStr = '';
      let yamlObjList = [];
      let yamlObj = null;
      let urlPath = '';
      let langFilePath = {};
      let count = 0;
			let res = null;
      let startIndex = -1;
      let endIndex = 0;
      while((startIndex = data.indexOf('<i18n>', endIndex)) > -1) {// 可能存在多个的情况
        endIndex = data.indexOf('</i18n>', startIndex);
        yamlStr = data.substring(startIndex + 6, endIndex);
        urlPath = filePath;
        yamlObjList.push(YAML.parse(yamlStr));
      }
      while(res = i18nSrcReg.exec(data)) {// 可能存在多个的情况
        count++;
				let url = res[1].replace(/["']/g, '');
        // console.log("url2", url);
        url = path.join(path.dirname(filePath), url);
        const fileName = path.basename(url);
		    const key = fileName.substring(0, fileName.indexOf('.'));
        urlPath = url;
        langFilePath[key] = url;
        yamlStr = fs.readFileSync(url, 'utf-8');
        yamlObjList.push(YAML.parse(yamlStr));
      }

			if (count > 0) {// <i18n>在外部文件
        if (count === 1) {// 所有语言在一个文件
          langFilePath = {};
        } else {// 所有语言在多个文件
          urlPath = '';
        }
			}

      console.log("yamlObjList", yamlObjList);
      if (yamlObjList.length) {
        yamlObj = merge(...yamlObjList);
      }
			console.log("obj", yamlObj);
      // 设置默认key
      const keys = Object.keys(yamlObj || {});
      let defaultKey = 'en';// 默认值
      if (Array.isArray(keys)) {
        if (keys.includes['zh-TW']) {// 特殊设置
          defaultKey = 'zh-TW';
        } else {
          defaultKey = keys[0];
        }
      }
      // langFilePath
      return { language: yamlObj, defaultKey, filePath: urlPath, langFilePath, type: 'yaml' };
		}
	} catch(e) {
		console.error('handleScanFileInner error', e);
	}
	return null;
}