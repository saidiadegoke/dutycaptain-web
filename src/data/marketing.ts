export interface NavLink {
  to: string;
  label: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  children: NavLink[];
}

export type NavItem = NavLink | NavGroup;

export const isNavGroup = (item: NavItem): item is NavGroup => 'children' in item;

export const marketingNav: NavItem[] = [
{
  label: 'Product',
  children: [
  { to: '/platform', label: 'How it works', description: 'Plans, routes, checks and memory' },
  { to: '/use-cases', label: 'Use cases', description: 'What people hand over first' },
  { to: '/deployment', label: 'Where it runs', description: 'Cloud, your computer, and the roadmap' },
  { to: '/security', label: 'Trust & control', description: 'Approvals, permissions and records' }]

},
{ to: '/developers', label: 'Developers' },
{ to: '/pricing', label: 'Pricing' },
{
  label: 'Company',
  children: [
  { to: '/company', label: 'About us', description: 'Why DutyCaptain exists' },
  { to: '/company#contact', label: 'Join early access', description: 'Tell us your first task' },
  { to: '/deployment#roadmap', label: 'Roadmap', description: 'What is available and what is coming' },
  { to: '/privacy', label: 'Privacy policy' },
  { to: '/terms', label: 'Terms of use' }]

}];


export const heroStats = [
{ value: '4 routes', label: 'to reach any system, simplest first' },
{ value: 'Every change', label: 'checked after it is made' },
{ value: '0 passwords', label: 'ever shown to the AI' },
{ value: '1 click', label: 'to approve, pause or stop' }];


/**
 * The four ways DutyCaptain reaches a system, in the order it tries them.
 * The order is the product: the simplest reliable route is always first.
 */
export const routes = [
{
  id: 'built-in',
  name: 'Built-in tools',
  level: 'Route 1 · tried first',
  summary:
  'Spreadsheets, PDFs, data analysis and file handling done directly, with no website or application in between. The fastest route, and the easiest to check.'
},
{
  id: 'services',
  name: 'Connected services',
  level: 'Route 2',
  summary:
  'Where a service offers its own connection — email, online stores, payments, messaging — DutyCaptain uses it. Your passwords stay in a secure store and are never shown to the AI.'
},
{
  id: 'websites',
  name: 'Websites',
  level: 'Route 3',
  summary:
  'Where there is no connection, a browser in the cloud uses the website as a person would. It reads the page’s own description of its buttons and fields, so a redesign does not break it.'
},
{
  id: 'computer',
  name: 'Your computer',
  level: 'Route 4 · last resort',
  summary:
  'For files, documents and desktop applications only your computer can reach, the companion program acts within the folders and applications you permit — asking an application for its buttons by name before ever looking at your screen.'
}];


export const runSequence = [
{
  title: 'One instruction',
  body: '“Pull last month’s orders from our store, build the sales workbook, and send it to our accountant.”'
},
{
  title: 'A plan you can see',
  body: 'Five steps, two of them side by side, one approval before anything leaves the company. The plan is shown before it runs.'
},
{
  title: 'Each step, the best route',
  body: 'Orders come through the store’s own connection, the analysis runs in the cloud, and every result is checked before the next step starts.'
},
{
  title: 'You approve the send',
  body: 'The email waits with its recipient and attachment. Approve once, for this task, or always — and the task finishes on its own.'
}];


export const comparison = {
  columns: ['DutyCaptain', 'Automation tools', 'Chat assistants'],
  rows: [
  { feature: 'Does the work, not just the advice', values: ['Plans, acts and reports', 'Only what was built in advance', 'Explains the steps'] },
  { feature: 'A new task without building anything', values: ['Describe it in a sentence', 'Design a new workflow', 'Yes, but you do the work'] },
  { feature: 'Checks that each step worked', values: ['After every change', 'Rarely', 'No'] },
  { feature: 'Stops for your approval', values: ['Rules you control', 'All or nothing', 'Not applicable'] },
  { feature: 'Reaches files and apps on your computer', values: ['With permission you grant', 'Separate desktop product', 'No'] },
  { feature: 'A record of every action', values: ['Full history per task', 'Run logs', 'Chat history'] }]

};

