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
    href: "https://github.com/ImAno177/PaperReader"
  },
  {
    id: "android-security-lab",
    title: "Android Security Lab",
    type: "Security / Reports",
    description: "Android security labs covering Frida, root detection, APK analysis, secure programming, and original reports.",
    tags: ["Frida", "APK analysis", "Android"],
    href: "https://github.com/ImAno177/android-security-lab"
  },
  {
    id: "spider",
    title: "Spider",
    type: "Analysis / Solidity",
    description: "Solidity CPG extractor with cross-contract control and data flow, plus deterministic JSON and DOT exports.",
    tags: ["Python", "Solidity", "CPG"],
    href: "https://github.com/ImAno177/spider"
  }
] as const;

export const skillGroups = [
  { label: "systems", values: ["Cloud security", "Web3 security", "Android security"] },
  { label: "build", values: ["Go", "C++", "Python", "Kotlin"] },
  { label: "surface", values: ["HTML", "CSS", "Markdown", "local-first"] }
] as const;

export const certificates = [
  {
    id: "ibm-compliance",
    title: "Cybersecurity Compliance Framework, Standards & Regulations",
    issuer: "IBM",
    kind: "Course certificate",
    issued: "2026-09-11",
    date: "September 11, 2026",
    image: "assets/certificates/ibm-compliance.webp",
    href: "https://coursera.org/share/3b7aef3efdfd559379d603aa671d2059",
    credentialId: "Y8915IW7BKON",
    description: "Governance, risk and compliance; NIST CSF, ISO/IEC 27001, COBIT, SOC reports and security audits.",
    tags: ["Governance", "Compliance", "Risk management"]
  },
  {
    id: "google-cybersecurity",
    title: "Google Cybersecurity Professional Certificate",
    issuer: "Google",
    kind: "Professional certificate",
    issued: "2026-09-16",
    date: "September 16, 2026",
    image: "assets/certificates/google-cybersecurity.webp",
    href: "https://coursera.org/share/dc3ee9abc7399aa99c29561212168529",
    credentialId: "QCAFQ8T2LGU7",
    description: "Hands-on cybersecurity training in Python, Linux, SQL, SIEM and intrusion detection, with security risk and threat mitigation.",
    tags: ["Cybersecurity", "Python & Linux", "SIEM / IDS"]
  },
  {
    id: "bsi-ai-risk",
    title: "AI Technical Risk Controls Specialization",
    issuer: "British Standards Institution",
    kind: "Specialization certificate",
    issued: "2026-09-19",
    date: "September 19, 2026",
    image: "assets/certificates/bsi-ai-risk.webp",
    href: "https://coursera.org/share/d313789af9f4051f86e54a629869791d",
    credentialId: "TPW0FB2QCIEP",
    description: "Standards-based evaluation of neural network robustness, classification performance and unwanted bias in AI systems.",
    tags: ["AI risk", "ISO/IEC guidance", "Model evaluation"]
  }
] as const;

export type CertificateId = (typeof certificates)[number]["id"];
