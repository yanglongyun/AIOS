<template>
  <div class="h-full overflow-y-auto cc-thin-scroll px-6 py-5 space-y-4">
    <div>
      <div class="text-[17px] font-bold">__T_CLAUDE_ACCOUNT_TITLE__</div>
      <div class="text-[11.5px]" style="color:#6b5a46">__T_CLAUDE_ACCOUNT_SOURCE__ <span class="cc-mono">claude auth status --json</span></div>
    </div>
    <div v-if="!data" class="text-[12px]" style="color:#8a7965">__T_CLAUDE_LOADING__</div>
    <div v-else-if="!data.available" class="text-[12px]" style="color:#b03a20">{{ data.error || '__T_CLAUDE_UNAVAILABLE__' }}</div>
    <template v-else>
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-3">
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
        <div class="cc-stat-card">
          <div class="cc-stat-label">__T_CLAUDE_ACCOUNT_SUBSCRIPTION__</div>
          <div class="cc-stat-value cc-mono" style="font-size:18px">{{ data.subscriptionType || '-' }}</div>
        </div>
      </div>

      <div class="cc-chart-card">
        <div class="cc-chart-title mb-3">__T_CLAUDE_ACCOUNT_DETAILS__</div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="rounded-xl border p-3" style="border-color:rgba(160,120,80,0.16);background:rgba(255,248,238,0.55)">
            <div class="text-[11px] font-semibold uppercase tracking-[0.14em]" style="color:#8a7965">__T_CLAUDE_ACCOUNT_EMAIL__</div>
            <div class="mt-1 break-all text-[14px] font-medium" style="color:#2c241c">{{ data.email || '-' }}</div>
          </div>
          <div class="rounded-xl border p-3" style="border-color:rgba(160,120,80,0.16);background:rgba(255,248,238,0.55)">
            <div class="text-[11px] font-semibold uppercase tracking-[0.14em]" style="color:#8a7965">__T_CLAUDE_ACCOUNT_ORG_NAME__</div>
            <div class="mt-1 text-[14px] font-medium" style="color:#2c241c">{{ data.orgName || '-' }}</div>
          </div>
          <div class="rounded-xl border p-3 md:col-span-2" style="border-color:rgba(160,120,80,0.16);background:rgba(255,248,238,0.55)">
            <div class="text-[11px] font-semibold uppercase tracking-[0.14em]" style="color:#8a7965">__T_CLAUDE_ACCOUNT_ORG_ID__</div>
            <div class="cc-mono mt-1 break-all text-[12.5px]" style="color:#5b4637">{{ data.orgId || '-' }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, default: null } });
</script>
