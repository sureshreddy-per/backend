import * as fs from 'fs';
import * as path from 'path';

function findFile(filename: string, searchPaths: string[]): string | null {
    for (const searchPath of searchPaths) {
        const fullPath = path.join(process.cwd(), searchPath, filename);
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }
    return null;
}

function copyFileIfExists(source: string, dest: string) {
    if (fs.existsSync(source)) {
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(source, dest);
        console.log(`Copied ${source} to ${dest}`);
        return true;
    }
    console.log(`Warning: Source file ${source} does not exist, skipping...`);
    return false;
}

// Ensure the dist directory exists
const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Search paths for files
const searchPaths = [
    '',
    'scripts',
    'src',
    'sql',
    'db'
];

// List of files to copy with their source search paths
const filesToCopy = [
    { 
        name: 'create_tables.sql',
        dest: 'dist/create_tables.sql'
    },
    {
        name: 'init-db.ts',
        dest: 'dist/scripts/init-db.js'
    }
];

// Copy each file
let success = true;
for (const file of filesToCopy) {
    const sourcePath = findFile(file.name, searchPaths);
    if (sourcePath) {
        const destPath = path.join(process.cwd(), file.dest);
        if (!copyFileIfExists(sourcePath, destPath)) {
            success = false;
        }
    } else {
        console.error(`Error: Could not find ${file.name} in any of the search paths`);
        success = false;
    }
}

if (!success) {
    console.error('Some files could not be copied. Build may be incomplete.');
    process.exit(1);
} else {
    console.log('Assets copy process completed successfully!');
} 