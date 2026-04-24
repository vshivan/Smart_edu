// Subject → Topics mapping for the AI Course Generator
export const SUBJECT_CATALOG = {
  // ── Technology ──────────────────────────────────────────────────────────────
  'Web Development': [
    'HTML & CSS Fundamentals', 'JavaScript Basics', 'React.js', 'Vue.js', 'Angular',
    'Node.js & Express', 'REST API Design', 'GraphQL', 'TypeScript', 'Next.js',
    'Tailwind CSS', 'Database Integration', 'Authentication & JWT', 'Deployment & CI/CD',
  ],
  'Machine Learning': [
    'Python for ML', 'Linear Regression', 'Logistic Regression', 'Decision Trees',
    'Random Forests', 'Neural Networks', 'Deep Learning', 'Natural Language Processing',
    'Computer Vision', 'Model Evaluation', 'Feature Engineering', 'Scikit-learn',
    'TensorFlow', 'PyTorch', 'MLOps & Deployment',
  ],
  'Data Science': [
    'Python Basics', 'Pandas & NumPy', 'Data Cleaning', 'Exploratory Data Analysis',
    'Data Visualization', 'Statistical Analysis', 'SQL for Data Science',
    'Machine Learning Basics', 'Big Data with Spark', 'Tableau / Power BI',
    'A/B Testing', 'Time Series Analysis',
  ],
  'Cloud Computing': [
    'Cloud Fundamentals', 'AWS Core Services', 'Azure Fundamentals', 'Google Cloud Platform',
    'Docker & Containers', 'Kubernetes', 'Serverless Architecture', 'Cloud Security',
    'Infrastructure as Code', 'Monitoring & Logging', 'Cost Optimization',
  ],
  'Cybersecurity': [
    'Network Security Basics', 'Ethical Hacking', 'Penetration Testing', 'OWASP Top 10',
    'Cryptography', 'Firewalls & IDS', 'Incident Response', 'Security Auditing',
    'Social Engineering', 'Malware Analysis', 'Cloud Security', 'Compliance & GDPR',
  ],
  'Mobile Development': [
    'React Native', 'Flutter & Dart', 'iOS with Swift', 'Android with Kotlin',
    'App Architecture', 'State Management', 'Push Notifications', 'App Store Deployment',
    'Mobile UI/UX', 'Offline Storage', 'API Integration',
  ],
  'DevOps': [
    'Linux Fundamentals', 'Git & Version Control', 'CI/CD Pipelines', 'Docker',
    'Kubernetes', 'Ansible', 'Terraform', 'Jenkins', 'Monitoring with Prometheus',
    'Log Management', 'Site Reliability Engineering',
  ],
  'Database Management': [
    'SQL Fundamentals', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
    'Database Design & Normalization', 'Indexing & Performance', 'Transactions & ACID',
    'Replication & Sharding', 'Data Warehousing', 'NoSQL vs SQL',
  ],
  'Artificial Intelligence': [
    'AI Fundamentals', 'Search Algorithms', 'Knowledge Representation', 'Expert Systems',
    'Reinforcement Learning', 'Generative AI', 'Prompt Engineering', 'LLMs & GPT',
    'AI Ethics', 'Computer Vision', 'Speech Recognition', 'Robotics',
  ],
  'Blockchain': [
    'Blockchain Fundamentals', 'Bitcoin & Cryptocurrency', 'Ethereum', 'Smart Contracts',
    'Solidity Programming', 'DeFi', 'NFTs', 'Web3 Development', 'Consensus Mechanisms',
    'Crypto Wallets', 'Blockchain Security',
  ],

  // ── Business & Management ────────────────────────────────────────────────────
  'Project Management': [
    'Project Planning', 'Agile & Scrum', 'Kanban', 'Risk Management', 'Stakeholder Management',
    'Budgeting & Cost Control', 'Resource Allocation', 'PMP Certification Prep',
    'PRINCE2', 'Project Scheduling', 'Change Management',
  ],
  'Business Analytics': [
    'Business Intelligence', 'KPI Design', 'Excel for Analytics', 'Power BI', 'Tableau',
    'Financial Modeling', 'Market Research', 'Competitive Analysis', 'Forecasting',
    'Dashboard Design', 'Data-Driven Decision Making',
  ],
  'Entrepreneurship': [
    'Idea Validation', 'Business Model Canvas', 'Lean Startup', 'Fundraising & Pitching',
    'Product-Market Fit', 'Go-to-Market Strategy', 'Building a Team', 'Legal Basics',
    'Financial Planning', 'Scaling a Business', 'Exit Strategies',
  ],
  'Digital Marketing': [
    'SEO Fundamentals', 'Google Ads', 'Social Media Marketing', 'Content Marketing',
    'Email Marketing', 'Conversion Rate Optimization', 'Analytics & Tracking',
    'Influencer Marketing', 'Affiliate Marketing', 'Brand Strategy', 'Marketing Funnels',
  ],
  'Finance & Accounting': [
    'Financial Statements', 'Bookkeeping Basics', 'Budgeting', 'Cash Flow Management',
    'Investment Basics', 'Stock Market', 'Taxation', 'Financial Ratios',
    'Corporate Finance', 'Risk & Return', 'Cryptocurrency Investing',
  ],
  'Human Resources': [
    'Recruitment & Hiring', 'Onboarding', 'Performance Management', 'Employee Engagement',
    'Compensation & Benefits', 'Labor Law', 'HR Analytics', 'Learning & Development',
    'Diversity & Inclusion', 'Conflict Resolution', 'HR Information Systems',
  ],

  // ── Design & Creative ────────────────────────────────────────────────────────
  'UI/UX Design': [
    'Design Thinking', 'User Research', 'Wireframing', 'Prototyping', 'Figma',
    'Adobe XD', 'Usability Testing', 'Accessibility', 'Design Systems',
    'Interaction Design', 'Visual Hierarchy', 'Mobile-First Design',
  ],
  'Graphic Design': [
    'Design Principles', 'Typography', 'Color Theory', 'Adobe Photoshop',
    'Adobe Illustrator', 'InDesign', 'Logo Design', 'Brand Identity',
    'Print Design', 'Motion Graphics', 'Canva',
  ],
  'Video Production': [
    'Storyboarding', 'Camera Techniques', 'Lighting Setup', 'Audio Recording',
    'Adobe Premiere Pro', 'Final Cut Pro', 'Color Grading', 'Motion Graphics',
    'YouTube Strategy', 'Podcast Production',
  ],

  // ── Science & Engineering ────────────────────────────────────────────────────
  'Mathematics': [
    'Algebra', 'Calculus', 'Linear Algebra', 'Statistics & Probability',
    'Discrete Mathematics', 'Number Theory', 'Differential Equations',
    'Numerical Methods', 'Mathematical Proofs', 'Optimization',
  ],
  'Physics': [
    'Classical Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics',
    'Quantum Mechanics', 'Relativity', 'Nuclear Physics', 'Astrophysics',
    'Fluid Dynamics', 'Solid State Physics',
  ],
  'Electronics & Embedded Systems': [
    'Circuit Fundamentals', 'Ohm\'s Law & Kirchhoff', 'Digital Logic', 'Microcontrollers',
    'Arduino', 'Raspberry Pi', 'FPGA', 'PCB Design', 'IoT Basics',
    'Sensors & Actuators', 'Communication Protocols',
  ],

  // ── Language & Communication ─────────────────────────────────────────────────
  'English Language': [
    'Grammar Fundamentals', 'Business Writing', 'Academic Writing', 'Public Speaking',
    'IELTS Preparation', 'TOEFL Preparation', 'Vocabulary Building',
    'Reading Comprehension', 'Listening Skills', 'Pronunciation',
  ],
  'Communication Skills': [
    'Verbal Communication', 'Non-Verbal Communication', 'Active Listening',
    'Presentation Skills', 'Negotiation', 'Conflict Resolution',
    'Emotional Intelligence', 'Cross-Cultural Communication', 'Report Writing',
  ],

  // ── Personal Development ─────────────────────────────────────────────────────
  'Leadership': [
    'Leadership Styles', 'Team Building', 'Decision Making', 'Strategic Thinking',
    'Coaching & Mentoring', 'Change Leadership', 'Emotional Intelligence',
    'Delegation', 'Crisis Management', 'Executive Presence',
  ],
  'Productivity': [
    'Time Management', 'Goal Setting', 'Deep Work', 'GTD Method',
    'Habit Formation', 'Focus & Concentration', 'Note-Taking Systems',
    'Work-Life Balance', 'Stress Management', 'Digital Minimalism',
  ],
};

// Flat list of all subjects for the dropdown
export const SUBJECTS = Object.keys(SUBJECT_CATALOG).sort();

// Get topics for a given subject
export const getTopics = (subject) => SUBJECT_CATALOG[subject] || [];
