const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'backend');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const files = ['server.js', 'data_pipeline.py', 'emosense.db', 'package.json', 'package-lock.json', 'node_modules', '.env', 'env.example.txt', 'requirements.txt'];

files.forEach(f => {
  const oldPath = path.join(__dirname, f);
  const newPath = path.join(dir, f);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Moved ${f} to backend/`);
  } else {
    console.log(`${f} not found`);
  }
});
