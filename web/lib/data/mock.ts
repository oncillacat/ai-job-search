// Sample data for the front-end-only build. Every person and organization
// here is fictional. Nothing is fetched, generated, or stored on a server.

import type {
  Application,
  Digest,
  Evaluation,
  InterviewPrep,
  Job,
  JobBoard,
  SearchRound,
  Preferences,
  Profile,
  TailoredDocuments,
} from "./types";

export const profile: Profile = {
  name: "Alex Morgan",
  headline: "Health data analyst · SQL, R, Python · population health",
  email: "alex.morgan@example.com",
  location: "Toronto, ON",
  workAuthorization: "Canadian permanent resident",
  languages: [
    { name: "English", level: "Native" },
    { name: "French", level: "Intermediate (B1)" },
  ],
  targetRoles: ["Health Data Analyst", "Research Analyst", "Biostatistician"],
  targetCities: ["Toronto", "Mississauga", "Remote (Canada)"],
  summary:
    "Data analyst with three years of experience turning hospital and community health data into reports that clinical teams use. Comfortable with SQL, R and Python, and with explaining results to people who don't work with data.",
  experience: [
    {
      id: "harbourline",
      title: "Data Analyst",
      org: "Harbourline Community Health",
      location: "Toronto, ON",
      start: "2023",
      end: "Present",
      bullets: [
        "Built monthly dashboards on wait times and visit volumes for five clinics.",
        "Wrote SQL pipelines that cut report preparation from two days to two hours.",
        "Analysed patient survey data in R and presented findings to clinical leads.",
      ],
    },
    {
      id: "westbrook",
      title: "Research Assistant",
      org: "Westbrook University, School of Public Health",
      location: "Hamilton, ON",
      start: "2021",
      end: "2023",
      bullets: [
        "Cleaned and linked survey data for a 2,400-person cohort study.",
        "Ran regression models in R and drafted the methods section of two reports.",
      ],
    },
  ],
  education: [
    {
      id: "msc",
      degree: "MSc, Epidemiology",
      school: "Westbrook University",
      start: "2021",
      end: "2023",
    },
    {
      id: "bsc",
      degree: "BSc, Health Sciences",
      school: "Lakehead Valley University",
      start: "2017",
      end: "2021",
    },
  ],
  skills: [
    "SQL",
    "R",
    "Python",
    "Power BI",
    "Regression modelling",
    "Survey analysis",
    "Data linkage",
    "Report writing",
  ],
};

export const jobs: Job[] = [
  {
    id: "maplewood-health-data-analyst",
    title: "Health Data Analyst",
    company: "Maplewood Health Network",
    location: "Toronto, ON",
    workplace: "Hybrid",
    salary: "$72,000 – $84,000",
    source: "Job Bank Canada",
    postedDaysAgo: 3,
    closesInDays: 12,
    about:
      "Join the decision support team of a four-hospital network. You'll build reports on patient flow and quality indicators, and work with clinical managers to understand what the numbers mean for their units.",
    requirements: [
      "Degree in health sciences, epidemiology, statistics or related field",
      "2+ years working with hospital or health system data",
      "Strong SQL; experience with R or Python",
      "Experience building dashboards (Power BI or Tableau)",
      "Clear communication with non-technical audiences",
    ],
    niceToHave: ["Knowledge of CIHI data standards", "Experience with patient flow metrics"],
    applicationQuestions: [
      "Are you legally eligible to work in Canada?",
      "Why are you interested in this role at Maplewood Health Network? (150 words max)",
      "How many years of experience do you have with SQL?",
      "Describe a time you explained data to a non-technical audience.",
      "What are your salary expectations?",
      "When can you start?",
    ],
  },
  {
    id: "lakeshore-research-analyst",
    title: "Research Analyst, Population Health",
    company: "Lakeshore Public Health Unit",
    location: "Mississauga, ON",
    workplace: "Hybrid",
    salary: "$78,500 – $91,200",
    source: "Job Bank Canada",
    postedDaysAgo: 5,
    closesInDays: 9,
    about:
      "Support the epidemiology team with surveillance reports, community health status reports and program evaluations. You'll analyse survey and administrative data and help translate findings for public audiences.",
    requirements: [
      "Master's degree in epidemiology, public health or biostatistics",
      "Experience analysing population health survey data",
      "Proficiency in R or SAS",
      "Experience writing reports for public audiences",
    ],
    niceToHave: ["Experience with GIS mapping", "Knowledge of Ontario public health standards"],
    applicationQuestions: [
      "Are you legally eligible to work in Canada?",
      "Why do you want to work in public health? (200 words max)",
      "How many years of experience do you have with R?",
      "Describe a report you wrote for a public audience.",
      "When can you start?",
    ],
  },
  {
    id: "northbridge-junior-biostatistician",
    title: "Junior Biostatistician",
    company: "Northbridge Clinical Research",
    location: "Montréal, QC",
    workplace: "Remote",
    salary: "$68,000 – $78,000",
    source: "Job Bank Canada",
    postedDaysAgo: 2,
    closesInDays: 21,
    about:
      "Work alongside senior statisticians on clinical trial analyses. You'll program tables, listings and figures, and help write statistical analysis plans.",
    requirements: [
      "Master's degree in biostatistics, statistics or epidemiology",
      "Programming experience in SAS or R",
      "Understanding of clinical trial design",
      "Attention to detail and documentation",
    ],
    niceToHave: ["CDISC (SDTM/ADaM) exposure", "French is an asset"],
  },
  {
    id: "riverbend-qi-analyst",
    title: "Data Analyst, Quality Improvement",
    company: "Riverbend General Hospital",
    location: "Toronto, ON",
    workplace: "On-site",
    salary: "$70,000 – $80,000",
    source: "LinkedIn (link you pasted)",
    postedDaysAgo: 19,
    about:
      "Support quality improvement projects with data on readmissions, length of stay and patient experience.",
    requirements: [
      "Experience with hospital data",
      "SQL and Excel",
      "Experience with run charts or statistical process control",
    ],
    niceToHave: ["Lean or QI training"],
  },
  {
    id: "cedarpoint-clinical-data",
    title: "Clinical Data Coordinator",
    company: "Cedar Point Research Institute",
    location: "Toronto, ON",
    workplace: "Hybrid",
    source: "Job Bank Canada",
    postedDaysAgo: 26,
    about: "Coordinate data collection and quality checks for multi-site clinical studies.",
    requirements: [
      "Experience with research data collection",
      "Comfort with REDCap or similar tools",
      "Organised and detail-oriented",
    ],
    niceToHave: ["Clinical research certification"],
  },
];

