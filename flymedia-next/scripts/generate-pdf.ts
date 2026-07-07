import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const docsPath = path.join(__dirname, '../docs.md');
const htmlPath = path.join(__dirname, '../docs.html');
const pdfPath = path.join(__dirname, '../docs.pdf');

if (!fs.existsSync(docsPath)) {
  console.error('docs.md not found!');
  process.exit(1);
}

const markdown = fs.readFileSync(docsPath, 'utf8');

// Basic markdown to HTML parser
let htmlContent = markdown
  .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
  .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
  .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\*([^*]+)\*/g, '<em>$1</em>')
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  // Lists
  .replace(/^\s*-\s+(.+)$/gm, '<li>$1</li>')
  .replace(/^\s*\*\s+(.+)$/gm, '<li>$1</li>')
  // Blockquotes
  .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
  // Tables
  .replace(/\|(.+)\|/g, (match, p1) => {
    const cols = p1.split('|').map((c: string) => `<td>${c.trim()}</td>`).join('');
    return `<tr>${cols}</tr>`;
  });

// Wrap lists in ul tags
htmlContent = htmlContent.replace(/(<li>.+<\/li>)+/g, '<ul>$&</ul>');

// Clean up table headings separators
htmlContent = htmlContent.replace(/<tr>(<td>---<\/td>|<td>:---<\/td>|<td>---:<\/td>|<td>:---:<\/td>)+<\/tr>/g, '');

const fullHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Flymedia Platform Documentation</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.65;
    color: #1e293b;
    max-width: 800px;
    margin: 40px auto;
    padding: 0 20px;
  }
  h1 {
    font-size: 2.2em;
    border-bottom: 2px solid #cbd5e1;
    padding-bottom: 10px;
    color: #0f172a;
    font-weight: 800;
  }
  h2 {
    font-size: 1.6em;
    margin-top: 35px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
    color: #1e293b;
    font-weight: 700;
  }
  h3 {
    font-size: 1.2em;
    margin-top: 25px;
    color: #334155;
    font-weight: 600;
  }
  code {
    background-color: #f1f5f9;
    padding: 3px 6px;
    border-radius: 6px;
    font-family: monospace;
    font-size: 0.9em;
    color: #0f172a;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 25px 0;
  }
  th, td {
    border: 1px solid #cbd5e1;
    padding: 12px;
    text-align: left;
  }
  tr:nth-child(even) {
    background-color: #f8fafc;
  }
  blockquote {
    border-left: 4px solid #38bdf8;
    background-color: #f0f9ff;
    margin: 20px 0;
    padding: 12px 20px;
    border-radius: 0 8px 8px 0;
    color: #0369a1;
  }
  a {
    color: #0284c7;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
</style>
</head>
<body>
${htmlContent}
</body>
</html>
`;

fs.writeFileSync(htmlPath, fullHtml);
console.log('Temporary HTML file generated.');

try {
  console.log('Running Google Chrome headless to print PDF...');
  const chromePath = '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome';
  execSync(`${chromePath} --headless --disable-gpu --print-to-pdf="${pdfPath}" "${htmlPath}"`);
  console.log('PDF generation complete!');
} catch (err) {
  console.error('Path execution failed, trying command line backup...');
  try {
    execSync(`google-chrome --headless --disable-gpu --print-to-pdf="${pdfPath}" "${htmlPath}"`);
    console.log('PDF generation complete via command!');
  } catch (err2) {
    console.error('Chrome PDF export failed. Make sure Chrome is in Applications.', err2);
  }
} finally {
  if (fs.existsSync(htmlPath)) {
    fs.unlinkSync(htmlPath);
  }
}
