#!/usr/bin/env node
/**
 * Kopiuje app/content-defaults.json do public/, żeby panel /admin.php na serwerze
 * znał domyślne ceny i zdjęcia. Uruchamia się przed `npm run build` (hook "prebuild").
 */
import { copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
await copyFile(path.join(ROOT, "app", "content-defaults.json"), path.join(ROOT, "public", "content-defaults.json"));
console.log("[defaults] skopiowano content-defaults.json do public/");