export const evaluations: Evaluation[] = [
  {
    jobId: "maplewood-health-data-analyst",
    verdict: "go",
    score: 84,
    headline: "This one fits you well. It's worth an application.",
    reasons: [
      "Your clinic dashboards and SQL pipelines match the core of the role.",
      "You already explain results to clinical leads, which they ask for directly.",
      "Hybrid in Toronto matches your target city.",
    ],
    eligibility: { status: "pass", note: "No citizenship requirement; you're a permanent resident." },
    language: { status: "pass", note: "English only." },
    dimensions: [
      { name: "Skills", strength: 5, note: "SQL, R, Python and Power BI all match." },
      { name: "Experience", strength: 4, note: "3 years with community health data; hospital data is close." },
      { name: "Domain", strength: 4, note: "Health system reporting is your field." },
      { name: "Growth", strength: 4, note: "Bigger network, more complex data." },
      { name: "Practical", strength: 5, note: "City, salary and hybrid setup all fit." },
    ],
    gaps: ["No direct experience with CIHI data standards. This is a nice-to-have, and you can learn it."],
    keywords: [
      { term: "SQL", status: "covered" },
      { term: "Power BI", status: "covered" },
      { term: "dashboards", status: "covered" },
      { term: "patient flow", status: "added", note: "Your wait-time work is patient flow; the CV now says so." },
      { term: "quality indicators", status: "added", note: "Reframed from your clinic reporting." },
      { term: "non-technical audiences", status: "covered" },
      { term: "CIHI", status: "absent", note: "Left out honestly. It's a nice-to-have." },
    ],
  },
  {
    jobId: "lakeshore-research-analyst",
    verdict: "go",
    score: 78,
    headline: "A good match with your epidemiology background.",
    reasons: [
      "Your MSc in Epidemiology and cohort work line up with their surveillance reports.",
      "You've written report methods sections and presented to non-specialists.",
      "Mississauga is on your list of cities.",
    ],
    eligibility: { status: "pass", note: "Open to permanent residents." },
    language: { status: "pass", note: "English only." },
    dimensions: [
      { name: "Skills", strength: 4, note: "R matches; they also mention SAS." },
      { name: "Experience", strength: 4, note: "Survey analysis at Harbourline and Westbrook." },
      { name: "Domain", strength: 5, note: "Population health is exactly your training." },
      { name: "Growth", strength: 4, note: "Exposure to public health surveillance." },
      { name: "Practical", strength: 4, note: "Commute to Mississauga is manageable on hybrid days." },
    ],
    gaps: ["No GIS mapping experience. It's listed as nice-to-have only."],
    keywords: [
      { term: "population health", status: "covered" },
      { term: "survey data", status: "covered" },
      { term: "R", status: "covered" },
      { term: "public audiences", status: "added", note: "Your report writing now uses their wording." },
      { term: "SAS", status: "absent", note: "You don't use SAS; R is accepted." },
      { term: "GIS", status: "absent" },
    ],
  },
  {
    jobId: "northbridge-junior-biostatistician",
    verdict: "maybe",
    score: 66,
    headline: "A stretch, but a reasonable one. It's your call.",
    reasons: [
      "Your regression work in R is relevant, but clinical trials are new to you.",
      "Fully remote, so location isn't a concern.",
      "French is an asset, not a requirement; your B1 level is a plus.",
    ],
    eligibility: { status: "pass", note: "Remote within Canada; no citizenship requirement." },
    language: { status: "flag", note: "French listed as an asset. You have B1, so it won't block you." },
    dimensions: [
      { name: "Skills", strength: 4, note: "R matches; SAS is preferred in the industry." },
      { name: "Experience", strength: 2, note: "No clinical trial experience yet." },
      { name: "Domain", strength: 3, note: "Adjacent: epidemiology rather than trials." },
      { name: "Growth", strength: 5, note: "A clear path into biostatistics." },
      { name: "Practical", strength: 4, note: "Remote; salary a bit lower than your current range." },
    ],
    gaps: [
      "No clinical trial design experience.",
      "No CDISC exposure. This is common for junior roles.",
    ],
    keywords: [
      { term: "R", status: "covered" },
      { term: "statistical analysis plan", status: "added", note: "Drawn from your methods-section drafting." },
      { term: "clinical trial", status: "absent", note: "Not claimed. It's a genuine gap." },
      { term: "SAS", status: "absent" },
      { term: "CDISC", status: "absent" },
    ],
  },
  {
    jobId: "riverbend-qi-analyst",
    verdict: "go",
    score: 75,
    headline: "Solid fit for your hospital-reporting experience.",
    reasons: [
      "Readmission and length-of-stay reporting is close to your clinic work.",
      "SQL is central, and you have it.",
    ],
    eligibility: { status: "pass", note: "No restrictions listed." },
    language: { status: "pass", note: "English only." },
    dimensions: [
      { name: "Skills", strength: 4, note: "SQL matches; SPC charts are new." },
      { name: "Experience", strength: 4, note: "Health reporting." },
      { name: "Domain", strength: 4, note: "Quality improvement in hospitals." },
      { name: "Growth", strength: 3, note: "Similar level to your current role." },
      { name: "Practical", strength: 4, note: "On-site in Toronto." },
    ],
    gaps: ["Statistical process control charts are new to you."],
    keywords: [
      { term: "SQL", status: "covered" },
      { term: "hospital data", status: "covered" },
      { term: "run charts", status: "absent" },
    ],
  },
  {
    jobId: "cedarpoint-clinical-data",
    verdict: "maybe",
    score: 62,
    headline: "A fair fit on the coordination side.",
    reasons: [
      "Your data cleaning on the cohort study is relevant.",
      "The role is lighter on analysis than you might like.",
    ],
    eligibility: { status: "pass", note: "No restrictions listed." },
    language: { status: "pass", note: "English only." },
    dimensions: [
      { name: "Skills", strength: 3, note: "REDCap not mentioned in your CV." },
      { name: "Experience", strength: 4, note: "Cohort data collection." },
      { name: "Domain", strength: 4, note: "Clinical research." },
      { name: "Growth", strength: 2, note: "Less analysis than now." },
      { name: "Practical", strength: 4, note: "Hybrid in Toronto." },
    ],
    gaps: ["REDCap experience not shown."],
    keywords: [
      { term: "data collection", status: "covered" },
      { term: "quality checks", status: "covered" },
      { term: "REDCap", status: "absent" },
    ],
  },
];

