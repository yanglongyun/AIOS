import { createNotebookNote } from '../db.js';

export const createHandler = (body = {}) => createNotebookNote(body.content || '');