export const useCases = [
{
  id: 'sales-report',
  name: 'Monthly sales report',
  industry: 'Small business & retail',
  problem:
  'Every month someone exports orders from the online store, rebuilds the same workbook by hand, and emails it to the accountant.',
  approach:
  'DutyCaptain fetches the orders through the store’s own connection, analyses them, builds and checks the workbook, and waits for one approval before emailing it. Scheduled, it runs on the first of each month without being asked.',
  metrics: [
  { value: '5 steps', label: 'planned from one sentence' },
  { value: '1', label: 'approval: the email' },
  { value: 'Monthly', label: 'on a schedule' }],

  featured: true
},
{
  id: 'invoices',
  name: 'Invoices on your own computer',
  industry: 'Finance & administration',
  problem: 'Supplier invoices sit as PDFs and scans in a Documents folder, and totals are re-keyed into a spreadsheet by hand.',
  approach:
  'The companion program searches only the folder you permit, reads each invoice on your computer, and returns the figures rather than the documents. The totals are checked against what was read.',
  metrics: [
  { value: '1 folder', label: 'permitted, nothing else' },
  { value: 'Figures', label: 'leave your computer, not files' }]

},
{
  id: 'prices',
  name: 'Competitor price checks',
  industry: 'Retail & e-commerce',
  problem: 'Competitors’ prices are checked by opening their websites one product at a time.',
  approach:
  'A cloud browser visits each page and reads prices from the page’s structure rather than its appearance. Large movements are flagged for review before anything in your store changes.',
  metrics: [
  { value: 'No API', label: 'needed from competitors' },
  { value: 'Flagged', label: 'outliers before any update' }]

},
{
  id: 'desktop',
  name: 'Work inside desktop applications',
  industry: 'Operations',
  problem: 'Some work lives in software with no website and no connection — an accounting package, a desktop spreadsheet, an older internal tool.',
  approach:
  'On your computer, DutyCaptain asks the application for its buttons and fields by name and presses them directly, then reads back the result. It works even when the window is not in front of you.',
  metrics: [
  { value: 'By name', label: 'not by screen position' },
  { value: 'Read back', label: 'after every action' }]

},
{
  id: 'portals',
  name: 'Portals that need your machine',
  industry: 'Regulated & government filings',
  problem: 'Some portals only work from a computer with a particular certificate installed, or from inside the office network.',
  approach:
  'DutyCaptain notices the portal needs your computer, pauses the task, and resumes it from the same step once your computer is available — rather than failing.',
  metrics: [
  { value: 'Paused', label: 'not failed, when offline' },
  { value: 'Same step', label: 'resumed automatically' }]

}];


/** The jobs models do inside a task, and how the choice is made. */
export const modelRoles = [
{ responsibility: 'Planning and correcting course', choice: 'The strongest available model', why: 'Few calls, where judgement matters most' },
{ responsibility: 'Reading and sorting information', choice: 'A fast, economical model', why: 'Many calls, where cost adds up' },
{ responsibility: 'Reading pages, scans and screens', choice: 'A model that can see', why: 'Only when text alone is not enough' },
{ responsibility: 'Your own model', choice: 'Your key, or a model you host', why: 'For accounts with their own agreements' }];


export const modelProviders = ['Claude', 'GPT', 'Gemini', 'DeepSeek', 'Self-hosted'];

export type ReleaseStatus = 'Available' | 'Rolling out' | 'Coming next' | 'Planned';

export const deploymentOptions: {name: string;status: ReleaseStatus;note: string;}[] = [
{ name: 'DutyCaptain Cloud', status: 'Available', note: 'Nothing to install. Tasks run in isolated cloud workspaces.' },
{ name: 'Companion program', status: 'Available', note: 'Mac first; Windows and Linux follow.' },
{ name: 'Bring your own model', status: 'Coming next', note: 'Use your own AI provider account, per step or for everything.' },
{ name: 'Keep files on your device', status: 'Planned', note: 'Results stay on your computer rather than in cloud storage.' },
{ name: 'Private deployment', status: 'Planned', note: 'Workers, and optionally models, inside your own infrastructure.' }];