const master = {
  summary: profile.summary,
  harbourline: profile.experience[0].bullets.join(" "),
  westbrook: profile.experience[1].bullets.join(" "),
  skills: profile.skills.join(", "),
};

export const tailored: TailoredDocuments[] = [
  {
    jobId: "maplewood-health-data-analyst",
    version: 2,
    sections: [
      {
        label: "Profile summary",
        master: master.summary,
        tailored:
          "Health data analyst with three years of experience turning community health data into patient flow and quality reports that clinical teams use. Comfortable with SQL, R, Python and Power BI, and with explaining results to non-technical audiences.",
      },
      {
        label: "Data Analyst · Harbourline Community Health",
        master: master.harbourline,
        tailored:
          "Built monthly Power BI dashboards on patient flow (wait times and visit volumes) for five clinics. Wrote SQL pipelines that cut report preparation from two days to two hours. Analysed patient survey data in R and presented findings to clinical leads.",
      },
      {
        label: "Research Assistant · Westbrook University",
        master: master.westbrook,
        tailored: master.westbrook,
      },
      {
        label: "Skills",
        master: master.skills,
        tailored: "SQL, Power BI, R, Python, Report writing, Regression modelling, Survey analysis, Data linkage",
      },
    ],
    coverLetter: [
      "Dear Hiring Manager,",
      "I'm applying for the Health Data Analyst role on Maplewood Health Network's decision support team. For the past three years at Harbourline Community Health, I've built the monthly reports that five clinics use to track wait times and visit volumes, and I've learned that a report is only useful when the people reading it trust it and understand it.",
      "Your posting asks for strong SQL, dashboard experience and clear communication with clinical managers. Rebuilding our reporting pipeline in SQL cut preparation time from two days to two hours, and presenting survey findings to clinical leads is a regular part of my week. I haven't worked with CIHI data standards yet, and I'd be glad to learn them on the job.",
      "I'd welcome the chance to bring the same care to patient flow and quality reporting across your four hospitals.",
      "Sincerely,\nAlex Morgan",
    ],
    checks: [
      { label: "Covers the key requirements", passed: true, detail: "5 of 5 must-haves addressed." },
      { label: "No claims beyond your profile", passed: true, detail: "Every line traces to your master CV." },
      { label: "CV is 2 pages, letter is 1 page", passed: true, detail: "Layout checked after compiling." },
      { label: "Readable by applicant tracking systems", passed: true, detail: "Text extracts cleanly; email and phone are plain text." },
    ],
  },
  {
    jobId: "lakeshore-research-analyst",
    version: 1,
    sections: [
      {
        label: "Profile summary",
        master: master.summary,
        tailored:
          "Epidemiology-trained analyst with three years of experience analysing population health survey and administrative data. Comfortable with R, SQL and Python, and with writing reports for public audiences.",
      },
      {
        label: "Data Analyst · Harbourline Community Health",
        master: master.harbourline,
        tailored:
          "Analysed patient survey data in R and presented findings to clinical leads. Built monthly dashboards on wait times and visit volumes for five clinics. Wrote SQL pipelines that cut report preparation from two days to two hours.",
      },
      {
        label: "Research Assistant · Westbrook University",
        master: master.westbrook,
        tailored:
          "Cleaned and linked population health survey data for a 2,400-person cohort study. Ran regression models in R and drafted the methods section of two reports.",
      },
      {
        label: "Skills",
        master: master.skills,
        tailored: "R, Survey analysis, Regression modelling, Data linkage, SQL, Report writing, Python, Power BI",
      },
    ],
    coverLetter: [
      "Dear Hiring Manager,",
      "I'm applying for the Research Analyst, Population Health role at Lakeshore Public Health Unit. My MSc in Epidemiology and two years on a 2,400-person cohort study taught me how to work carefully with survey data, and my current role taught me how to make findings useful to the people who act on them.",
      "I work in R every day and have drafted methods sections for public-facing reports. I don't yet have GIS mapping experience, which I'd be keen to build with your team.",
      "Sincerely,\nAlex Morgan",
    ],
    checks: [
      { label: "Covers the key requirements", passed: true, detail: "4 of 4 must-haves addressed." },
      { label: "No claims beyond your profile", passed: true, detail: "Every line traces to your master CV." },
      { label: "CV is 2 pages, letter is 1 page", passed: true, detail: "Layout checked after compiling." },
      { label: "Readable by applicant tracking systems", passed: true, detail: "Text extracts cleanly." },
    ],
  },
  {
    jobId: "northbridge-junior-biostatistician",
    version: 1,
    sections: [
      {
        label: "Profile summary",
        master: master.summary,
        tailored:
          "Analyst with an MSc in Epidemiology and three years of applied statistics in R, including regression modelling and drafting statistical methods. Careful about documentation, and looking to grow into clinical biostatistics.",
      },
      {
        label: "Data Analyst · Harbourline Community Health",
        master: master.harbourline,
        tailored: master.harbourline,
      },
      {
        label: "Research Assistant · Westbrook University",
        master: master.westbrook,
        tailored:
          "Ran regression models in R and drafted the statistical methods section of two reports. Cleaned and linked survey data for a 2,400-person cohort study, with documented cleaning rules.",
      },
      {
        label: "Skills",
        master: master.skills,
        tailored: "R, Regression modelling, Data linkage, SQL, Python, Survey analysis, Report writing, Power BI",
      },
    ],
    coverLetter: [
      "Dear Hiring Manager,",
      "I'm applying for the Junior Biostatistician role at Northbridge Clinical Research. My background is in epidemiology rather than clinical trials, and I'm applying because I want to make that move with a team that does it well.",
      "I model in R daily and have drafted statistical methods sections; I'm comfortable writing things down so others can reproduce them. I haven't worked with CDISC standards or trial data yet, and I'd approach those with the same care.",
      "Sincerely,\nAlex Morgan",
    ],
    checks: [
      { label: "Covers the key requirements", passed: true, detail: "3 of 4 must-haves addressed; the clinical trial gap is stated honestly." },
      { label: "No claims beyond your profile", passed: true, detail: "Every line traces to your master CV." },
      { label: "CV is 2 pages, letter is 1 page", passed: true, detail: "Layout checked after compiling." },
      { label: "Readable by applicant tracking systems", passed: true, detail: "Text extracts cleanly." },
    ],
  },
];

