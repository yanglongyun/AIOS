import Database from "better-sqlite3";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..", "..", "..");
const aiosDbPath = resolve(root, "database", "aios.db");
const aiosDb = new Database(aiosDbPath, { readonly: true, fileMustExist: true });
const readLanguageRow = () => {
  try {
    return aiosDb.prepare("SELECT value FROM settings WHERE key = 'language'").get();
  } catch (error) {
    if (error?.code === "SQLITE_ERROR") {
      return null;
    }
    throw error;
  }
};
const hasSystemLanguage = () => {
  const row = readLanguageRow();
  const language = String(row?.value || "").trim();
  return language === "zh" || language === "en";
};
const getSystemLanguage = () => {
  const row = readLanguageRow();
  const language = String(row?.value || "").trim();
  if (!language) {
    throw new Error("Missing settings.language in database/aios.db");
  }
  if (language !== "zh" && language !== "en") {
    throw new Error(`Invalid settings.language: ${language}`);
  }
  return language;
};
export {
  getSystemLanguage,
  hasSystemLanguage
};
