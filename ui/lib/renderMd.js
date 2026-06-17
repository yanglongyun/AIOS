import { marked } from 'marked';

marked.setOptions({
  breaks: true,
  gfm: true,
});

const renderMd = (content) => marked.parse(String(content || ''));

export { renderMd };