export const applications: Application[] = [
  {
    id: "app-riverbend",
    jobId: "riverbend-qi-analyst",
    status: "interview",
    appliedOn: "Sep 25",
    roleType: "Full-time, permanent",
    channel: "Employer portal",
    contact: "Priya Nair, Quality Lead",
    nextStep: "First interview on Thursday, October 22. Prep notes are ready whenever you are.",
    cvReady: true,
    letterReady: true,
    timeline: [
      { date: "Sep 25", label: "Applied with tailored CV v1" },
      { date: "Oct 9", label: "Invited to a first interview" },
    ],
  },
  {
    id: "app-cedarpoint",
    jobId: "cedarpoint-clinical-data",
    status: "applied",
    appliedOn: "Oct 1",
    roleType: "Full-time, 12-month contract",
    channel: "Job site",
    nextStep: "No news yet. That's normal for 2–3 weeks. A short follow-up note is drafted if you want it.",
    cvReady: true,
    letterReady: true,
    timeline: [{ date: "Oct 1", label: "Applied with tailored CV v1" }],
  },
  {
    id: "app-northbridge",
    jobId: "northbridge-junior-biostatistician",
    status: "applied",
    appliedOn: "Oct 13",
    roleType: "Full-time, permanent",
    channel: "Job site",
    deadline: "Nov 5",
    deadlineInDays: 21,
    nextStep: "Sent two days ago. Nothing to do yet.",
    cvReady: true,
    letterReady: true,
    timeline: [{ date: "Oct 13", label: "Applied with tailored CV v1" }],
  },
  {
    id: "app-maplewood",
    jobId: "maplewood-health-data-analyst",
    status: "saved",
    roleType: "Full-time, permanent",
    channel: "Job site",
    deadline: "Oct 27",
    deadlineInDays: 12,
    nextStep: "Your documents are ready to send.",
    cvReady: true,
    letterReady: true,
    timeline: [{ date: "Oct 15", label: "Picked from your daily digest" }],
  },
  {
    id: "app-lakeshore",
    jobId: "lakeshore-research-analyst",
    status: "saved",
    roleType: "Full-time, permanent",
    channel: "Email",
    contact: "Dr. Samuel Osei, Epidemiology Manager",
    deadline: "Oct 24",
    deadlineInDays: 9,
    nextStep: "CV is ready. The cover letter needs one more look before it's sent.",
    cvReady: true,
    letterReady: false,
    timeline: [{ date: "Oct 15", label: "Picked from your daily digest" }],
  },
];

