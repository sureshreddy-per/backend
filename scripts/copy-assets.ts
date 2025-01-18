import * as fs from 'fs';
import * as path from 'path';

// Ensure the dist directory exists
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Copy create_tables.sql to dist
fs.copyFileSync(
    path.join(process.cwd(), 'create_tables.sql'),
    path.join(process.cwd(), 'dist', 'create_tables.sql')
);

console.log('Assets copied successfully!'); 