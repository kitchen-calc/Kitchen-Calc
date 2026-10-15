// Копирует three.js и нужные дополнения в app/vendor: сборщик программы выбрасывает папки examples из node_modules
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'node_modules', 'three');
const out = path.join(root, 'app', 'vendor');
const files = {
  'three.module.js': 'build/three.module.js',
  'three.core.js': 'build/three.core.js',
  'addons/controls/OrbitControls.js': 'examples/jsm/controls/OrbitControls.js',
  'addons/controls/TransformControls.js': 'examples/jsm/controls/TransformControls.js',
  'addons/renderers/CSS2DRenderer.js': 'examples/jsm/renderers/CSS2DRenderer.js',
};
for (const [to, from] of Object.entries(files)) {
  const dst = path.join(out, to);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(path.join(src, from), dst);
}
fs.copyFileSync(path.join(src, 'LICENSE'), path.join(out, 'LICENSE-three.txt'));
// Вычитание объёмов (настоящие отверстия и вырезы в 3D)
for (const pkg of ['three-mesh-bvh', 'three-bvh-csg']) {
  const dir = path.join(root, 'node_modules', pkg);
  fs.copyFileSync(path.join(dir, 'build', 'index.module.js'), path.join(out, pkg + '.module.js'));
  fs.copyFileSync(path.join(dir, 'LICENSE'), path.join(out, 'LICENSE-' + pkg + '.txt'));
}
console.log('vendor: three.js скопирован в app/vendor');