export const digest: Digest = {
  date: "Thursday, October 15",
  time: "9:00 a.m.",
  sources: [
    { name: "Job Bank Canada", count: 42 },
    { name: "Adzuna", count: 21 },
    { name: "Jooble", count: 9 },
    { name: "LinkedIn (links you pasted)", count: 2 },
  ],
  // high: fit 75+, medium: 50–74, low: under 50
  tiers: { high: 2, medium: 14, low: 58 },
  picks: ["maplewood-health-data-analyst", "lakeshore-research-analyst"],
  setAside: [
    {
      reason: "Different field (finance or marketing analytics)",
      count: 26,
      examples: ["Marketing Data Analyst", "Financial Reporting Analyst", "Pricing Analyst"],
    },
    {
      reason: "Outside your cities and not remote",
      count: 21,
      examples: ["Health Analyst · Calgary", "Data Analyst · Halifax", "Epidemiologist · Regina"],
    },
    {
      reason: "Senior roles asking for 8+ years",
      count: 14,
      examples: ["Senior Manager, Analytics", "Principal Biostatistician", "Director, Decision Support"],
    },
    {
      reason: "Repeats of postings you've already seen",
      count: 6,
      examples: ["Reposted listings from earlier this week"],
    },
    {
      reason: "French required for the job itself",
      count: 5,
      examples: ["Analyste de données en santé", "Agent·e de recherche"],
    },
  ],
};

