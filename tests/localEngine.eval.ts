/**
 * Evaluation dataset & runner for LEGITCHECK's offline Local Mode detection engine.
 * Kept strictly separate from production detection rules in src/engine/local/.
 */

import { runLocalNlpDetection } from '../src/engine/local/engine';
import { CautionLevel, CheckMode, ScamCategory } from '../src/types/legitcheck';

export interface EvalCase {
  id: string;
  bucket:
    | 'obvious-scam'
    | 'sophisticated-scam'
    | 'legit-bank'
    | 'genuine-job'
    | 'legit-payment'
    | 'normal-conversation'
    | 'mixed-ambiguous'
    | 'multilingual-obfuscated';
  mode: CheckMode;
  text: string;
  expectedLevels: CautionLevel[];
  expectedCategories?: ScamCategory[];
  note: string;
}

export const EVALUATION_DATASET: EvalCase[] = [
  // 1. Obvious scams
  {
    id: 'eval-01',
    bucket: 'obvious-scam',
    mode: 'message',
    text: 'Dear Customer, your HDFC Bank KYC expires tonight at 10 PM. Download Bank_KYC_Update.apk or click https://hdfc-kyc-verify.top immediately to avoid account block.',
    expectedLevels: ['high-risk-indicators'],
    expectedCategories: ['phishing'],
    note: 'Bank KYC urgency + .apk + lookalike .top domain',
  },
  {
    id: 'eval-02',
    bucket: 'obvious-scam',
    mode: 'payment',
    text: 'Buyer on OLX sent a collect request for ₹4,500 and asked me to enter my UPI PIN to receive the ₹4,500 advance into my bank account.',
    expectedLevels: ['high-risk-indicators'],
    expectedCategories: ['financial-fraud'],
    note: 'UPI collect + PIN reversal trap',
  },
  {
    id: 'eval-03',
    bucket: 'obvious-scam',
    mode: 'message',
    text: 'Mumbai Customs Narcotics Bureau: Your Aadhaar is linked to an illegal parcel. Stay on Skype video call for Digital Arrest verification or transfer ₹50,000 security deposit.',
    expectedLevels: ['high-risk-indicators'],
    expectedCategories: ['impersonation', 'financial-fraud'],
    note: 'Digital Arrest coercion + upfront deposit',
  },
  {
    id: 'eval-04',
    bucket: 'obvious-scam',
    mode: 'message',
    text: 'Part-time remote offer: Earn ₹4,500 daily completing hotel reviews on Telegram. Complete a ₹3,000 refundable prepaid task to unlock VIP commission.',
    expectedLevels: ['high-risk-indicators'],
    expectedCategories: ['recruitment-scam'],
    note: 'Telegram prepaid merchant task scam',
  },
  {
    id: 'eval-05',
    bucket: 'obvious-scam',
    mode: 'message',
    text: 'Join our VIP Trading WhatsApp group for 100% guaranteed profit and double your money in 7 days with zero risk crypto signals.',
    expectedLevels: ['high-risk-indicators'],
    expectedCategories: ['investment-scam'],
    note: 'Guaranteed return investment scam',
  },
  {
    id: 'eval-06',
    bucket: 'obvious-scam',
    mode: 'website',
    text: 'https://indiapost-parcel-pay.top/track?fee=25',
    expectedLevels: ['high-risk-indicators'],
    expectedCategories: ['phishing'],
    note: 'Brand lookalike courier phishing domain on .top',
  },

  // 2. Sophisticated / subtler scams
  {
    id: 'eval-07',
    bucket: 'sophisticated-scam',
    mode: 'message',
    text: 'Congratulations on clearing the final HR round at Apex Solutions. To dispatch your corporate laptop and issue the offer letter, please submit a refundable security deposit of ₹2,499 to talentdesk99@gmail.com.',
    expectedLevels: ['high-risk-indicators'],
    expectedCategories: ['recruitment-scam'],
    note: 'Polite corporate HR impersonation demanding refundable security deposit + webmail',
  },
  {
    id: 'eval-08',
    bucket: 'sophisticated-scam',
    mode: 'message',
    text: 'Hello, your international parcel from FedEx has an incomplete address and is detained at customs. Please verify at https://fedex-redelivery-help.xyz within 24 hours.',
    expectedLevels: ['high-risk-indicators', 'elevated-caution'],
    expectedCategories: ['phishing', 'shopping-fraud', 'financial-fraud'],
    note: 'Courier redelivery lure + lookalike domain',
  },
  {
    id: 'eval-09',
    bucket: 'sophisticated-scam',
    mode: 'message',
    text: 'Our technical support team needs you to install QuickSupport and share your 9-digit code so we can complete your electricity meter refund.',
    expectedLevels: ['high-risk-indicators'],
    expectedCategories: ['social-engineering'],
    note: 'Polite remote-access coercion without shouting',
  },

  // 3. Legitimate bank notifications (Must NOT false-positive as high risk!)
  {
    id: 'eval-10',
    bucket: 'legit-bank',
    mode: 'message',
    text: '849201 is your OTP for a payment of Rs. 1,250.00 on Amazon via HDFC Bank Card XX4821. Do not share this OTP with anyone. Bank officials never ask for OTP or PIN.',
    expectedLevels: ['low-signal'],
    note: 'Genuine transactional OTP SMS with standard "do not share OTP" warning',
  },
  {
    id: 'eval-11',
    bucket: 'legit-bank',
    mode: 'message',
    text: 'Dear Customer, A/c XX9012 debited by Rs 640.00 on 15-Nov via UPI. Available balance: Rs 24,510.20. If not done by you, call 1800-11-2211 or visit your nearest branch.',
    expectedLevels: ['low-signal'],
    note: 'Genuine bank debit SMS alert',
  },
  {
    id: 'eval-12',
    bucket: 'legit-bank',
    mode: 'message',
    text: 'Reminder: Please update your periodic KYC via official app or visit your nearest branch before 30 Nov. Visit https://www.sbi.co.in for details. Never click third-party APK links.',
    expectedLevels: ['low-signal'],
    note: 'Official bank reminder mentioning KYC, official domain, and warning against APK links',
  },

  // 4. Genuine job offers
  {
    id: 'eval-13',
    bucket: 'genuine-job',
    mode: 'message',
    text: 'Hi Riya, thank you for interviewing for Frontend Engineer at Northstar Labs. Your technical round is scheduled for Tuesday at 3:00 PM IST. We charge no registration fee and no deposit at any stage.',
    expectedLevels: ['low-signal'],
    note: 'Genuine interview invite explicitly stating zero fees',
  },

  // 5. Legitimate payment requests
  {
    id: 'eval-14',
    bucket: 'legit-payment',
    mode: 'message',
    text: 'Hey, splitting tonight’s dinner bill — your share is ₹680. Let me know once you transfer via Google Pay before tomorrow.',
    expectedLevels: ['low-signal'],
    note: 'Normal peer payment split containing currency and payment mention',
  },

  // 6. Normal conversations
  {
    id: 'eval-15',
    bucket: 'normal-conversation',
    mode: 'message',
    text: 'Hi, your dental checkup at BrightSmile Clinic is confirmed for Friday at 4:00 PM. Call our front desk if you need to reschedule.',
    expectedLevels: ['low-signal'],
    note: 'Benign clinic appointment SMS',
  },
  {
    id: 'eval-16',
    bucket: 'normal-conversation',
    mode: 'message',
    text: 'Urgent note for tonight: could you pick up milk and bread on your way home?',
    expectedLevels: ['low-signal', 'elevated-caution'],
    note: 'Uses word "Urgent" and "tonight" in normal household text—must NEVER be high-risk',
  },

  // 7. Mixed / ambiguous / awareness forwards
  {
    id: 'eval-17',
    bucket: 'mixed-ambiguous',
    mode: 'message',
    text: 'Scam alert for family group: Police never do digital arrest over Skype and banks never ask for UPI PIN or OTP to send refunds.',
    expectedLevels: ['low-signal'],
    note: 'Family awareness forward using scam keywords in negated/warning context',
  },
  {
    id: 'eval-18',
    bucket: 'mixed-ambiguous',
    mode: 'message',
    text: 'Urgent action required: Your annual invoice #442 is pending review by finance tonight.',
    expectedLevels: ['low-signal', 'elevated-caution'],
    note: 'Ambiguous urgency without links/credentials—should not trigger high-risk alarm',
  },

  // 8. Multilingual (Hinglish) & obfuscated variations
  {
    id: 'eval-19',
    bucket: 'multilingual-obfuscated',
    mode: 'message',
    text: 'Aapka SBI khata aaj band ho jayega. Apna kyc turant update kare aur apna 6 digit otp batao.',
    expectedLevels: ['high-risk-indicators'],
    expectedCategories: ['phishing'],
    note: 'Hinglish KYC block threat + OTP demand',
  },
  {
    id: 'eval-20',
    bucket: 'multilingual-obfuscated',
    mode: 'message',
    text: 'Urgnt notice! Your account expires tonight. Reply with your 0tp or click https://hdfc-secure.xyz',
    expectedLevels: ['high-risk-indicators'],
    expectedCategories: ['phishing'],
    note: 'Leetspeak obfuscation ("0tp") + brand lookalike domain',
  },
  {
    id: 'eval-21',
    bucket: 'obvious-scam',
    mode: 'message',
    text: 'Congratulations! You won a Rs 25 lakh KBC lucky draw lottery. Pay Rs 1,999 GST processing fee first to claim your prize.',
    expectedLevels: ['high-risk-indicators'],
    expectedCategories: ['social-engineering', 'financial-fraud'],
    note: 'Lottery claim + upfront GST processing fee',
  },
  {
    id: 'eval-22',
    bucket: 'sophisticated-scam',
    mode: 'payment',
    text: 'Hi, I accidentally transferred ₹8,500 to your UPI ID by mistake. Urgent please send it back immediately to 98110XX294@ybl.',
    expectedLevels: ['elevated-caution', 'high-risk-indicators'],
    expectedCategories: ['financial-fraud'],
    note: 'Accidental transfer reversal pressure',
  },
  {
    id: 'eval-23',
    bucket: 'legit-payment',
    mode: 'payment',
    text: 'Thanks for dining at Spice Garden! Scan our counter QR code to pay your bill of ₹1,420.',
    expectedLevels: ['low-signal'],
    note: 'Normal customer paying a cafe via QR code (not receiving refund)',
  },
  {
    id: 'eval-24',
    bucket: 'genuine-job',
    mode: 'message',
    text: 'We are hiring backend engineers in Bengaluru. View open roles and apply directly at https://careers.zoho.com with no application cost.',
    expectedLevels: ['low-signal'],
    note: 'Genuine job posting pointing to official corporate careers subdomain',
  },
];

