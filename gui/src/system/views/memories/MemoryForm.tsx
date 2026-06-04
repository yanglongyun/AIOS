import { VISIBILITY_META, VISIBILITY_ORDER, type Visibility } from "../MemoriesView";

export function MemoryForm({
  form,
  setForm,
  submit,
}: {
  form: { title: string; description: string; content: string; visibility: Visibility };
  setForm: (form: { title: string; description: string; content: string; visibility: Visibility }) => void;
  submit: () => void;
}) {
  return (
    <section className="rounded-2xl border border-border-soft bg-bg-raised p-5 flex flex-col gap-4">
      <h3 className="m-0 text-sm font-semibold text-text">新建记忆</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="field">
          <label className="field-label">标题</label>
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input" placeholder="例如：产品偏好" />
        </div>
        <div className="field">
          <label className="field-label">描述（可选）</label>
          <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input" placeholder="一句话说明何时触发" />
        </div>
      </div>
      <div className="field">
        <label className="field-label">内容</label>
        <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className="textarea" rows={4} placeholder="记下具体事实、偏好或规则…" />
      </div>
      <div className="field">
        <label className="field-label">可见性</label>
        <div className="flex flex-wrap gap-2">
          {VISIBILITY_ORDER.map((visibility) => (
            <button key={visibility} type="button" className={["btn btn-sm", form.visibility === visibility ? "btn-primary" : "btn-ghost"].join(" ")} onClick={() => setForm({ ...form, visibility })}>
              {VISIBILITY_META[visibility].label}
            </button>
          ))}
        </div>
        <span className="field-hint">{VISIBILITY_META[form.visibility].hint}</span>
      </div>
      <div className="flex justify-end">
        <button className="btn btn-sm btn-primary" disabled={!form.title.trim() || !form.content.trim()} onClick={submit}>保存记忆</button>
      </div>
    </section>
  );
}
