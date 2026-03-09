import { generateSuggestion } from '../service/suggest.js';

export const suggestHandler = async (body, req) => {
  return generateSuggestion(body, req);
};
