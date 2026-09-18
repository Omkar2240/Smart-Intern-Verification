const fs = require('fs');
const path = require('path');

const targetPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-router',
  'build',
  'link',
  'preview',
  'LinkPreviewContext.js'
);

if (fs.existsSync(targetPath)) {
  let content = fs.readFileSync(targetPath, 'utf8');
  if (content.includes("throw new Error('useLinkPreviewContext must be used within a LinkPreviewContextProvider")) {
    content = content.replace(
      "throw new Error('useLinkPreviewContext must be used within a LinkPreviewContextProvider. This is likely a bug in Expo Router.');",
      "return { isStackAnimationDisabled: false, openPreviewKey: undefined, setOpenPreviewKey: () => {} };"
    );
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log('[patch-expo-router] Successfully patched LinkPreviewContext.js');
  }
}
