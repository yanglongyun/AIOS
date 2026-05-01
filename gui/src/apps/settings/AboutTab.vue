<template>
  <section>
    <div class="text-[11px] font-semibold uppercase tracking-widest text-muted">iimos</div>
    <h3 class="mt-2 text-[18px] font-semibold text-ink">关于 iimos</h3>
    <p class="mt-3 text-[13px] leading-6 text-muted">
      把家里那台电脑变成你的远程 AI 操作系统。理解你的意图,为你执行任务、管理文件、操作终端 —— 一切都在本机运行,数据归你所有。
    </p>
    <p class="mt-4 text-[12px] font-medium text-muted">{{ versionLabel }}</p>
  </section>
</template>

<script setup>
import runtimePkg from '../../../../package.json';
const versionLabel = `iimos ${runtimePkg.version}`;
</script>
