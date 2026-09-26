import type { LegalSection } from '@/components/marketing/LegalPage';
import { CONTACT_EMAIL } from '@/lib/seo';

/**
 * The facts both policies depend on, in one place.
 *
 * DRAFTS. These pages were written from how the product is designed and built,
 * and have not been reviewed by a lawyer. `governingLaw` in particular is a
 * placeholder: it must name a real jurisdiction before the site is public.
 */
export const LEGAL = {
  company: 'HelloWorld Technologies',
  product: 'DutyCaptain',
  contactEmail: CONTACT_EMAIL,
  effective: '25 September 2026',
  governingLaw: 'the laws of the Federal Republic of Nigeria'
};

const { company, contactEmail, governingLaw } = LEGAL;

export const privacySections: LegalSection[] = [
{
  id: 'who-we-are',
  heading: 'Who we are',
  body: [
  `DutyCaptain is a service that carries out tasks on your behalf. It is provided by ${company} (“we”, “us”). This policy explains what information we collect when you use DutyCaptain or its website, why we collect it, and the choices you have.`,
  `If you have a question about this policy or your information, write to ${contactEmail}.`]

},
{
  id: 'what-we-collect',
  heading: 'Information we collect',
  body: ['We collect only what is needed to provide the service and keep it secure.'],
  points: [
  'Account details: your name, email address and sign-in information.',
  'Early-access requests: your name, email address, company and the task you describe, when you send the form on our website.',
  'Tasks: the instructions you give, files you upload, and the results DutyCaptain produces.',
  'Connected services: information from services you choose to connect, such as an email account or an online store, limited to what a task needs.',
  'Your computer: if you install the companion program, the information a task reads from the folders and applications you have permitted. Searching and reading happen on your computer, and what is sent back is the result a task needs — figures or passages, not whole folders.',
  'Pictures of your screen: only if you have granted screen access and approved it for that task. A picture is used to find what the task is looking for and is not kept afterwards.',
  'Records of activity: the steps each task took, how they were checked, what they cost and who approved them.',
  'Technical information: your IP address, browser type and request logs, used for security, preventing abuse and fixing problems.']

},
{
  id: 'how-we-use',
  heading: 'How we use information',
  points: [
  'To carry out the tasks you ask for, and to show you their progress and history.',
  'To ask for your approval before consequential actions, and to record your decisions.',
  'To keep the service secure, including limiting abuse and investigating problems.',
  'To reply to early-access requests and support questions.',
  'To improve the reliability of the service, using records of how tasks were carried out.'],

  after: [
  'We do not sell your information, and we do not use it for advertising.']

},
{
  id: 'ai-providers',
  heading: 'AI model providers',
  body: [
  'To plan and carry out a task, DutyCaptain sends the information each step needs to an AI model provider. Depending on the step and your settings, this may be a provider such as Anthropic, OpenAI, Google or DeepSeek, or a model you supply yourself.',
  'We send only what a step requires. Passwords and credentials for your connected services are never sent to an AI model. Content that a task reads from web pages, documents or emails is treated as information, never as instructions.']

},
{
  id: 'sharing',
  heading: 'When we share information',
  points: [
  'With service providers who help us run DutyCaptain — hosting, storage, email delivery and AI model providers — under agreements that limit their use of it.',
  'With services you connect or instruct a task to use, such as sending an email you have approved.',
  'When required by law, or to protect the rights, safety or security of our users, the public or ourselves.',
  'As part of a merger, acquisition or sale of assets, in which case this policy continues to apply to your information.']

},
{
  id: 'retention',
  heading: 'How long we keep information',
  points: [
  'Files a task produces are kept for 30 days by default, unless your account settings say otherwise.',
  'Task history and approval records are kept while your account is open, so you can review what was done on your behalf.',
  'Pictures of your screen are not kept after the step that needed them.',
  'Early-access requests are kept until we have responded and for a reasonable period afterwards, or until you ask us to delete them.',
  'Technical logs are kept for a limited period for security and troubleshooting.'],

  after: ['When you close your account, we delete or anonymise your information, except where the law requires us to keep it.']

},
{
  id: 'security',
  heading: 'How we protect information',
  points: [
  'The companion program connects out to us; it opens no ports on your computer.',
  'Access to your computer is limited to the folders and applications you name, and each instruction is checked both by us and again on your computer.',
  'Credentials for connected services are stored securely and used only at the moment of an action.',
  'Work in the cloud runs in isolated workspaces that are discarded after each task.',
  'Consequential actions require your approval, and every action is recorded.'],

  after: ['No system is perfectly secure. If we become aware of a breach affecting your information, we will tell you without undue delay.']

},
{
  id: 'your-rights',
  heading: 'Your choices and rights',
  body: ['Depending on where you live, you may have the right to:'],
  points: [
  'see the information we hold about you, and receive a copy of it;',
  'correct information that is wrong;',
  'ask us to delete your information;',
  'object to, or ask us to limit, how we use it;',
  'withdraw a permission you gave, such as access to a folder or your screen, at any time.'],

  after: [
  `You can remove permissions and saved memory from your account settings, and pause or remove the companion program at any time. For anything else, write to ${contactEmail}. We will respond within the time the law requires.`]

},
{
  id: 'transfers',
  heading: 'International transfers',
  body: [
  'Our service providers, including AI model providers, may process information in countries other than your own. Where they do, we take steps to ensure your information is protected to the standard this policy describes.']

},
{
  id: 'children',
  heading: 'Children',
  body: ['DutyCaptain is not intended for anyone under 18, and we do not knowingly collect information from children.']
},
{
  id: 'changes',
  heading: 'Changes to this policy',
  body: [
  'We will update this policy as DutyCaptain changes. If a change is significant, we will tell you by email or in the product before it takes effect. The date at the top shows when it last changed.']

}];