export const interviewPreps: InterviewPrep[] = [
  {
    jobId: "riverbend-qi-analyst",
    focus: [
      "Show how your clinic reporting already supports quality decisions.",
      "Be open about SPC charts being new, and how you'd learn them.",
      "Bring one concrete story about a report that changed what a team did.",
    ],
    questions: [
      {
        question: "Tell us about a time your analysis changed a decision.",
        why: "Quality improvement depends on data that leads to action.",
        answerFrom: "Harbourline wait-time dashboard: a clinic moved staff to the morning peak after seeing it.",
      },
      {
        question: "How do you make sure your numbers are right?",
        why: "Hospital data has many traps: duplicates, transfers, definitions.",
        answerFrom: "Your SQL pipeline rebuild, with checks against last month's figures.",
      },
      {
        question: "How would you explain a run chart to a nurse manager?",
        why: "They named non-technical communication as key.",
        answerFrom: "How you present survey findings to clinical leads: one message per chart.",
      },
      {
        question: "What would you do in your first 90 days?",
        why: "They want to see how you get oriented.",
        answerFrom: "Learn the data sources, meet each unit lead, deliver one small useful report.",
      },
    ],
    askThem: [
      "Which quality project would I support first?",
      "How do units usually receive and discuss the data?",
      "What does a great first year look like in this role?",
    ],
  },
];

export const defaultPreferences: Preferences = {
  emailDigest: true,
  breathePause: false,
  followUpNudges: true,
};

const p = (
  id: string,
  title: string,
  company: string,
  location: string,
  source: string,
  posted: string,
  firstSeen: string,
  fit: "high" | "medium" | "low",
  note?: string,
  extra: { deadline?: string; jobId?: string } = {},
) => ({ id, title, company, location, source, posted, firstSeen, fit, note, ...extra });

