import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'zh'

type LandingCopy = {
  nav: {
    home: string
    features: string
    apps: string
    openSource: string
    docs: string
    begin: string
  }
  hero: {
    line1: string
    highlight1: string
    line2: string
    highlight2: string
    desc: string
    cta: string
  }
  featuresSection: {
    title1: string
    title2: string
    desc: string
    items: Array<{ title: string; desc: string }>
  }
  appsSection: {
    title1: string
    title2: string
    desc: string
    items: Array<{ name: string; desc: string }>
  }
  openSourceSection: {
    title1: string
    title2: string
    desc: string
    terminal: string
    github: string
  }
  docsSection: {
    title1: string
    title2: string
    desc: string
    steps: Array<{ step: string; title: string; desc: string }>
  }
  ctaSection: {
    title1: string
    title2: string
    desc: string
    cta: string
  }
  footer: {
    tagline: string
    features: string
    apps: string
    install: string
    github: string
    copyright: string
  }
}

type I18nValue = {
  lang: Lang
  t: LandingCopy
}

const translations: Record<Lang, LandingCopy> = {
  en: {
    nav: {
      home: 'Home',
      features: 'Features',
      apps: 'Apps',
      openSource: 'Open Source',
      docs: 'Docs',
      begin: 'Begin Journey',
    },
    hero: {
      line1: 'Where',
      highlight1: 'dialogue',
      line2: 'becomes',
      highlight2: 'your operating system.',
      desc:
        'A personal AI operating system that runs locally on your machine. Converse to build apps, automate tasks with AI agents, and own your entire digital world — no code, no cloud, no compromise.',
      cta: 'Begin Journey',
    },
    featuresSection: {
      title1: 'Built for a new kind of',
      title2: 'computing',
      desc:
        'AIOS reimagines how humans and machines collaborate. Every feature serves one mission — making dialogue the most powerful interface on your desktop.',
      items: [
        {
          title: 'Conversation-First',
          desc: 'Speak your intent, skip the menus. Dialogue is the primary interface — every action begins with a conversation.',
        },
        {
          title: 'AI-Native Apps',
          desc: 'Apps that delegate complex decisions to AI, and AI that orchestrates apps. A bidirectional, living ecosystem.',
        },
        {
          title: 'Local & Private',
          desc: 'Runs entirely on your machine. Your data never leaves, no cloud dependency, no subscriptions, no compromises.',
        },
        {
          title: 'Zero-Code Creation',
          desc: 'Describe what you need. AIOS builds the complete app — routes, database, frontend — from a single conversation.',
        },
        {
          title: 'Autonomous Agents',
          desc: 'Schedule AI agents on cron. From daily news digests to autonomous crypto trading — tasks that run while you sleep.',
        },
        {
          title: 'Persistent Memory',
          desc: 'System-wide context that flows across conversations and apps. AIOS remembers, so you never repeat yourself.',
        },
      ],
    },
    appsSection: {
      title1: 'An ecosystem that',
      title2: 'thinks with you',
      desc:
        '16+ built-in applications, each AI-aware. From personal notes to autonomous trading, every app understands your intent.',
      items: [
        { name: 'Chat', desc: 'Multi-session AI conversations with streaming and tool calling' },
        { name: 'Tasks', desc: 'Schedule and execute AI agent tasks in the background' },
        { name: 'Notebook', desc: 'Lightweight notes with search, pinning, and AI sync' },
        { name: 'Finance', desc: 'Intelligent income and expense tracking' },
        { name: 'Reader', desc: 'Interactive AI-driven fiction with branching narratives' },
        { name: 'Subscriber', desc: 'AI-curated daily digests from your topic subscriptions' },
        { name: 'CryptoBot', desc: 'Autonomous cryptocurrency trading via AI decisions' },
        { name: 'Create', desc: 'Generate entirely new apps through conversation' },
      ],
    },
    openSourceSection: {
      title1: 'Open source.',
      title2: 'Clone and run.',
      desc:
        'Open source, local-first, and simple to run. Clone the repo, install dependencies, and start it yourself.',
      terminal: 'terminal',
      github: 'View on GitHub',
    },
    docsSection: {
      title1: 'How it',
      title2: 'works',
      desc:
        'Three layers, one philosophy. Dialogue drives everything — apps persist your results, agents handle the rest.',
      steps: [
        {
          step: '01',
          title: 'You speak',
          desc: 'Type or describe what you need — a note, a task, a brand-new app. No menu hunting, no configuration screens.',
        },
        {
          step: '02',
          title: 'AI reasons',
          desc: 'The agent loop calls your LLM, invokes tools, reads context, and orchestrates the right apps — all in real time.',
        },
        {
          step: '03',
          title: 'Apps persist',
          desc: 'Results land in structured, searchable apps — notebooks, ledgers, readers — not buried in a chat log.',
        },
      ],
    },
    ctaSection: {
      title1: 'Your machine.',
      title2: 'Your rules.',
      desc: 'No accounts. No subscriptions. No data leaves your device. Just install and start building.',
      cta: 'Begin Journey',
    },
    footer: {
      tagline: 'A personal AI operating system.',
      features: 'Features',
      apps: 'Apps',
      install: 'Install',
      github: 'GitHub',
      copyright: 'Open source software.',
    },
  },
  zh: {
    nav: {
      home: '首页',
      features: '特性',
      apps: '应用',
      openSource: '开源',
      docs: '原理',
      begin: '开始体验',
    },
    hero: {
      line1: '让',
      highlight1: '对话',
      line2: '成为你的',
      highlight2: '操作系统。',
      desc:
        '一套运行在你自己机器上的个人 AI 操作系统。通过对话创建应用、用 AI 代理自动执行任务，并真正拥有你的数字世界 —— 无需代码、无需云端、无需妥协。',
      cta: '开始体验',
    },
    featuresSection: {
      title1: '为新一代',
      title2: '计算方式而生',
      desc:
        'AIOS 重新定义了人与机器的协作方式。每一个能力都服务于同一个目标 —— 让对话成为桌面上最强大的界面。',
      items: [
        {
          title: '对话优先',
          desc: '直接说出你的意图，跳过层层菜单。对话就是主界面，所有操作都从一次表达开始。',
        },
        {
          title: 'AI 原生应用',
          desc: '应用把复杂决策交给 AI，AI 又能反过来编排应用，形成双向驱动、持续生长的生态。',
        },
        {
          title: '本地运行与隐私优先',
          desc: '完全运行在你的机器上。数据不离开设备，不依赖云端，没有订阅束缚，也没有额外妥协。',
        },
        {
          title: '零代码创建',
          desc: '只需描述需求，AIOS 就能从一次对话中生成完整应用：路由、数据库和前端都一起完成。',
        },
        {
          title: '自治代理',
          desc: '支持按 cron 调度 AI 代理。从每日信息摘要到自动化交易，让任务在你离开时继续运行。',
        },
        {
          title: '持久记忆',
          desc: '系统级上下文在对话与应用之间流动。AIOS 会记住你，不必重复说明背景。',
        },
      ],
    },
    appsSection: {
      title1: '一个会',
      title2: '与你思考的生态',
      desc:
        '内置 16+ 个 AI 感知应用。从个人笔记到自动交易，每个应用都能理解你的真实意图。',
      items: [
        { name: '聊天', desc: '支持多会话、流式输出与工具调用的 AI 对话' },
        { name: '任务', desc: '在后台调度并执行 AI 代理任务' },
        { name: '笔记', desc: '轻量笔记，支持搜索、置顶与 AI 协作' },
        { name: '财务', desc: '智能收入支出记录' },
        { name: '阅读', desc: '由 AI 驱动、可交互推进的小说阅读体验' },
        { name: '订阅', desc: '基于主题订阅生成每日 AI 摘要' },
        { name: '加密机器人', desc: '通过 AI 决策进行自动化加密货币交易' },
        { name: '创建', desc: '通过对话直接生成全新应用' },
      ],
    },
    openSourceSection: {
      title1: '完全开源。',
      title2: '拉取即可运行。',
      desc: '开源、本地优先、启动简单。克隆仓库、安装依赖，然后立刻在你自己的机器上跑起来。',
      terminal: '终端',
      github: '查看 GitHub',
    },
    docsSection: {
      title1: '它是如何',
      title2: '运作的',
      desc:
        '三层结构，一个核心理念。对话驱动一切 —— 应用承接结果，代理负责持续执行。',
      steps: [
        {
          step: '01',
          title: '你表达',
          desc: '输入或描述你的需求 —— 一条笔记、一个任务，或者一整个新应用。不用四处找菜单，也不用配置页面。',
        },
        {
          step: '02',
          title: 'AI 推理',
          desc: '代理循环会调用模型、使用工具、读取上下文，并在实时中编排出正确的应用和动作。',
        },
        {
          step: '03',
          title: '应用沉淀',
          desc: '结果会进入结构化、可检索的应用中 —— 笔记、账本、阅读器，而不是埋在聊天记录里。',
        },
      ],
    },
    ctaSection: {
      title1: '你的机器。',
      title2: '你的规则。',
      desc: '没有账号体系，没有订阅束缚，没有数据外流。安装完成后，立刻开始构建。',
      cta: '开始体验',
    },
    footer: {
      tagline: '一套个人 AI 操作系统。',
      features: '特性',
      apps: '应用',
      install: '安装',
      github: 'GitHub',
      copyright: '开源软件。',
    },
  },
}

function detectLanguage(): Lang {
  if (typeof navigator === 'undefined') return 'en'
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

const I18nContext = createContext<I18nValue>({
  lang: 'en',
  t: translations.en,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang] = useState<Lang>(detectLanguage)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
