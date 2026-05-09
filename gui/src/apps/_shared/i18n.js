// 临时 i18n shim,只覆盖 finance/notebook 等拟物快照应用使用的 key。
// AIOS 主仓还没接入完整 i18n 框架,这里把 zh 字典内联,locale 默认锁 zh。

import { ref } from 'vue';

const dict = {
  // common
  common_save: '__T_COMMON_SAVE__',
  common_delete: '__T_COMMON_DELETE__',

  // framework
  app_sidebar_finance: '__T_APP_FINANCE__',
  app_sidebar_notebook: '__T_APP_NOTEBOOK__',

  // finance
  finance_title: '__T_FINANCE_TITLE__',
  finance_income: '__T_FINANCE_INCOME__',
  finance_expense: '__T_FINANCE_EXPENSE__',
  finance_balance: '__T_FINANCE_BALANCE__',
  finance_date: '__T_FINANCE_DATE__',
  finance_narrative: '__T_FINANCE_NARRATIVE__',
  finance_withdrawal: '__T_FINANCE_WITHDRAWAL__',
  finance_deposit: '__T_FINANCE_DEPOSIT__',
  finance_operation: '__T_FINANCE_OPERATION__',
  finance_note_placeholder: '__T_FINANCE_NOTE_PLACEHOLDER__',
  finance_default_income_note: '__T_FINANCE_DEFAULT_INCOME_NOTE__',
  finance_default_expense_note: '__T_FINANCE_DEFAULT_EXPENSE_NOTE__',
  finance_chat_quick_1: '__T_FINANCE_CHAT_QUICK_1__',
  finance_chat_quick_2: '__T_FINANCE_CHAT_QUICK_2__',
  finance_chat_quick_3: '__T_FINANCE_CHAT_QUICK_3__',

  // notebook
  notebook_back: '__T_COMMON_BACK__',
  notebook_optimize_action: '__T_NOTEBOOK_OPTIMIZE_ACTION__',
  notebook_save_action: '__T_COMMON_SAVE__',
  notebook_apply_action: '__T_COMMON_APPLY__',
  notebook_close_action: '__T_COMMON_CLOSE__',
  notebook_delete_confirm: '__T_NOTEBOOK_DELETE_CONFIRM_LONG__',
  notebook_cancel_action: '__T_COMMON_CANCEL__',
  notebook_delete_action: '__T_COMMON_DELETE__',
  notebook_ai_polish: '__T_NOTEBOOK_AI_POLISH__',
  notebook_ai_loading: '__T_NOTEBOOK_AI_LOADING__',
  notebook_empty_card: '__T_NOTEBOOK_EMPTY_CARD__',
  notebook_editor_placeholder: '__T_NOTEBOOK_EDITOR_PLACEHOLDER__',
  notebook_just_now: '__T_COMMON_JUST_NOW__',
  notebook_minutes_ago: '__T_NOTEBOOK_MINUTES_AGO_N__',
  notebook_hours_ago: '__T_NOTEBOOK_HOURS_AGO_N__',
  notebook_days_ago: '__T_NOTEBOOK_DAYS_AGO_N__',
  notebook_create_failed: '__T_NOTES_SAVE_FAILED__',
  notebook_load_failed: '__T_NOTES_LOAD_FAILED__',
  notebook_delete_failed: '__T_NOTES_DELETE_FAILED__',
  notebook_optimize_failed: '__T_NOTEBOOK_OPTIMIZE_FAILED__',
  notebook_chat_quick_1: '__T_NOTEBOOK_CHAT_QUICK_1__',
  notebook_chat_quick_2: '__T_NOTEBOOK_CHAT_QUICK_2__',
  notebook_chat_quick_3: '__T_NOTEBOOK_CHAT_QUICK_3__'
};

export const locale = ref('__T_COMMON_LOCALE__');

export const t = (key, params = {}) => {
  let text = dict[key];
  if (text === undefined) return key;
  for (const [k, v] of Object.entries(params || {})) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return text;
};

export const useI18n = () => ({ locale, t });