export const termsSections: LegalSection[] = [
{
  id: 'agreement',
  heading: 'Agreement',
  body: [
  `These terms govern your use of DutyCaptain and its website, provided by ${company} (“we”, “us”). By creating an account or using the service, you agree to them. If you use DutyCaptain on behalf of an organisation, you confirm that you are authorised to accept these terms for it.`]

},
{
  id: 'early-access',
  heading: 'Early access',
  body: [
  'DutyCaptain is currently offered as early access. Features may change, be added or be withdrawn, and the service may occasionally be unavailable. We will tell you about significant changes, but we do not yet offer a guaranteed level of availability.']

},
{
  id: 'account',
  heading: 'Your account',
  body: [
  'You are responsible for keeping your sign-in details secure and for activity under your account. Tell us promptly if you believe your account has been used without your permission. You must be at least 18 to use DutyCaptain.']

},
{
  id: 'acting-for-you',
  heading: 'DutyCaptain acts on your instructions',
  body: [
  'DutyCaptain carries out tasks you describe, using the services, websites and computers you give it access to. You remain responsible for the tasks you ask it to perform and for the actions you approve.'],

  points: [
  'Review approval requests before accepting them. An approved action, such as sending a message or making a payment, may not be reversible.',
  'Grant only the access a task needs, and withdraw access you no longer want DutyCaptain to have.',
  'Check important results before relying on them. DutyCaptain checks its work where it can and tells you when a step could not be checked, but it can make mistakes.']

},
{
  id: 'acceptable-use',
  heading: 'Acceptable use',
  body: ['You agree not to use DutyCaptain to:'],
  points: [
  'break the law, or infringe anyone else’s rights;',
  'access systems, accounts or information you are not authorised to access;',
  'send spam, or harass, defraud or deceive anyone;',
  'breach the terms of a website or service you instruct DutyCaptain to use;',
  'interfere with the service, test its security without our written permission, or try to get around its limits or approval rules;',
  'build a competing product using the service.'],

  after: ['We may pause a task or suspend an account that we reasonably believe breaks these rules.']

},
{
  id: 'your-content',
  heading: 'Your content',
  body: [
  'You keep ownership of the instructions, files and information you provide and the results DutyCaptain produces for you. You give us permission to use them only as needed to provide, secure and support the service, as described in our privacy policy.']

},
{
  id: 'companion',
  heading: 'The companion program',
  body: [
  'If you install the companion program, we grant you a personal, non-transferable licence to use it with DutyCaptain. It acts only within the permissions you grant, and you can pause it, change its permissions or remove it at any time. Updates may be installed to keep it secure and compatible.']

},
{
  id: 'third-parties',
  heading: 'Other services',
  body: [
  'Tasks may use services provided by others, including AI model providers and services you connect. Your use of those services is also governed by their own terms. We are not responsible for services we do not control.']

},
{
  id: 'fees',
  heading: 'Fees',
  body: [
  'During early access, any fees are as agreed with you in writing. Before we introduce or change paid plans, we will publish the prices and tell you in advance. You will not be charged for a paid plan without having agreed to it.']

},
{
  id: 'our-property',
  heading: 'Our property and feedback',
  body: [
  'DutyCaptain, its software and its website belong to us and our licensors. These terms do not give you any rights to them beyond using the service as described. If you send us feedback, we may use it without obligation to you.']

},
{
  id: 'disclaimers',
  heading: 'Disclaimers',
  body: [
  'The service is provided “as is” and “as available”. To the extent the law allows, we make no promises that it will be uninterrupted or error-free, or that results will be accurate or complete. Nothing in these terms limits rights you have under consumer law that cannot be limited.']

},
{
  id: 'liability',
  heading: 'Limitation of liability',
  body: [
  'To the extent the law allows, we are not liable for indirect or consequential losses, or for loss of profits, revenue or data. Our total liability to you for any claim relating to the service is limited to the greater of the amount you paid us in the twelve months before the claim and one hundred US dollars.',
  'We do not exclude liability that cannot be excluded by law, such as for fraud.']

},
{
  id: 'ending',
  heading: 'Ending these terms',
  body: [
  'You may stop using DutyCaptain and close your account at any time. We may suspend or end your access if you break these terms, or with reasonable notice if we stop offering the service. On closure, your information is handled as described in our privacy policy.']

},
{
  id: 'changes',
  heading: 'Changes to these terms',
  body: [
  'We may update these terms. If a change is significant, we will tell you before it takes effect. Continuing to use DutyCaptain after that means you accept the updated terms.']

},
{
  id: 'law',
  heading: 'Governing law',
  body: [`These terms are governed by ${governingLaw}.`]
},
{
  id: 'contact',
  heading: 'Contact',
  body: [`Questions about these terms can be sent to ${contactEmail}.`]
}];
