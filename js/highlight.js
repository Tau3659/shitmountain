const KEYWORDS = new Set([
  "async", "await", "break", "case", "catch", "class", "const", "continue",
  "debugger", "default", "delete", "do", "else", "export", "extends", "finally",
  "for", "from", "function", "if", "import", "in", "instanceof", "let", "new",
  "of", "return", "static", "switch", "throw", "try", "typeof", "var", "void",
  "while", "with", "yield", "true", "false", "null", "undefined",
]);

export function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function highlight(src) {
  const s = String(src);
  let out = "";
  let i = 0;
  while (i < s.length) {
    if (s[i] === "/" && s[i + 1] === "/") {
      out += `<span class="com">${escapeHtml(s.slice(i))}</span>`;
      break;
    }
    if (s[i] === "'" || s[i] === '"' || s[i] === "`") {
      const q = s[i];
      let j = i + 1;
      while (j < s.length) {
        if (s[j] === "\\") {
          j += 2;
          continue;
        }
        if (s[j] === q) {
          j += 1;
          break;
        }
        j += 1;
      }
      out += `<span class="str">${escapeHtml(s.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    if (/[0-9]/.test(s[i]) && (i === 0 || !/[A-Za-z_$]/.test(s[i - 1]))) {
      let j = i;
      while (j < s.length && /[0-9.xXa-fA-F]/.test(s[j])) j += 1;
      out += `<span class="num">${escapeHtml(s.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    if (/[A-Za-z_$]/.test(s[i])) {
      let j = i;
      while (j < s.length && /[A-Za-z0-9_$]/.test(s[j])) j += 1;
      const word = s.slice(i, j);
      let cls = "";
      if (KEYWORDS.has(word)) cls = "kw";
      else {
        let k = j;
        while (k < s.length && s[k] === " ") k += 1;
        if (s[k] === "(") cls = "fn";
      }
      out += cls ? `<span class="${cls}">${escapeHtml(word)}</span>` : escapeHtml(word);
      i = j;
      continue;
    }
    out += escapeHtml(s[i]);
    i += 1;
  }
  return out;
}
