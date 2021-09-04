export const html = ({ url, nonce, scriptUri }: any) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>测试</title>
  <style>
  html,body,iframe{
    width: 100%;
    height: 100%;
    border: 0;
    overflow: hidden;
  }
  </style>
</head>
<body>
  <iframe src="${url}" />
</body>
<script nonce="${nonce}" src="${scriptUri}"></script>
</html>
`;