let passed = 0;
let failed = 0;

console.log(`\nRunning LEGITCHECK Local Mode Evaluation (${EVALUATION_DATASET.length} cases)\n`);

for (const tc of EVALUATION_DATASET) {
  const result = runLocalNlpDetection({
    mode: tc.mode,
    focus: 'general',
    content: tc.text,
  });

  const levelOk = tc.expectedLevels.includes(result.cautionLevel);
  const categoryOk =
    !tc.expectedCategories || tc.expectedCategories.includes(result.scamCategory);

  if (levelOk && categoryOk) {
    passed += 1;
    console.log(
      `PASS [${tc.id}] (${tc.bucket}) -> ${result.cautionLevel} | ${result.scamCategory} | score=${result.localBreakdown?.weightedScore}`
    );
  } else {
    failed += 1;
    console.error(
      `FAIL [${tc.id}] (${tc.bucket}) -> got ${result.cautionLevel} (${result.scamCategory}, score=${result.localBreakdown?.weightedScore}), expected levels=[${tc.expectedLevels.join(', ')}]${
        tc.expectedCategories ? ` categories=[${tc.expectedCategories.join(', ')}]` : ''
      }`
    );
    console.error(`     Indicators: ${result.warningIndicators.map((i) => i.title).join(' ; ')}`);
  }
}

console.log(`\nEvaluation summary: ${passed}/${EVALUATION_DATASET.length} matched expected behavior (${failed} failed).\n`);

if (failed > 0) {
  process.exit(1);
}
