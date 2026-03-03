<template>
  <section class="space-y-2">
    <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{{ t('settings_appearance') }}</span>
    <div class="flex gap-2">
      <button
        @click="$emit('set-theme', 'dark')"
        class="flex-1 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors border"
        :class="theme === 'dark'
          ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 border-transparent'
          : 'border-gray-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800'"
      >{{ t('settings_theme_dark') }}</button>
      <button
        @click="$emit('set-theme', 'light')"
        class="flex-1 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors border"
        :class="theme === 'light'
          ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 border-transparent'
          : 'border-gray-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800'"
      >{{ t('settings_theme_light') }}</button>
    </div>
    <div class="space-y-2 pt-2">
      <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{{ t('settings_language') }}</span>
      <select
        :value="language"
        @change="$emit('set-language', $event.target.value)"
        class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:focus:border-neutral-500"
      >
        <option value="zh">{{ t('settings_language_zh') }}</option>
        <option value="en">{{ t('settings_language_en') }}</option>
      </select>
    </div>
    <div class="space-y-2 pt-2">
      <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{{ t('settings_avatar_title') }}</span>
      <label class="block space-y-1">
        <span class="text-[11px] text-neutral-500 dark:text-neutral-400">{{ t('settings_avatar_name') }}</span>
        <input
          type="text"
          :value="avatarName"
          maxlength="24"
          @input="$emit('update:avatar-name', $event.target.value)"
          class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:focus:border-neutral-500"
        />
      </label>
      <label class="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-neutral-700">
        <span class="text-neutral-700 dark:text-neutral-200">{{ t('settings_avatar_emoji') }}</span>
        <input
          type="checkbox"
          :checked="enableAvatarEmoji"
          @change="$emit('update:enable-avatar-emoji', $event.target.checked)"
          class="h-4 w-4 accent-neutral-700 dark:accent-neutral-300"
        />
      </label>
      <label class="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-neutral-700">
        <span class="text-neutral-700 dark:text-neutral-200">{{ t('settings_avatar_sound') }}</span>
        <input
          type="checkbox"
          :checked="enableAvatarSound"
          @change="$emit('update:enable-avatar-sound', $event.target.checked)"
          class="h-4 w-4 accent-neutral-700 dark:accent-neutral-300"
        />
      </label>
    </div>
    <div class="pt-2 flex justify-end">
      <button @click="$emit('save')" class="px-4 py-2 bg-neutral-800 dark:bg-neutral-200 hover:opacity-80 rounded-lg text-sm text-white dark:text-neutral-900 cursor-pointer transition-opacity">{{ t('common_save') }}</button>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from '../../i18n/index.js';

const { t } = useI18n();

defineProps({
  theme: { type: String, default: 'dark' },
  language: { type: String, default: 'zh' },
  avatarName: { type: String, default: 'AIOS' },
  enableAvatarEmoji: { type: Boolean, default: true },
  enableAvatarSound: { type: Boolean, default: false }
});

defineEmits(['set-theme', 'set-language', 'save', 'update:avatar-name', 'update:enable-avatar-emoji', 'update:enable-avatar-sound']);
</script>
