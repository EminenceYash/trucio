import { IntelAlert } from '../types/legitcheck';

export const INTEL_ALERTS: IntelAlert[] = [
  {
    id: 'alert-in-digital-arrest',
    title: 'Coercive "Digital Arrest" Video Calls Impersonating Enforcement Officers',
    category: 'Impersonation & Digital Arrest',
    region: 'India',
    verificationStatus: 'official',
    source: 'I4C / Ministry of Home Affairs Public Advisory (Synthetic Summary)',
    publishedAt: '2026-11-12',
    summary:
      'Callers posing as courier staff, customs, or cyber police claim a parcel with illegal items is linked to your Aadhaar and demand immediate video-call isolation plus a "verification transfer."',
    indicators: [
      'Claims of an active arrest warrant or "digital arrest" over WhatsApp or Skype video',
      'Fake police station backdrops or badges shown on screen',
      'Pressure to stay on call continuously and transfer funds to a "RBI/escrow clearance account"',
    ],
    explanation:
      'Indian law enforcement agencies do not conduct arrests, record statements, or verify bank balances over consumer video calls, nor do they ask citizens to transfer money to clear an investigation.',
    protectionTip:
      'Disconnect immediately, do not share OTPs or Aadhaar copies, and verify independently by dialling 1930 or visiting your nearest police station.',
  },
  {
    id: 'alert-in-rto-apk',
    title: 'Malicious ".apk" Files Disguised as Traffic Challan & Bank KYC Updates',
    category: 'Malicious APK',
    region: 'India',
    verificationStatus: 'corroborated',
    source: 'Banking CERT & Community Pattern Synthesis',
    publishedAt: '2026-11-10',
    summary:
      'WhatsApp messages send an attachment named "eChallan_Receipt.apk" or "SBI_KYC_Update.apk" urging users to install an app outside the Google Play Store.',
    indicators: [
      'File extension ends in .apk delivered inside WhatsApp or Telegram',
      'App requests SMS read, Accessibility, and Notification listener permissions',
      'Sender uses an ordinary personal mobile number with a borrowed bank logo',
    ],
    explanation:
      'Once installed, rogue APKs intercept incoming bank OTP SMS messages and forward them silently to attackers while displaying a fake loading screen.',
    protectionTip:
      'Never install .apk files received in chat apps. Check traffic challans only on official parivahan.gov.in portals.',
  },
  {
    id: 'alert-in-upi-collect',
    title: 'QR Code & UPI Collect Requests Framed as "Refund" or Marketplace Payment',
    category: 'UPI & Banking',
    region: 'India',
    verificationStatus: 'official',
    source: 'NPCI Safe Payments Guidance (Synthetic Summary)',
    publishedAt: '2026-11-08',
    summary:
      'Buyers on classifieds marketplaces send a QR code or UPI collect request claiming you must scan and enter your UPI PIN to receive an advance payment.',
    indicators: [
      'Instruction to scan a QR code or approve a pending collect request to receive money',
      'Claim that entering your UPI PIN is required for "merchant verification"',
      'Urgency to complete the step before a courier arrives',
    ],
    explanation:
      'Your UPI PIN is strictly for authorizing money leaving your account. Receiving funds on UPI never requires scanning a QR code or entering a PIN.',
    protectionTip:
      'Decline any collect request you did not initiate as a payer, and never enter your UPI PIN to claim a refund or prize.',
  },
  {
    id: 'alert-apac-task-scam',
    title: 'Telegram & WhatsApp Prepaid "Hotel Review / E-Commerce Task" Escalation',
    category: 'Job & Task Scams',
    region: 'APAC',
    verificationStatus: 'corroborated',
    source: 'APAC Regional Anti-Scam Pattern Digest',
    publishedAt: '2026-11-05',
    summary:
      'Recruiters offer small payouts for liking videos or rating listings, then move victims into "prepaid merchant tasks" requiring escalating deposits to unlock trapped commissions.',
    indicators: [
      'Unsolicited WhatsApp or Telegram job outreach promising daily payouts for simple taps',
      'Early micro-payouts (e.g., INR 200–500 or SGD 15) used to build false confidence',
      'Dashboard showing frozen earnings until a larger "combo order" top-up is transferred',
    ],
    explanation:
      'Legitimate employers do not require workers to deposit personal funds into third-party accounts or crypto wallets to unlock earned wages.',
    protectionTip:
      'Stop transferring funds immediately once a "top-up to withdraw" condition appears. Preserve chat logs and bank UTRs.',
  },
  {
    id: 'alert-apac-parcel-phish',
    title: 'Lookalike Postal & Customs SMS Links Requesting Small Redelivery Fees',
    category: 'Courier & Customs',
    region: 'APAC',
    verificationStatus: 'official',
    source: 'APAC Postal & Telecom Scam Watch (Synthetic Summary)',
    publishedAt: '2026-11-02',
    summary:
      'SMS messages claim a parcel is held for an incomplete address or unpaid customs fee, linking to non-official lookalike domains asking for card details.',
    indicators: [
      'Shortened or misspelled domain (e.g., indiapost-track-fee.top, singpost-verify.vip)',
      'Small nominal fee (INR 25 or SGD 2.50) designed to lower suspicion while harvesting full card + CVV + OTP',
      'Missing tracking number matching any real order',
    ],
    explanation:
      'Attack pages capture card credentials and trigger high-value unauthorized card-not-present charges or digital wallet provisioning in the background.',
    protectionTip:
      'Open the official courier website or merchant app independently rather than tapping links inside an unexpected SMS.',
  },
  {
    id: 'alert-in-electricity-cut',
    title: 'Community Report: Late-Night "Electricity Disconnection Tonight" SMS',
    category: 'Phishing Links',
    region: 'India',
    verificationStatus: 'community-unverified',
    source: 'Community Pattern Submission (Redacted & Unverified)',
    publishedAt: '2026-10-29',
    summary:
      'Users report receiving evening SMS warnings stating power will be cut at 9:30 PM unless an updated bill is verified via a personal mobile number or remote-support app.',
    indicators: [
      'Artificial same-night disconnection deadline designed to create panic',
      'Asks recipient to call a 10-digit personal mobile number or install AnyDesk/TeamViewer',
      'No consumer account number or official utility sender header',
    ],
    explanation:
      'Unverified community reports describe callers instructing victims to install screen-sharing apps and log into netbanking to pay a Rs 10 "update fee," exposing full session control.',
    protectionTip:
      'Check your electricity bill directly inside your state DISCOM portal or official Bharat BillPay app.',
  },
];
