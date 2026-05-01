<template>
  <section>
    <div class="text-[11px] font-semibold uppercase tracking-widest text-muted">AIOS</div>
    <h3 class="mt-2 text-[18px] font-semibold text-ink">__T_SETTINGS_ABOUT_TITLE__</h3>
    <p class="mt-3 text-[13px] leading-6 text-muted">
      __T_SETTINGS_ABOUT_TEXT__
    </p>
    <p class="mt-4 text-[12px] font-medium text-muted">{{ versionLabel }}</p>
  </section>
</template>

<script setup>
import runtimePkg from '../../../../package.json';
const versionLabel = `AIOS ${runtimePkg.version}`;
</script>
