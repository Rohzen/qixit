const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const assetsDir = path.join(__dirname, 'assets');
const distAssetsDir = path.join(distDir, 'assets');
const sourceHtml = path.join(__dirname, 'qixit.html');
const destHtml = path.join(distDir, 'index.html');
const androidHtml = path.join(__dirname, 'mobile', 'qixit-android.html');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
  console.log('Created dist directory.');
}

// Helper function to recursively copy directories
function copyDirRecursiveSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target);
  }

  const files = fs.readdirSync(source);
  for (const file of files) {
    const curSource = path.join(source, file);
    const curTarget = path.join(target, file);

    if (fs.lstatSync(curSource).isDirectory()) {
      copyDirRecursiveSync(curSource, curTarget);
    } else {
      fs.copyFileSync(curSource, curTarget);
    }
  }
}

// Use the Android-specific fork as the dist source
// This file has all mobile CSS, touch controls, and visual enhancements baked in
if (fs.existsSync(androidHtml)) {
  // Fix relative script paths for the flat dist/ layout
  let html = fs.readFileSync(androidHtml, 'utf8');
  html = html.replace(/"\.\.\/ProceduralBG\.js"/g, '"ProceduralBG.js"');

  // Inject android-defaults.json as factory defaults (applied only on first run)
  const defaultsFile = path.join(__dirname, 'android-defaults.json');
  if (fs.existsSync(defaultsFile)) {
    const defaults = fs.readFileSync(defaultsFile, 'utf8').trim();
    const injection = `<script>
(function(){try{if(!localStorage.getItem('qixit_adv')){localStorage.setItem('qixit_adv',${JSON.stringify(defaults)});}}catch(_){}})();
</script>
`;
    html = html.replace('<script src="ProceduralBG.js"></script>', injection + '<script src="ProceduralBG.js"></script>');
    console.log('Injected android-defaults.json into dist/index.html');
  }

  fs.writeFileSync(destHtml, html, 'utf8');
  console.log('Copied mobile/qixit-android.html to dist/index.html');
} else {
  // Fallback to desktop version if android fork doesn't exist
  fs.copyFileSync(sourceHtml, destHtml);
  console.log('WARNING: mobile/qixit-android.html not found, using qixit.html');
}

// Copy standalone JS libraries to dist so the Android WebView can load them
['ProceduralBG.js'].forEach(lib => {
  const src = path.join(__dirname, lib);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, lib));
    console.log(`Copied ${lib} to dist/`);
  }
});

// Copy assets to dist/assets
if (fs.existsSync(assetsDir)) {
  copyDirRecursiveSync(assetsDir, distAssetsDir);
  console.log('Copied assets directory to dist/assets.');
}

console.log('Build complete.');
