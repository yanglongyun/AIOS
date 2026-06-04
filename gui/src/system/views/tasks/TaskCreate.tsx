export function TaskCreate({
  form,
  setForm,
  errorText,
  cancel,
  submit,
}: {
  form: { name: string; detail: string };
  setForm: (form: { name: string; detail: string }) => void;
  errorText: string;
  cancel: () => void;
  submit: () => void;
}) {
  return (
    <>
      <div className="hidden md:flex items-center justify-between gap-3 py-3 px-5 shrink-0">
        <strong className="text-sm font-semibold text-text">新建任务</strong>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-5 py-8 flex flex-col gap-5">
          {errorText ? <p className="inline-error">{errorText}</p> : null}
          <header className="flex flex-col gap-1.5">
            <h2 className="m-0 text-2xl font-semibold text-text leading-tight">新建任务</h2>
            <p className="m-0 text-sm text-text-mute">以后台 Agent 的方式异步执行，完成后落到便签和会话里</p>
          </header>
          <div className="flex flex-col gap-4 p-5 rounded-2xl border border-border-soft bg-bg-raised">
            <div className="field">
              <label className="field-label">标题（可选）</label>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input" placeholder="留空则自动从内容截取" />
            </div>
            <div className="field">
              <label className="field-label">详情</label>
              <textarea value={form.detail} onChange={(event) => setForm({ ...form, detail: event.target.value })} className="textarea" rows={10} placeholder="描述你希望 Agent 完成的事情…" />
              <span className="field-hint">提交后会创建一个新会话并开始执行</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button className="btn btn-sm btn-ghost" onClick={cancel}>取消</button>
              <button className="btn btn-sm btn-primary" disabled={!form.detail.trim()} onClick={submit}>创建任务</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
