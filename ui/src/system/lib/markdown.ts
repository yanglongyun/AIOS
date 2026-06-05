import { marked } from "marked";

marked.setOptions({ breaks: true, gfm: true });

export const stripControlTags = (text: unknown) =>
  String(text || "")
    .replace(/<summary>[\s\S]*?<\/summary>/g, "")
    .replace(/<memo>[\s\S]*?<\/memo>/g, "");

export const renderMarkdown = (text: unknown) => marked.parse(stripControlTags(text));
