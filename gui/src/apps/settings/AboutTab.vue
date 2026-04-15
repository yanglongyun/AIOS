<template>
  <section class="space-y-4">
    <div class="rounded-[13px] border px-5 py-5" style="background:#fff;border-color:rgba(0,0,0,0.08)">
      <div class="text-[11px] font-semibold uppercase tracking-widest" style="color:rgba(160,120,80,0.7)">AIOS</div>
      <h3 class="mt-2 text-[18px] font-semibold" style="color:#2a1f13">__T_SETTINGS_ABOUT_TITLE__</h3>
      <p class="mt-3 text-[13px] leading-6" style="color:rgba(0,0,0,0.5)">__T_SETTINGS_ABOUT_DESC__</p>
      <p class="mt-4 text-[12px] font-medium" style="color:rgba(0,0,0,0.42)">{{ versionLabel }}</p>
      <p class="mt-4 text-[12px] tracking-wide" style="color:rgba(0,0,0,0.3)">__T_SETTINGS_ABOUT_LAB__</p>
      <a
        href="https://github.com/valueriver/AIOS"
        target="_blank"
        rel="noreferrer"
        class="mt-5 inline-flex text-[12px] underline underline-offset-4 transition-colors"
        style="color:rgba(0,0,0,0.4);text-decoration-color:rgba(0,0,0,0.2)"
      >__T_SETTINGS_ABOUT_MORE__</a>
    </div>
  </section>
</template>

<script setup>
import runtimePkg from '../../../../package.json';

const versionLabel = `Client ${runtimePkg.version} / Runtime ${runtimePkg.version}`;
</script>
