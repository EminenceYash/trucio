import { ScamCategory } from '../../types/legitcheck';

export type RuleFamily =
  | 'urgency'
  | 'threats'
  | 'upfront-payment'
  | 'credential-harvesting'
  | 'kyc-account-block'
  | 'recruitment-task'
  | 'investment-returns'
  | 'lottery-prize'
  | 'impersonation'
  | 'refund-recovery'
  | 'remote-access'
  | 'apk-malware'
  | 'payment-instruction'
  | 'shopping-delivery';

export interface SignalRule {
  id: string;
  family: RuleFamily;
  category: ScamCategory;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  weight: number;
  /** Matches against normalized/deobfuscated sentence text */
  patterns: RegExp[];
  /** If true, dampens/skips when local window shows standard bank safety advice ("never share OTP") */
  respectNegation?: boolean;
  /** If true, this signal only carries full weight when correlated with another risk signal (link/money/urgency/etc.) */
  contextDependent?: boolean;
  explanation: string;
  whyItMatters: string;
  relatedAlertIds?: string[];
  evidenceLabel?: string;
}

export const SCAM_CATEGORY_LABELS: Record<ScamCategory, string> = {
  'financial-fraud': 'Financial & Payment Fraud',
  phishing: 'Phishing & Credential Theft',
  'recruitment-scam': 'Recruitment & Task Scam',
  impersonation: 'Authority & Brand Impersonation',
  'investment-scam': 'Investment & Return Scam',
  'shopping-fraud': 'Shopping & Delivery Fraud',
  'social-engineering': 'Social Engineering & Manipulation',
  'legitimate-or-low-signal': 'Legitimate / Low Signal',
  other: 'Suspicious Activity',
};

