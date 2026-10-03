import assert from "node:assert/strict";
import test from "node:test";
import { pairToolCalls } from "../server/chats/input.ts";

const call = (id: string) => ({ type: "function_call", call_id: id, name: "bash", arguments: "{}" });
const out = (id: string) => ({ type: "function_call_output", call_id: id, output: `ok ${id}` });
const user = (text: string) => ({ role: "user", content: text });
const shape = (items: any[]) => items.map((i) => i.type === "function_call" ? `C${i.call_id}` : i.type === "function_call_output" ? `O${i.call_id}` : i.type === "reasoning" ? "R" : `U:${i.content}`);

test("运行中插进来的用户消息挪到结果之后", () => {
  assert.deepEqual(shape(pairToolCalls([user("a"), call("1"), user("b"), out("1")])), ["U:a", "C1", "O1", "U:b"]);
});
test("缺结果的调用补一条中断结果", () => {
  const r = pairToolCalls([user("a"), call("1")]);
  assert.deepEqual(shape(r), ["U:a", "C1", "O1"]);
  assert.match(r[2].output, /中断/);
});
test("孤立结果丢掉", () => {
  assert.deepEqual(shape(pairToolCalls([out("9"), user("a")])), ["U:a"]);
});
test("并行调用整组在前、结果按调用顺序在后", () => {
  assert.deepEqual(shape(pairToolCalls([{ type: "reasoning" }, call("1"), call("2"), out("2"), user("x"), out("1")])), ["R", "C1", "C2", "O1", "O2", "U:x"]);
});
test("重复 call_id 只留第一个", () => {
  assert.deepEqual(shape(pairToolCalls([call("1"), out("1"), call("1"), out("1")])), ["C1", "O1"]);
});
test("正常历史原样不变", () => {
  const items = [user("a"), call("1"), out("1"), { role: "assistant", content: "done" }];
  assert.deepEqual(pairToolCalls(items), items);
});
