const fs = require('fs');
const path = require('path');
const express = require('express');

const router = express.Router();

const modulesDir = path.join(__dirname, '../modules');

if (fs.existsSync(modulesDir)) {
  const moduleFolders = fs.readdirSync(modulesDir);

  moduleFolders.forEach((folder) => {
    const folderPath = path.join(modulesDir, folder);
    if (!fs.statSync(folderPath).isDirectory()) return;

    const files = fs.readdirSync(folderPath);
    files.forEach((file) => {
      if (file.endsWith('.routes.js')) {
        const fullPath = path.join(folderPath, file);
        try {
          const moduleRouter = require(fullPath);
          // Check if moduleRouter is indeed a router/middleware function
          if (typeof moduleRouter === 'function' || (moduleRouter && moduleRouter.stack)) {
            router.use(moduleRouter);
            console.log(`[Auto-mount] Mounted route file: ${path.relative(process.cwd(), fullPath)}`);
          }
        } catch (err) {
          console.warn(`[Auto-mount] Skipped ${file} (could not load or empty): ${err.message}`);
        }
      }
    });
  });
}

module.exports = router;
