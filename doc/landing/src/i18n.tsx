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
      features: 'Vision',
      apps: 'Apps',
      openSource: 'Open Source',
      docs: 'How',
      begin: 'Get Started',
    },
    hero: {
      line1: 'The Operating System for the',
      highlight1: '',
      line2: '',
      highlight2: 'Age of AI.',
      desc:
        'Build your own software and operating system. Create your intelligent digital world.',
      cta: 'Get Started',
    },
    featuresSection: {
      title1: "A computer you've",
      title2: 'never had before',
      desc:
        'Dialogue drives everything, but goes far beyond dialogue.',
      items: [
        {
          title: 'Say it, and it happens',
          desc: "No manuals, no tutorials. Tell it what you want, and it does it. From bookkeeping to building a website — start with a single sentence.",
        },
        {
          title: 'Software made just for you',
          desc: "Other people's software comes with ads, limits, and compromises. Now you can have apps fully tailored to your needs — free and private.",
        },
        {
          title: 'More than a chat box',
          desc: 'Notes look like notes, ledgers look like ledgers. AI-generated results become real app interfaces you can open and use anytime.',
        },
        {
          title: 'Gets smarter over time',
          desc: 'AI remembers your preferences and context. Data flows between apps. The longer you use it, the more it feels like your personal assistant.',
        },
      ],
    },
    appsSection: {
      title1: 'Ready to use,',
      title2: 'or build from scratch',
      desc:
        'Built-in apps for everyday needs. One sentence to generate any new app you want.',
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
        'No sign-up, no payment. Clone the repo, install dependencies, and run it on your own machine.',
      terminal: 'terminal',
      github: 'View on GitHub',
    },
    docsSection: {
      title1: 'From idea to app',
      title2: 'in three steps',
      desc:
        '',
      steps: [
        {
          step: '01',
          title: 'You speak',
          desc: 'Describe what you need — a tool, an app, or an automated task.',
        },
        {
          step: '02',
          title: 'AI builds',
          desc: 'Understands your intent, generates code — UI, data, and logic, all at once.',
        },
        {
          step: '03',
          title: 'Just use it',
          desc: "Not a paragraph lost in a chat log, but a real app on your desktop.",
        },
      ],
    },
    ctaSection: {
      title1: 'Software that finally',
      title2: 'belongs to you.',
      desc: 'Open source, runs locally, completely free. Start creating something of your own.',
      cta: 'Get Started',
    },
    footer: {
      tagline: 'The operating system for the age of AI.',
      features: 'Vision',
      apps: 'Apps',
      install: 'Install',
      github: 'GitHub',
      copyright: 'Open source software.',
    },
  },
  zh: {
    nav: {
      home: '首页',
      features: '理念',
      apps: '应用',
      openSource: '开源',
      docs: '原理',
      begin: '开始使用',
    },
    hero: {
      line1: '人工智能时代的',
      highlight1: '',
      line2: '',
      highlight2: '操作系统。',
      desc:
        '打造专属于你的软件和操作系统，构建你的智能数字世界。',
      cta: '开始使用',
    },
    featuresSection: {
      title1: '你从未拥有过',
      title2: '这样的计算机',
      desc:
        '对话驱动一切，但不止于对话。',
      items: [
        {
          title: '说出来，就能做到',
          desc: '不用学软件，不用看教程。告诉它你想要什么，它就去做。从记账到建站，一句话开始。',
        },
        {
          title: '你的软件，只为你而生',
          desc: '别人做的软件有广告、有限制、不合你意。现在你可以拥有完全按自己需求定制的应用，免费且私有。',
        },
        {
          title: '不只是聊天框',
          desc: '笔记有笔记的样子，账本有账本的样子。AI 生成的结果会沉淀为真实可用的应用界面，随时打开，随时使用。',
        },
        {
          title: '越用越懂你',
          desc: 'AI 记住你的偏好和上下文，应用之间的数据互相流通。用得越久，它就越像你的专属助手。',
        },
      ],
    },
    appsSection: {
      title1: '开箱即用',
      title2: '或从零创造',
      desc:
        '内置丰富应用满足日常所需，一句话就能生成你想要的新应用。',
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
      desc: '无需注册，无需付费。克隆仓库，安装依赖，在你自己的机器上跑起来。',
      terminal: '终端',
      github: '查看 GitHub',
    },
    docsSection: {
      title1: '从想法到应用',
      title2: '只需三步',
      desc:
        '',
      steps: [
        {
          step: '01',
          title: '你说',
          desc: '描述你的需求，一个工具、一个应用、或一个自动化的任务。',
        },
        {
          step: '02',
          title: 'AI 造',
          desc: '理解意图，生成代码，界面、数据、逻辑一步到位。',
        },
        {
          step: '03',
          title: '直接用',
          desc: '不是聊天记录里的一段文字，而是桌面上一个真实的应用。',
        },
      ],
    },
    ctaSection: {
      title1: '软件，第一次',
      title2: '真正属于你。',
      desc: '开源、本地运行、完全免费。现在就开始创造属于你自己的东西。',
      cta: '开始使用',
    },
    footer: {
      tagline: 'AI 时代的操作系统。',
      features: '理念',
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