export const jobBoard: JobBoard = {
  updated: "October 15, 2026",
  recorded: 665,
  fits: { high: 21, medium: 132, low: 512 },
  sources: [
    { name: "Job Bank Canada", count: 380 },
    { name: "Adzuna", count: 185 },
    { name: "Jooble", count: 84 },
    { name: "LinkedIn (links you pasted)", count: 16 },
  ],
  statuses: [
    { label: "New, not yet looked at", count: 402 },
    { label: "Set aside", count: 238 },
    { label: "Ranked", count: 20 },
    { label: "Applied", count: 5 },
  ],
  runs: [
    { date: "Oct 6", count: 58 },
    { date: "Oct 7", count: 66 },
    { date: "Oct 8", count: 81 },
    { date: "Oct 9", count: 72 },
    { date: "Oct 10", count: 49 },
    { date: "Oct 11", count: 63 },
    { date: "Oct 12", count: 77 },
    { date: "Oct 13", count: 70 },
    { date: "Oct 14", count: 55 },
    { date: "Oct 15", count: 74 },
  ],
  todo: [
    { when: "Oct 22", text: "First interview at Riverbend General Hospital. Prep notes are ready; one calm read the evening before is enough." },
    { when: "Oct 24", text: "Lakeshore Public Health Unit closes. The CV is ready; give the cover letter one more look, then send it by email." },
    { when: "Oct 27", text: "Maplewood Health Network closes. Both documents passed the Ready to send check." },
    { when: "This week", text: "Cedar Point Research Institute has been quiet for two weeks. A short follow-up note is drafted if you want to send it." },
    { when: "When you have time", text: "8 high-fit postings are waiting for a first look. There's no rush; they're listed below." },
  ],
  backlog: [
    p("b1", "Health Analytics Specialist", "Northern Lights Health Authority", "Toronto, ON", "Job Bank Canada", "Oct 13", "Oct 14", "high"),
    p("b2", "Epidemiologist I", "Grand River Public Health", "Kitchener, ON", "Adzuna", "Oct 12", "Oct 13", "high", undefined, { deadline: "Oct 30" }),
    p("b3", "Decision Support Analyst", "St. Brendan's Hospital", "Mississauga, ON", "Job Bank Canada", "Oct 11", "Oct 12", "high"),
    p("b4", "Research Coordinator, Population Health", "Westbrook University", "Hamilton, ON", "Jooble", "Oct 10", "Oct 12", "high"),
    p("b5", "Data Analyst, Mental Health Services", "Harbourview Community Care", "Toronto, ON", "Adzuna", "Oct 9", "Oct 11", "high"),
    p("b6", "Clinical Data Analyst", "Lakeview Children's Centre", "Remote (Canada)", "Job Bank Canada", "Oct 8", "Oct 10", "high", undefined, { deadline: "Nov 2" }),
    p("b7", "Health Data Coordinator", "Ontario Cancer Registry Network", "Toronto, ON", "LinkedIn (link you pasted)", "Oct 7", "Oct 9", "high"),
    p("b8", "Quality and Performance Analyst", "Peel Valley Health", "Brampton, ON", "Job Bank Canada", "Oct 6", "Oct 8", "high"),
  ],
  today: {
    date: "Oct 15",
    total: 74,
    postings: [
      p("t1", "Health Data Analyst", "Maplewood Health Network", "Toronto, ON", "Job Bank Canada", "Oct 12", "Oct 15", "high", "Dashboards, SQL and clinical reporting: the core of your experience.", { deadline: "Oct 27", jobId: "maplewood-health-data-analyst" }),
      p("t2", "Research Analyst, Population Health", "Lakeshore Public Health Unit", "Mississauga, ON", "Job Bank Canada", "Oct 10", "Oct 15", "high", "Survey data and public reports, matching your MSc and cohort work.", { deadline: "Oct 24", jobId: "lakeshore-research-analyst" }),
      p("t3", "Data Analyst, Patient Experience", "Eastgate Regional Hospital", "Oshawa, ON", "Adzuna", "Oct 14", "Oct 15", "medium", "Good skills match; Oshawa is outside your cities, though it's two days a week on site."),
      p("t4", "Program Evaluation Analyst", "City of Toronto", "Toronto, ON", "Job Bank Canada", "Oct 14", "Oct 15", "medium", "Evaluation-heavy rather than data-heavy; SAS listed as required."),
      p("t5", "Biostatistician", "Clearwater CRO", "Montréal, QC", "Jooble", "Oct 13", "Oct 15", "medium", "Clinical trials focus and French for client meetings."),
      p("t6", "Health Policy Research Associate", "Institute for Care Studies", "Ottawa, ON", "Adzuna", "Oct 13", "Oct 15", "medium", "Strong topic match; Ottawa is not on your list."),
      p("t7", "Business Intelligence Analyst, Health", "Bluewater Insurance", "Toronto, ON", "Job Bank Canada", "Oct 12", "Oct 15", "medium", "Health claims data, but an insurance setting."),
      p("t8", "Senior Data Scientist", "Ridgeway Analytics", "Remote (Canada)", "Adzuna", "Oct 14", "Oct 15", "low", "Asks for 6+ years of production machine learning."),
      p("t9", "Marketing Data Analyst", "Northshore Retail Group", "Toronto, ON", "Job Bank Canada", "Oct 14", "Oct 15", "low", "Retail marketing, outside health."),
      p("t10", "Financial Reporting Analyst", "Keystone Credit Union", "Mississauga, ON", "Job Bank Canada", "Oct 13", "Oct 15", "low", "Finance, outside health."),
      p("t11", "Epidemiologist", "Prairie Health Region", "Regina, SK", "Jooble", "Oct 13", "Oct 15", "low", "Outside your cities and not remote."),
      p("t12", "Analyste de données en santé", "Centre intégré de santé", "Québec, QC", "Job Bank Canada", "Oct 12", "Oct 15", "low", "French required for the job itself."),
      p("t13", "Director, Decision Support", "Lakeland Health System", "Barrie, ON", "Adzuna", "Oct 12", "Oct 15", "low", "Director level, asks for 10+ years."),
      p("t14", "Data Engineer", "Granite Logistics", "Toronto, ON", "Job Bank Canada", "Oct 11", "Oct 15", "low", "Broad title match; logistics, not health."),
    ],
    log: [
      "All four sources answered normally; no fallback searches were needed.",
      "6 postings were repeats of ones you've already seen and were skipped quietly.",
      "Job Bank Canada returned no new epidemiologist postings in Ontario today. That's a real empty result, not an error.",
    ],
  },
  materials: [
    { kind: "CV", name: "CV · Maplewood Health Network · v2", forJob: "maplewood-health-data-analyst" },
    { kind: "Cover letter", name: "Cover letter · Maplewood Health Network", forJob: "maplewood-health-data-analyst" },
    { kind: "CV", name: "CV · Lakeshore Public Health Unit · v1", forJob: "lakeshore-research-analyst" },
    { kind: "Cover letter", name: "Cover letter · Lakeshore Public Health Unit", forJob: "lakeshore-research-analyst" },
    { kind: "CV", name: "CV · Northbridge Clinical Research · v1", forJob: "northbridge-junior-biostatistician" },
    { kind: "Cover letter", name: "Cover letter · Northbridge Clinical Research", forJob: "northbridge-junior-biostatistician" },
    { kind: "Company notes", name: "Riverbend General Hospital", forJob: "riverbend-qi-analyst" },
    { kind: "Company notes", name: "Maplewood Health Network", forJob: "maplewood-health-data-analyst" },
    { kind: "Company notes", name: "Lakeshore Public Health Unit", forJob: "lakeshore-research-analyst" },
  ],
};

