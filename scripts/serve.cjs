const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // Try multiple resolution paths
  const candidatePaths = [];

  if (reqPath.endsWith('/')) {
    candidatePaths.push(path.join(ROOT, reqPath, 'index.html'));
  } else if (!path.extname(reqPath)) {
    candidatePaths.push(path.join(ROOT, reqPath, 'index.html'));
    candidatePaths.push(path.join(ROOT, reqPath + '.html'));
    candidatePaths.push(path.join(ROOT, reqPath));
  } else {
    candidatePaths.push(path.join(ROOT, reqPath));
    if (reqPath.startsWith('/data/')) {
      candidatePaths.push(path.join(ROOT, 'public', reqPath));
    }
    if (reqPath.startsWith('/i18n/')) {
      candidatePaths.push(path.join(ROOT, 'src', reqPath));
    }
  }

  let foundFile = null;
  for (const cp of candidatePaths) {
    if (fs.existsSync(cp) && fs.statSync(cp).isFile()) {
      foundFile = cp;
      break;
    }
  }

  if (foundFile) {
    const ext = path.extname(foundFile).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    fs.createReadStream(foundFile).pipe(res);
  } else {
    const notFoundPath = path.join(ROOT, '404.html');
    if (fs.existsSync(notFoundPath)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(notFoundPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  }
});

server.listen(PORT, () => {
  console.log(`UP Civic Grievance Helper running at http://localhost:${PORT}`);
});
