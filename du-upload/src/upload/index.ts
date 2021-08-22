// const formdataPolyfill = require('formdata-polyfill/esm-min.js');
// const btoa = require('btoa');
const fetch = require('node-fetch').default;
const formData = require('form-data');
const fs = require('fs');
const crypto = require('crypto');

export const getTokenUrl = () => {
  return 'https://node.xx.xx/node/api/oss/token?country=china';
};

export const base64Name = (file: any) => {
  const { path: name='' } = file || {};
  const index = name.lastIndexOf('.');
  const sourceFileName = name.substring(0, index);
  const suffix = name.substring(index);
  const fileName = crypto.createHash('sha256').update(encodeURI(sourceFileName + Date.now())).digest('hex');
  return fileName + suffix;
};

export const getOssInfo = () => {
  return fetch(getTokenUrl()).then((res: any) => res.json());
};

export const uploadFile = async (opt: any) => {
  try {
    const resJson = await getOssInfo();
    const ossInfo = resJson.data || {};
    const fileName = base64Name(opt.file);
    const key = ossInfo.startsWith + fileName;
    // console.log("opt", opt);
    // console.log("ossInfo", ossInfo);
    const form = new formData();
    form.append('OSSAccessKeyId', ossInfo.OSSAccessKeyId);
    form.append('policy', ossInfo.policy);
    form.append('key', key);
    form.append('success_action_status', '200');
    form.append('signature', ossInfo.signature);
    form.append('file', fs.createReadStream(opt.file.path), fileName);    
    // console.log("form", form);
    const options = {
      method: 'POST',
      body: form,
    };
    const res = await fetch(ossInfo.ossHost, options);
    if (res.ok) {
      return `${ossInfo.host}/${key}`;
    } else {
      return null;
    }
  } catch(e) {
    throw e;
  }
};

export default uploadFile;