// Results for successive "Do a new search" runs in the chat demo. Each run only contains postings not shown before.
export const searchRounds: SearchRound[] = [
  {
    date: "Monday, October 19",
    sources: [
      { name: "Job Bank Canada", count: 42 },
      { name: "Adzuna", count: 21 },
      { name: "Jooble", count: 9 },
      { name: "LinkedIn (links you pasted)", count: 2 },
    ],
    tiers: { high: 2, medium: 14, low: 58 },
    notice: "Jooble only partly answered today, so you may see a few fewer of its jobs than usual.",
    high: jobBoard.today.postings.filter((t) => t.fit === "high"),
    medium: jobBoard.today.postings.filter((t) => t.fit === "medium"),
  },
  {
    date: "Monday, October 19",
    sources: [
      { name: "Job Bank Canada", count: 31 },
      { name: "Adzuna", count: 17 },
      { name: "Jooble", count: 6 },
      { name: "LinkedIn (links you pasted)", count: 0 },
    ],
    tiers: { high: 0, medium: 10, low: 44 },
    high: [],
    medium: [
      p("q1", "Data Analyst, Patient Access", "Lakeview Regional Health", "Barrie, ON", "Job Bank Canada", "Oct 18", "Oct 19", "medium", "Strong skills match; Barrie is outside your cities."),
      p("q2", "Research Associate, Health Services", "Institute for Care Studies", "Toronto, ON", "Adzuna", "Oct 18", "Oct 19", "medium", "Good topic match; asks for SAS, which isn't in your CV."),
      p("q3", "Reporting Analyst", "Greenway Home Care", "Mississauga, ON", "Job Bank Canada", "Oct 18", "Oct 19", "medium", "Reporting fits; home care rather than hospital data."),
      p("q4", "Junior Epidemiologist", "Northern Shore Public Health", "Sudbury, ON", "Jooble", "Oct 17", "Oct 19", "medium", "Your MSc fits well; Sudbury is far from your cities."),
      p("q5", "Data Coordinator, Clinical Trials", "Bayview Research Centre", "Toronto, ON", "Adzuna", "Oct 17", "Oct 19", "medium", "Coordination-heavy, lighter on analysis than you'd like."),
      p("q6", "Health Information Analyst", "Credit Valley Health Partners", "Mississauga, ON", "Job Bank Canada", "Oct 17", "Oct 19", "medium", "Asks for a health information management certificate."),
      p("q7", "Quality Analyst", "Humber Ridge Hospital", "Toronto, ON", "Job Bank Canada", "Oct 16", "Oct 19", "medium", "Run charts and SPC are central; they're new to you."),
      p("q8", "Evaluation Analyst", "United Way Greater Toronto", "Toronto, ON", "Adzuna", "Oct 16", "Oct 19", "medium", "Program evaluation more than data analysis."),
      p("q9", "Biostatistics Intern (12 months)", "Clearwater CRO", "Remote (Canada)", "Jooble", "Oct 16", "Oct 19", "medium", "A step back in level, but a door into trials."),
      p("q10", "Population Health Analyst", "Eastgate Regional Health", "Oshawa, ON", "Job Bank Canada", "Oct 15", "Oct 19", "medium", "Very close to your work; Oshawa is outside your cities."),
    ],
  },
  {
    date: "Monday, October 19",
    sources: [
      { name: "Job Bank Canada", count: 7 },
      { name: "Adzuna", count: 3 },
      { name: "Jooble", count: 1 },
      { name: "LinkedIn (links you pasted)", count: 0 },
    ],
    tiers: { high: 0, medium: 0, low: 11 },
    high: [],
    medium: [],
  },
];