export const SIGNAL_RULES: SignalRule[] = [
  // 1. Malicious APK & Side-loading
  {
    id: 'rule-apk-installer',
    family: 'apk-malware',
    category: 'phishing',
    title: 'Android .apk installer delivery or side-loading prompt',
    severity: 'critical',
    weight: 48,
    patterns: [
      /\.apk\b/i,
      /\b(?:install|download)\s+(?:this\s+|the\s+)?(?:app|file|update)?\s*(?:apk|from\s+unknown\s+sources)\b/i,
      /\ballow\s+(?:unknown\s+sources|install\s+unknown\s+apps)\b/i,
    ],
    respectNegation: true,
    explanation:
      'Banks, utilities, and government portals never distribute mandatory customer updates as raw .apk files over chat or SMS.',
    whyItMatters:
      'Side-loaded APKs frequently abuse accessibility and SMS permissions to silently intercept banking OTPs.',
    relatedAlertIds: ['alert-in-rto-apk'],
    evidenceLabel: 'Side-loaded APK Delivery',
  },

  // 2. Remote-access apps
  {
    id: 'rule-remote-access',
    family: 'remote-access',
    category: 'social-engineering',
    title: 'Remote-access or screen-sharing software instruction',
    severity: 'critical',
    weight: 44,
    patterns: [
      /\b(?:anydesk|teamviewer|quicksupport|rustdesk|ammyy|ultraviewer)\b/i,
      /\b(?:install|download|open)\s+(?:a\s+)?(?:screen[-\s]?shar(?:ing|e)|remote\s+(?:support|access|control))\s*(?:app|tool|link)?\b/i,
      /\bshare\s+(?:your\s+)?(?:screen|9[-\s]?digit\s+code)\b/i,
    ],
    respectNegation: true,
    explanation:
      'Attackers tell victims to install screen-sharing apps under the guise of KYC verification, bill fixes, or refund help.',
    whyItMatters:
      'Live screen access reveals your OTPs, PIN entries, and banking sessions directly to the caller.',
    relatedAlertIds: ['alert-in-electricity-cut'],
    evidenceLabel: 'Remote Screen-Sharing Coercion',
  },

  // 3. UPI Payment-Flow Reversal / Suspicious Payment Instructions
  {
    id: 'rule-upi-flow-reversal',
    family: 'payment-instruction',
    category: 'financial-fraud',
    title: 'UPI PIN or QR scan demanded to "receive" or "refund" money',
    severity: 'critical',
    weight: 48,
    patterns: [
      /(?:enter|type|input|put|daal\w*|bhar\w*)\s+(?:\w+\s+){0,3}(?:upi\s*)?pin\s+(?:\w+\s+){0,4}(?:receive|get|claim|credit|refund|cashback|paise\s+mil)/i,
      /(?:scan|open)\s+(?:\w+\s+){0,3}qr(?:\s*code)?\s+(?:\w+\s+){0,4}(?:receive|get|claim|credit|refund|advance|payment\s+to\s+you)/i,
      /\b(?:approve|accept)\s+(?:\w+\s+){0,3}collect\s+request\s+(?:\w+\s+){0,3}(?:receive|get|refund|credit)\b/i,
      /\bcollect\s+request\b.*\b(?:upi\s*pin|receive|refund|advance)\b/i,
      /\bcashback\s+approved\b.*\b(?:pin|scan|pay|click)\b/i,
    ],
    respectNegation: true,
    explanation:
      'Your UPI PIN and QR pay flows are strictly for sending money out—never for receiving refunds, cashback, or buyer advances.',
    whyItMatters:
      'Scammers disguise debit collect requests and QR payment prompts as incoming transfers.',
    relatedAlertIds: ['alert-in-upi-collect'],
    evidenceLabel: 'UPI Payment-Flow Reversal',
  },

  // 4. OTP, PIN & Password Requests (Context-aware with Negation Detection)
  {
    id: 'rule-credential-solicitation',
    family: 'credential-harvesting',
    category: 'phishing',
    title: 'Direct request to share OTP, PIN, CVV, or banking password',
    severity: 'critical',
    weight: 42,
    patterns: [
      /\b(?:share|tell|send|give|forward|provide|reply\s+with|verify\s+with|enter|batao|bataiye|bhejo|daalo)\s+(?:your\s+|me\s+|the\s+)?(?:4|6)?[-\s]?(?:digit\s+)?(?:otp|upi\s*pin|mpin|atm\s*pin|cvv|passcode|password|tpin)\b/i,
      /\b(?:otp|pin|cvv|password)\s+(?:batao|bataiye|bhejiye|send\s+karo|share\s+karo)\b/i,
    ],
    respectNegation: true,
    explanation:
      'The message directly solicits an OTP, PIN, CVV, or account password instead of warning you to keep it private.',
    whyItMatters:
      'No bank officer, courier driver, buyer, or helpline agent ever needs your OTP or PIN to verify or credit your account.',
    evidenceLabel: 'Credential Solicitation',
  },

  // 5. Law-Enforcement / Digital Arrest Threats & Intimidation
  {
    id: 'rule-digital-arrest-threat',
    family: 'threats',
    category: 'impersonation',
    title: 'Law-enforcement, customs seizure, or "Digital Arrest" coercion',
    severity: 'critical',
    weight: 46,
    patterns: [
      /\bdigital\s*arrest\b/i,
      /\b(?:cbi|enforcement\s+directorate|\bed\b|narcotics|ncb|trai|cyber\s*(?:crime|police))\b.*\b(?:warrant|case|parcel|aadhaar|laundering|arrest|verify|freeze|clearance)\b/i,
      /\b(?:customs|courier|fedex|dhl)\b.*\b(?:illegal|drugs|narcotics|passport|contraband|seized|aadhaar\s*linked)\b/i,
      /\b(?:stay\s+on\s+(?:skype|video\s*call|whatsapp\s*video)|do\s+not\s+disconnect|police\s+case\s+registered)\b/i,
      /\b(?:arrest\s+warrant|non[-\s]?bailable|legal\s+action\s+within)\b/i,
    ],
    respectNegation: true,
    explanation:
      'Indian and APAC police, customs, and courts never conduct interrogations over video calls or demand money transfers to clear investigations.',
    whyItMatters:
      'Impersonators manufacture panic and isolation ("stay on camera") so victims transfer savings to "verification accounts."',
    relatedAlertIds: ['alert-in-digital-arrest'],
    evidenceLabel: 'Authority & Fear Coercion',
  },

  // 6. KYC & Account-Blocking Phishing
  {
    id: 'rule-kyc-account-block',
    family: 'kyc-account-block',
    category: 'phishing',
    title: 'Account suspension, KYC expiry, or utility disconnection lure',
    severity: 'warning',
    weight: 28,
    patterns: [
      /\b(?:kyc|re-?kyc|pan\s*(?:card)?|aadhaar|sim|fastag)\b.*\b(?:expir\w*|suspend\w*|block\w*|deactivat\w*|updat\w*\s+(?:now|today|immediately|urgent|abhi))\b/i,
      /\b(?:account|khata|card|netbanking|wallet|upi|electricity|power|meter)\b.*\b(?:will\s+be\s+)?(?:blocked|suspended|frozen|closed|disconnected|band\s+ho)\b/i,
      /\b(?:challan|e-?challan|traffic\s+fine)\b.*\b(?:pending|pay|download|court)\b/i,
      /\bkyc\s+(?:abhi|turant)\s+update\b/i,
    ],
    respectNegation: true,
    explanation:
      'Fraudsters threaten imminent bank account blocking, SIM deactivation, or power cutoffs to force rushed taps on fake portals.',
    whyItMatters:
      'Legitimate banks and utilities let you check KYC or bill status directly inside their official app without urgent external links.',
    relatedAlertIds: ['alert-in-electricity-cut', 'alert-in-rto-apk'],
    evidenceLabel: 'Account-Block / KYC Pressure',
  },

  // 7. Fake Recruitment & Prepaid Task Scams
  {
    id: 'rule-recruitment-prepaid-task',
    family: 'recruitment-task',
    category: 'recruitment-scam',
    title: 'Prepaid task trap, registration fee, or unrealistic daily-pay job pitch',
    severity: 'critical',
    weight: 42,
    patterns: [
      /\b(?:prepaid\s*task|merchant\s*task|vip\s*task|combo\s*order|task\s*bonus|unlock\s*(?:commission|withdrawal|vip))\b/i,
      /\b(?:like|subscribe|review|rate\s+(?:hotels?|movies?|products?)|youtube\s+likes?)\b.*\b(?:earn|income|rs\.?|₹|\$|daily|per\s+task|telegram|whatsapp)\b/i,
      /\b(?:earn|make)\s+(?:₹|rs\.?|inr|sgd|\$)?\s*\d[\d,]*(?:\s*-\s*\d[\d,]*)?\s*(?:daily|per\s+day|weekly|per\s+hour)\b.*\b(?:part[-\s]?time|work\s+from\s+home|wfh|telegram|whatsapp|no\s+experience)\b/i,
      /\b(?:registration|security|laptop|training|verification|offer\s+letter|onboarding)\s+(?:fee|deposit|charge)\b/i,
      /\brefundable\s+(?:task|deposit|registration\s+fee)\b/i,
    ],
    respectNegation: true,
    explanation:
      'Legitimate employers never require candidates to pay registration fees or fund "prepaid tasks" to receive salary or commissions.',
    whyItMatters:
      'Task scams often pay small initial amounts before trapping victims into escalating deposits they cannot withdraw.',
    relatedAlertIds: ['alert-apac-task-scam'],
    evidenceLabel: 'Prepaid Job / Task Lure',
  },

  // 8. Investment & Guaranteed-Return Scams
  {
    id: 'rule-investment-guaranteed',
    family: 'investment-returns',
    category: 'investment-scam',
    title: 'Guaranteed high returns or "risk-free" trading/crypto pitch',
    severity: 'critical',
    weight: 40,
    patterns: [
      /\b(?:guaranteed|assured|fixed|100%)\s+(?:\w+\s+){0,2}(?:profit|return|returns|roi|income)\b/i,
      /\b(?:double\s+(?:your\s+)?money|paise\s+double|2x\s+in\s+\d+|10x\s+return|zero\s+risk|risk[-\s]?free\s+(?:trading|investment|crypto))\b/i,
      /\b(?:vip|institutional|block\s+deal)\s+(?:trading|ipo|crypto|signal)\s+(?:group|app|whatsapp|telegram)\b/i,
      /\b(?:sebi\s+registered\s+tip|upper\s+circuit\s+guaranteed)\b/i,
    ],
    respectNegation: true,
    explanation:
      'Regulated markets carry risk; promises of guaranteed profits, fixed daily ROI, or "VIP block-deal apps" are hallmarks of investment fraud.',
    whyItMatters:
      'Fraudulent trading apps show fabricated profit dashboards until you attempt to withdraw and are asked for "tax" or "unlock" fees.',
    evidenceLabel: 'Guaranteed-Return Claim',
  },

  // 9. Lottery, Prize & Giveaway Claims
  {
    id: 'rule-lottery-prize',
    family: 'lottery-prize',
    category: 'social-engineering',
    title: 'Unsolicited lottery, lucky draw, or prize-claim fee prompt',
    severity: 'warning',
    weight: 32,
    patterns: [
      /\b(?:won|winner|selected\s+for)\s+(?:a\s+)?(?:₹|rs\.?|inr|\$)?\s*[\d,]*\s*(?:lakh|crore)?\s*(?:lottery|lucky\s*draw|jackpot|kbc|prize|gift|iphone|car)\b/i,
      /\b(?:lottery|kbc|lucky\s*draw|bumper\s*prize|inaam)\b.*\b(?:claim|winner|won|jeete|processing\s+fee|tax|gst|contact)\b/i,
      /\bclaim\s+your\s+(?:free\s+)?(?:reward|gift|voucher|prize|bonus)\s+(?:now|before|within)\b/i,
    ],
    respectNegation: true,
    explanation:
      'Surprise prize notifications that require clicking external claim links or paying "tax/processing charges" are classic advance-fee scams.',
    whyItMatters:
      'Genuine promotions never demand an upfront fee or banking credentials to release winnings.',
    evidenceLabel: 'Prize / Lottery Lure',
  },

  // 10. Upfront Payment / Advance Fee Demands
  {
    id: 'rule-upfront-fee',
    family: 'upfront-payment',
    category: 'financial-fraud',
    title: 'Advance fee, customs charge, or "unlock" deposit requested',
    severity: 'warning',
    weight: 30,
    patterns: [
      /\b(?:pay|transfer|send|deposit|remit)\s+(?:a\s+)?(?:small\s+)?(?:(?:₹|rs\.?|inr|sgd|rm|\$)\s*[\d,]+\s*)?(?:clearance|customs|redelivery|re-?delivery|processing|unlock|verification|handling|courier|gst|tax)\s+(?:fee|charge|duty|deposit|processing\s+fee)\b/i,
      /\bpay\s+(?:(?:₹|rs\.?|inr|sgd|rm|\$)\s*[\d,]+\s*)?(?:gst|tax|commission|fee)\s+(?:first|upfront|to\s+(?:withdraw|release|unlock|claim))\b/i,
      /\b(?:parcel|package|courier|consignment)\b.*\b(?:held|detained|on\s+hold|pending)\b.*\b(?:fee|duty|pay|link|click)\b/i,
    ],
    respectNegation: true,
    explanation:
      'Requiring an advance payment to release a parcel, loan, salary, or supposed winnings is a core advance-fee fraud mechanism.',
    whyItMatters:
      'Once the initial fee is paid, scammers typically invent additional "tax" or "anti-money-laundering" charges.',
    relatedAlertIds: ['alert-apac-parcel-phish'],
    evidenceLabel: 'Advance-Fee Demand',
  },

  // 11. Suspicious Fund Recovery Scams
  {
    id: 'rule-fund-recovery',
    family: 'refund-recovery',
    category: 'financial-fraud',
    title: 'Third-party "scam fund recovery" or hacker-for-hire claim',
    severity: 'critical',
    weight: 42,
    patterns: [
      /\b(?:recover|trace|retrieve|hack\s+back)\s+(?:your\s+)?(?:lost|scammed|stolen)\s+(?:money|funds|crypto|usdt)\b/i,
      /\bfund\s*recovery\s*(?:agent|specialist|desk|service)\b/i,
    ],
    respectNegation: true,
    explanation:
      'Only banks and official cybercrime portals (1930 / cybercrime.gov.in) can legally freeze and trace stolen funds.',
    whyItMatters:
      'Secondary "recovery agents" specifically target prior scam victims to extract additional upfront fees.',
    evidenceLabel: 'Recovery Scam Indicator',
  },

  // 12. Urgency & Artificial Deadlines (Context-dependent!)
  {
    id: 'rule-urgency-deadline',
    family: 'urgency',
    category: 'social-engineering',
    title: 'Artificial countdown or high-pressure urgency',
    severity: 'warning',
    weight: 16,
    contextDependent: true,
    patterns: [
      /\b(?:within\s+(?:\d+\s*(?:min|mins|minutes|hr|hrs|hours)|24\s*hours|today)|expires?\s+(?:tonight|today|soon|in\s+\d+)|last\s+(?:chance|warning|notice)|final\s+(?:warning|reminder|notice)|act\s+(?:now|immediately)|turant|abhi\s+kare)\b/i,
      /\burgent\s*(?:action\s+required|notice|kyc|update|verification)\b/i,
    ],
    respectNegation: true,
    explanation:
      'Short deadlines ("tonight", "within 2 hours", "final warning") are used to rush decisions before you can verify independently.',
    whyItMatters:
      'Urgency alone can appear in benign billing reminders, so LEGITCHECK weighs it alongside unverified links, credential prompts, or fee demands.',
  },

  // 13. Shopping / Marketplace Payment & Delivery Fraud
  {
    id: 'rule-shopping-marketplace',
    family: 'shopping-delivery',
    category: 'shopping-fraud',
    title: 'Off-platform marketplace buyer pressure or suspicious courier fee',
    severity: 'warning',
    weight: 26,
    patterns: [
      /\b(?:olx|quikr|facebook\s+marketplace|carousell)\b.*\b(?:army|military|cis[fs]|soldier|pickup\s+van|qr|advance|courier\s+collect)\b/i,
      /\b(?:cod\s+unavailable|pay\s+advance\s+to\s+book|heavy\s+discount\s+90%)\b/i,
      /\b(?:indiapost|singpost|auspost|delhivery|bluedart|fedex|dhl)\b.*\b(?:address\s+incomplete|incomplete\s+address|reschedule\s+delivery|redelivery)\b/i,
    ],
    respectNegation: true,
    explanation:
      'Marketplace buyers pushing urgent QR "advances" and fake delivery texts claiming incomplete addresses are widespread fraud lures.',
    whyItMatters:
      'Real couriers let you track parcels inside their official website by tracking ID without paying sudden redelivery fees over SMS links.',
    relatedAlertIds: ['alert-apac-parcel-phish'],
    evidenceLabel: 'Delivery / Marketplace Lure',
  },

  // 14. Authority / Brand Impersonation Combined with Unofficial Channels
  {
    id: 'rule-impersonation-unofficial-channel',
    family: 'impersonation',
    category: 'impersonation',
    title: 'Institutional or government claim routed through chat or personal handle',
    severity: 'warning',
    weight: 24,
    contextDependent: true,
    patterns: [
      /\b(?:rbi|sebi|income\s*tax|hdfc|sbi|icici|axis|paytm|police|customs|singpass|dbs|ocbc|maybank)\b.*\b(?:telegram|whatsapp\s+number|gmail\.com|yahoo\.com|pm\s+relief|manager\s+personal)\b/i,
      /\bmove\s+(?:the\s+chat\s+)?to\s+(?:telegram|whatsapp)\b/i,
    ],
    respectNegation: true,
    explanation:
      'Banks, regulators, and formal employers do not handle official account or recruitment compliance over Telegram or personal webmail.',
    whyItMatters:
      'Moving conversations to encrypted chat apps bypasses platform fraud filters and email domain authentication.',
    evidenceLabel: 'Off-Platform Channel Shift',
  },

  // 15. Accidental Transfer / Overpayment Reversal Pressure
  {
    id: 'rule-accidental-overpayment',
    family: 'refund-recovery',
    category: 'financial-fraud',
    title: 'Claimed "accidental transfer" or overpayment asking for manual return',
    severity: 'warning',
    weight: 26,
    patterns: [
      /\b(?:accidentally|by\s+mistake|mistakenly)\s+(?:sent|transferred|paid|credited)\s+(?:you\s+)?(?:₹|rs\.?|inr|sgd|\$)?\s*\d[\d,]*/i,
      /\b(?:refund|send\s+back|return)\s+(?:the\s+)?(?:extra|excess|mistaken)\s+(?:amount|money|transfer)\s+(?:to\s+another|urgent|immediately|now)\b/i,
    ],
    respectNegation: true,
    explanation:
      'Overpayment and "wrong transfer" tricks rely on fake credit SMS screenshots to push victims into sending real funds before verifying inside their bank app.',
    whyItMatters:
      'Wait for verified settlement inside your official banking app or have your bank handle any disputed credit formally.',
    evidenceLabel: 'Wrong-Transfer Reversal Lure',
  },
];
