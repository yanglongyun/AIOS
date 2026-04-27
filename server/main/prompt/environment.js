const environment = (cwd) => {
  return `

## Environment
- Project root: ${cwd}
- System database: ${cwd}/database/aios.db (SQLite tables: chats, messages, settings, memories)
- App database directory: ${cwd}/database/apps/ (SQLite, one database file per app)
- Files directory: ${cwd}/files/
- Uploads directory: ${cwd}/files/uploads/
- Exports directory: ${cwd}/files/exports/`;
};
export {
  environment
};
