<template>
  <div class="h-full overflow-y-auto cc-thin-scroll px-6 py-5 space-y-4">
    <div>
      <div class="text-[17px] font-bold">__T_CLAUDE_ACCOUNT_TITLE__</div>
      <div class="text-[11.5px]" style="color:#6b5a46">__T_CLAUDE_ACCOUNT_SOURCE__ <span class="cc-mono">claude auth status --json</span></div>
    </div>
    <div v-if="!data" class="text-[12px]" style="color:#8a7965">__T_CLAUDE_LOADING__</div>
    <div v-else-if="!data.available" class="text-[12px]" style="color:#b03a20">{{ data.error || '__T_CLAUDE_UNAVAILABLE__' }}</div>
    <template v-else>
      <div class="grid grid-cols-3 gap-3">
        <div class="cc-stat-card">
          <div class="cc-stat-label">__T_CLAUDE_ACCOUNT_LOGIN_STATUS__</div>
          <div class="cc-stat-value" :style="data.loggedIn ? 'color:#1f8a5c' : 'color:#b03a20'">{{ data.loggedIn ? '__T_CLAUDE_ACCOUNT_LOGGED_IN__' : '__T_CLAUDE_ACCOUNT_LOGGED_OUT__' }}</div>
        </div>
        <div class="cc-stat-card">
          <div class="cc-stat-label">__T_CLAUDE_ACCOUNT_AUTH_METHOD__</div>
          <div class="cc-stat-value cc-mono" style="font-size:18px">{{ data.authMethod || '-' }}</div>
        </div>
        <div class="cc-stat-card">
          <div class="cc-stat-label">__T_CLAUDE_ACCOUNT_PROVIDER__</div>
          <div class="cc-stat-value cc-mono" style="font-size:18px">{{ data.apiProvider || '-' }}</div>
        </div>
      </div>
      <div class="cc-chart-card">
        <div class="cc-chart-title mb-2">__T_CLAUDE_ACCOUNT_RAW__</div>
        <pre class="cc-mono text-[11.5px] p-3 rounded-md overflow-x-auto" style="background:#1f1a12;color:#e8d8a8">{{ JSON.stringify(data, null, 2) }}</pre>
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, default: null } });
</script>
