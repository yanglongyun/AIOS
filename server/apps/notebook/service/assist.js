import { agentTask } from "../../app_shared/agentTask.js";

const buildAssistPrompt = (content) => {
  return [
    "__T_NOTEBOOK_ASSIST_PROMPT_ROLE__",
    "__T_NOTEBOOK_ASSIST_PROMPT_INTRO__",
    "__T_NOTEBOOK_ASSIST_PROMPT_TASK__",
    "__T_NOTEBOOK_ASSIST_PROMPT_TASK_CONTEXT__",
    "__T_NOTEBOOK_ASSIST_PROMPT_DRAFT__",
    "__T_NOTEBOOK_ASSIST_PROMPT_POLISH__",
    "",
    "__T_NOTEBOOK_ASSIST_PROMPT_OUTPUT__",
    "",
    "__T_NOTEBOOK_ASSIST_PROMPT_CONTENT_LABEL__",
    content
  ].join("\n");
};

const assistNotebook = async ({ content, taskTitle }) => {
  if (!content?.trim()) return { error: "Content is required", status: 400 };
  const data = await agentTask({
    app: "notebook",
    title: String(taskTitle || "").trim() || "__T_NOTEBOOK_DEFAULT_TASK_TITLE__",
    prompt: buildAssistPrompt(content)
  });
  const result = (data.response || "").trim();
  if (!result) return { error: "Assist result is empty", status: 500 };
  return { result };
};
export {
  assistNotebook
};
