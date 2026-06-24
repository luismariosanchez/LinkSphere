import * as cheerio from 'cheerio';

function isValidBookmarkUrl(href) {
  if (!href) {
    return false;
  }

  const trimmed = href.trim();
  return trimmed.startsWith('http://')
    || trimmed.startsWith('https://')
    || trimmed.startsWith('ftp://');
}

const IGNORED_FOLDER_NAMES = new Set([
  'barra de marcadores',
  'bookmarks bar',
  'bookmark bar',
  'barra de favoritos',
  'favorites bar',
  'favoritos',
  'favorites',
  'marcadores',
  'bookmarks',
  'otros marcadores',
  'other bookmarks',
  'mobile bookmarks',
  'marcadores móviles',
  'marcadores moviles',
]);

export function isIgnoredImportFolder(name) {
  return IGNORED_FOLDER_NAMES.has(String(name ?? '').trim().toLowerCase());
}

export function normalizeImportFolderPath(folderPath = []) {
  return folderPath.filter((name) => !isIgnoredImportFolder(name));
}

function extendImportFolderPath(folderPath, folderName) {
  if (isIgnoredImportFolder(folderName)) {
    return folderPath;
  }

  return [...folderPath, folderName.trim()];
}

function parseBookmarkNode($, element, folderPath = []) {
  const entries = [];
  const children = $(element).children().toArray();

  for (const child of children) {
    const tag = child.tagName?.toLowerCase();

    if (tag !== 'dt') {
      continue;
    }

    const node = $(child);
    const heading = node.children('h3').first();

    if (heading.length > 0) {
      const folderName = heading.text().trim();
      const nestedList = node.children('dl').first();

      if (nestedList.length > 0 && folderName) {
        entries.push(...parseBookmarkNode($, nestedList, extendImportFolderPath(folderPath, folderName)));
      }
      continue;
    }

    const link = node.children('a').first();
    if (link.length === 0) {
      continue;
    }

    const href = link.attr('href')?.trim();
    if (!isValidBookmarkUrl(href)) {
      continue;
    }

    entries.push({
      url: href,
      title: link.text().trim() || href,
      folderPath: normalizeImportFolderPath(folderPath),
    });
  }

  return entries;
}

export function parseBookmarksHtml(html) {
  const $ = cheerio.load(html);
  const rootList = $('dl').first();

  if (rootList.length === 0) {
    return [];
  }

  return parseBookmarkNode($, rootList);
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toAddDate(iso) {
  if (!iso) {
    return '';
  }

  const timestamp = Math.floor(new Date(iso).getTime() / 1000);
  return Number.isFinite(timestamp) ? String(timestamp) : '';
}

function buildLinkLine(bookmark, indent) {
  const addDate = toAddDate(bookmark.createdAt);
  const addDateAttr = addDate ? ` ADD_DATE="${addDate}"` : '';
  return `${indent}<DT><A HREF="${escapeHtml(bookmark.url)}"${addDateAttr}>${escapeHtml(bookmark.title)}</A>\n`;
}

function buildFolderLines(folderNode, indent) {
  let html = `${indent}<DT><H3>${escapeHtml(folderNode.name)}</H3>\n`;
  html += `${indent}<DL><p>\n`;
  const childIndent = `${indent}    `;

  for (const bookmark of folderNode.bookmarks) {
    html += buildLinkLine(bookmark, childIndent);
  }

  for (const child of folderNode.children) {
    html += buildFolderLines(child, childIndent);
  }

  html += `${indent}</DL><p>\n`;
  return html;
}

function buildFolderTree(folders, parentId = null) {
  return folders
    .filter((folder) => (folder.parentId ?? null) === parentId)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((folder) => ({
      id: folder.id,
      name: folder.name,
      bookmarks: [],
      children: buildFolderTree(folders, folder.id),
    }));
}

function attachBookmarksToTree(tree, bookmarks) {
  const loose = [];

  for (const bookmark of bookmarks) {
    if (!bookmark.folderId) {
      loose.push(bookmark);
      continue;
    }

    const placed = placeBookmarkInTree(tree, bookmark.folderId, bookmark);
    if (!placed) {
      loose.push(bookmark);
    }
  }

  return loose;
}

function placeBookmarkInTree(nodes, folderId, bookmark) {
  for (const node of nodes) {
    if (node.id === folderId) {
      node.bookmarks.push(bookmark);
      return true;
    }

    if (placeBookmarkInTree(node.children, folderId, bookmark)) {
      return true;
    }
  }

  return false;
}

export function serializeBookmarksHtml(bookmarks, folders = []) {
  const tree = buildFolderTree(folders);
  const loose = attachBookmarksToTree(tree, bookmarks);

  let body = '';

  for (const bookmark of loose) {
    body += buildLinkLine(bookmark, '    ');
  }

  for (const folderNode of tree) {
    body += buildFolderLines(folderNode, '    ');
  }

  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${body}</DL><p>
`;
}
