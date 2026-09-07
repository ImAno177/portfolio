export const profile = {
  name: "ImAno177",
  role: "Cloud Security / Web3 Security",
  summary: "A security-focused builder working across cloud systems, Android experiments, program analysis, and local-first software.",
  interests: ["cloud security", "Web3 security", "Android security", "program analysis"],
  languages: ["Go", "C++", "Python", "Kotlin"],
  markup: ["HTML", "CSS", "Markdown"],
  habitat: "Windows // Linux",
  editor: "VS Code",
  email: "bachchi17705@gmail.com",
  discord: "imbot177",
  github: "https://github.com/ImAno177",
  portfolio: "https://imano177.github.io/portfolio/"
} as const;

export const projects = [
  {
    id: "paperreader",
    title: "PaperReader",
    type: "Product / Android",
    description: "Local-first Android reader for discovering and reading scientific papers in a mobile-friendly layout.",
    tags: ["Kotlin", "Android", "local-first"],
    href: "https://github.com/ImAno177/PaperReader",
    hotspot: "projects"
  },
  {
    id: "android-security-lab",
    title: "Android Security Lab",
    type: "Security / Reports",
    description: "Android security labs covering Frida, root detection, APK analysis, secure programming, and original reports.",
    tags: ["Frida", "APK analysis", "Android"],
    href: "https://github.com/ImAno177/android-security-lab",
    hotspot: "research"
  },
  {
    id: "spider",
    title: "Spider",
    type: "Analysis / Solidity",
    description: "Solidity CPG extractor with cross-contract control and data flow, plus deterministic JSON and DOT exports.",
    tags: ["Python", "Solidity", "CPG"],
    href: "https://github.com/ImAno177/spider",
    hotspot: "github"
  }
] as const;

export const researchNotes = [
  { label: "01", title: "Android instrumentation", text: "Frida, root detection, APK analysis, and secure programming notes live in the Android Security Lab." },
  { label: "02", title: "Program analysis", text: "Spider turns Solidity into deterministic JSON and DOT traces for cross-contract control and data flow." },
  { label: "03", title: "Local-first tools", text: "PaperReader explores a mobile reading surface that stays useful when the network disappears." }
] as const;

export const skillGroups = [
  { label: "systems", values: ["Cloud security", "Web3 security", "Android security"] },
  { label: "build", values: ["Go", "C++", "Python", "Kotlin"] },
  { label: "surface", values: ["HTML", "CSS", "Markdown", "local-first"] }
] as const;
