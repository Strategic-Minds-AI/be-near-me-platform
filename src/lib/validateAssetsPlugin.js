import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CACHE = path.join(ROOT, ".asset-cache.json");
const IMG_EXT = /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(\?|$)/i;
const IMG_HOSTS = ["images.unsplash.com", "i.pravatar.cc", "commondatastorage.googleapis.com", "img.youtube.com", "i.ytimg.com"];

function isImg(u) {
  if (!u || typeof u != "string") return false;
  if (!/^https?:\/\//i.test(u)) return false;
  if (IMG_EXT.test(u)) return true;
  return IMG_HOSTS.some(function (h) { return u.includes(h); });
}
function walk(d) {
  var o = [];
  if (!fs.existsSync(d)) return o;
  fs.readdirSync(d).forEach(function (f) {
    if (f === "node_modules" || f === ".git") return;
    var p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) o = o.concat(walk(p));
    else if (/\.(jsx|tsx|js|ts)$/.test(f)) o.push(p);
  });
  return o;
}
function loadC() { try { return JSON.parse(fs.readFileSync(CACHE, "utf8")); } catch (e) { return {}; } }
function saveC(c) { try { fs.writeFileSync(CACHE, JSON.stringify(c, null, 2)); } catch (e) {} }
async function chk(u, t) {
  t = t || 6000;
  var c = new AbortController(), s = setTimeout(function () { c.abort(); }, t);
  try {
    var r = await fetch(u, { method: "HEAD", signal: c.signal, redirect: "follow" });
    if (r.status === 405) { var g = await fetch(u, { method: "GET", signal: c.signal, redirect: "follow" }); return g.ok; }
    return r.ok;
  } catch (e) { return false; } finally { clearTimeout(s); }
}
function valIcons(c, v, rel) {
  var e = [];
  var re = /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/g, m;
  while (m = re.exec(c)) {
    var ns = m[1].split(",").map(function (s) { return s.trim().split(/\s+as\s+/)[0].trim(); }).filter(Boolean);
    var ci = c.indexOf("}", m.index);
    var ln = c.slice(0, ci).split("\n").length;
    ns.forEach(function (n) { if (!v.has(n)) e.push({ file: rel, line: ln, icon: n }); });
  }
  return e;
}
function extUrls(c) {
  var u = new Set();
  var re = /["'`]([^"'`]*https?:\/\/[^"'`]+)["'`]/g, m;
  while (m = re.exec(c)) { if (isImg(m[1])) u.add(m[1]); }
  return u;
}
// PART3