export const roadmap: {status: ReleaseStatus;title: string;items: string[];}[] = [
{
  status: 'Available',
  title: 'The core of the product',
  items: [
  'Plain-language tasks, planned into steps you can see',
  'Built-in tools for spreadsheets, PDFs and data analysis',
  'Every change checked; budgets on time and spend',
  'Approval rules, scoped permissions and a full task history',
  'Cloud browser for websites without a connection',
  'Companion program for your files and documents']

},
{
  status: 'Rolling out',
  title: 'Working inside desktop applications',
  items: [
  'Pressing buttons and filling fields in applications by name',
  'Reading the screen only when an application offers nothing else',
  'A live view of the work, with Pause and Take control']

},
{
  status: 'Coming next',
  title: 'Connections and routine',
  items: [
  'Connected accounts: Gmail, Shopify, Stripe, Slack and more',
  'Scheduled tasks that run on their own',
  'Account memory you can see and delete',
  'A command-line tool for developers',
  'Bring your own AI model',
  'Companion program for Windows and Linux']

},
{
  status: 'Planned',
  title: 'Teams and larger organisations',
  items: [
  'Team accounts, roles and named approvers',
  'Single sign-on',
  'Private deployment and keeping files on your device',
  'Custom retention and full history export']

}];


export const plans = [
{
  id: 'starter',
  name: 'Starter',
  price: 'Early access',
  detail: 'For one person',
  forWho: 'Professionals handing over their own routine work.',
  includes: [
  'Plain-language tasks with a visible plan',
  'Built-in tools, websites and connected services',
  'The companion program for one computer',
  'Approvals, permissions and task history',
  'Spending limits on every task'],

  cta: 'Join early access',
  featured: false
},
{
  id: 'team',
  name: 'Team',
  price: 'Early access',
  detail: 'For small teams',
  forWho: 'Teams that share routine work and want one record of it.',
  includes: [
  'Everything in Starter',
  'Several people and several computers',
  'Scheduled tasks and connected accounts',
  'Named approvers and shared approval rules',
  'Priority support while we onboard you'],

  cta: 'Talk to us',
  featured: true
},
{
  id: 'enterprise',
  name: 'Enterprise',
  price: 'Custom',
  detail: 'For operations at scale',
  forWho: 'Organisations with their own security review and compliance needs.',
  includes: [
  'Roles, single sign-on and custom retention',
  'Bring your own AI model',
  'Private deployment options',
  'Full history export for your own review',
  'A named engineer'],

  cta: 'Contact sales',
  featured: false
}];


export const pricingFaq = [
{
  q: 'When will prices be published?',
  a: 'Before general availability. Early-access members hear first, and nobody is moved onto a paid plan without being told what it costs.'
},
{
  q: 'Will I know what a task costs before it runs away?',
  a: 'Yes. Every task shows its cost as it runs, and you can give each task a limit on spend, time and number of steps. A task that reaches its limit pauses and asks you, rather than carrying on.'
},
{
  q: 'Do I have to install anything?',
  a: 'No. Most tasks run entirely in the cloud. The companion program is only needed for tasks that involve files or applications on your own computer.'
},
{
  q: 'What happens when a task fails halfway?',
  a: 'Each step is checked as it finishes. A failed step is retried, tried another way, or the plan is corrected — and if none of that works, the task stops and tells you what it needs. Completed steps are never repeated.'
}];


export const principles = [
{
  title: 'The simplest reliable route, every time',
  body: 'A service’s own connection is faster, cheaper and easier to check than a website, and a website is better than operating a screen. DutyCaptain always tries the simplest route first.'
},
{
  title: 'Checked, not assumed',
  body: 'Every change is followed by a check that it had the intended effect. Where nothing can be checked, DutyCaptain says so rather than reporting success.'
},
{
  title: 'Rules outside the AI',
  body: 'What needs your approval is decided by rules you control, not by the AI’s judgement in the moment. The AI proposes; the rules decide.'
},
{
  title: 'Honest about what it cannot do',
  body: 'When a task cannot be finished, DutyCaptain explains why and what would let it continue — a permission, a connection, or your computer coming back online.'
}];
