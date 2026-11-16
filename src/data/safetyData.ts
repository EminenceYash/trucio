import { SafetyGuide } from '../types/trucio';

export const SAFETY_GUIDES: SafetyGuide[] = [
  {
    id: 'guide-financial-upi',
    slug: 'financial-fraud',
    title: 'Financial & UPI Fraud Response',
    urgency: 'immediate',
    summary:
      'Time is the critical factor in India and APAC banking fraud. Freezing the recipient trail within the first 1–2 hours dramatically improves fund-hold chances.',
    immediateActions: [
      'India: Dial 1930 immediately (National Cyber Crime Helpline) and have the transaction ID / UTR, timestamp, and debited account number ready.',
      'Call your issuing bank’s 24x7 fraud helpline to freeze outgoing UPI, netbanking, and card channels.',
      'File an online complaint at cybercrime.gov.in and note the acknowledgement number for bank lien-marking.',
      'APAC users: Contact your bank’s emergency kill-switch / fraud desk and file with ScamShield / SPF (SG), NSRC 997 (MY), or IDCARE / Scamwatch (AU).',
    ],
    verificationChecklist: [
      'Collect the 12-digit UPI Reference / UTR number from your payment app.',
      'Screenshot the beneficiary UPI ID, bank account, or QR code used.',
      'Save bank SMS debit alerts and call logs without altering timestamps.',
    ],
    whatNotToDo: [
      'Do not pay any "reversal fee", "tax clearance", or "refund deposit" to recover lost money.',
      'Do not delete the chat thread or block the caller before capturing screenshots and phone numbers.',
    ],
    officialChannels: [
      {
        region: 'India',
        name: 'National Cyber Crime Helpline & Portal',
        contact: 'Dial 1930 · cybercrime.gov.in',
        url: 'https://cybercrime.gov.in',
      },
      {
        region: 'India',
        name: 'NPCI UPI Dispute & RBI Ombudsman',
        contact: 'Your UPI App Dispute Menu · cms.rbi.org.in',
        url: 'https://cms.rbi.org.in',
      },
      {
        region: 'Singapore',
        name: 'SPF Anti-Scam Helpline / ScamShield',
        contact: 'Dial 1799 · scamshield.gov.sg',
      },
      {
        region: 'Malaysia',
        name: 'National Scam Response Centre (NSRC)',
        contact: 'Dial 997 (8am–8pm daily)',
      },
      {
        region: 'Australia',
        name: 'Scamwatch & IDCARE',
        contact: 'scamwatch.gov.au · 1800 595 160',
      },
    ],
  },
  {
    id: 'guide-otp-password',
    slug: 'otp-password',
    title: 'OTP, PIN & Password Exposure',
    urgency: 'immediate',
    summary:
      'If you shared a one-time password, UPI PIN, card CVV, or typed credentials into a lookalike link, isolate affected accounts immediately.',
    immediateActions: [
      'Change the compromised password from a clean, separate device immediately—prioritizing your primary email first.',
      'Disable international and online card transactions temporarily inside your banking app.',
      'Log out all active sessions in Google, Apple, banking, and social accounts.',
      'Enable hardware or authenticator-app 2FA instead of SMS OTP wherever supported.',
    ],
    verificationChecklist: [
      'Inspect email forwarding rules and recovery phone numbers for unauthorized additions.',
      'Review recent bank statements and UPI mandate / auto-pay approvals.',
    ],
    whatNotToDo: [
      'Do not reuse the same password across email, banking, and shopping apps.',
      'Do not share a follow-up OTP with anyone calling to "cancel" the first transaction.',
    ],
    officialChannels: [
      {
        region: 'India',
        name: 'CERT-In & National Cyber Crime Portal',
        contact: 'Dial 1930 · cybercrime.gov.in',
      },
      {
        region: 'Hong Kong',
        name: 'ADCC Anti-Scam Helpline',
        contact: 'Dial 18222',
      },
    ],
  },
  {
    id: 'guide-phishing',
    slug: 'phishing',
    title: 'Phishing Links & Lookalike Portals',
    urgency: 'high',
    summary:
      'How to handle suspicious SMS, WhatsApp, or email links claiming KYC expiry, reward points, tax refunds, or courier holds.',
    immediateActions: [
      'If you tapped the link without entering details, close the browser tab and clear site data.',
      'If you entered card or login credentials, treat them as exposed: lock the card and rotate passwords immediately.',
      'Report suspicious Indian telecom headers and numbers on Sanchar Saathi (Chakshu).',
    ],
    verificationChecklist: [
      'Inspect the root domain right before the first "/" (e.g., bank-kyc-update.com is not your bank).',
      'Open the official organization app or bookmark directly instead of following message links.',
    ],
    whatNotToDo: [
      'Do not trust a padlock icon (HTTPS) alone—scam sites easily obtain free TLS certificates.',
      'Do not reply "STOP" or engage with suspicious unknown senders.',
    ],
    officialChannels: [
      {
        region: 'India',
        name: 'Sanchar Saathi — Chakshu Suspected Fraud Reporting',
        contact: 'sancharsaathi.gov.in/sfc',
        url: 'https://sancharsaathi.gov.in/sfc',
      },
    ],
  },
  {
    id: 'guide-malicious-apk',
    slug: 'malicious-apk',
    title: 'Malicious APK & Screen-Sharing Apps',
    urgency: 'immediate',
    summary:
      'Installing an .apk file from WhatsApp or granting remote screen-sharing access gives attackers visibility over SMS OTPs and banking sessions.',
    immediateActions: [
      'Turn on Airplane Mode or disconnect Wi-Fi and mobile data immediately to halt remote data exfiltration.',
      'Using another clean phone, call your bank and 1930 to freeze accounts.',
      'Uninstall the unknown app or revoke Accessibility / Device Admin permissions in Android Settings -> Apps -> Special app access.',
      'If the app blocks removal, boot into Safe Mode to uninstall, or back up personal photos and perform a factory reset.',
    ],
    verificationChecklist: [
      'Check Settings -> Accessibility -> Installed Services for unfamiliar apps.',
      'Check Settings -> Security -> Device Admin Apps for unknown entries.',
    ],
    whatNotToDo: [
      'Do not log into banking apps on the affected device until it is verified clean or reset.',
    ],
    officialChannels: [
      {
        region: 'India',
        name: 'Cyber Swachhta Kendra (Botnet & Malware Cleaning)',
        contact: 'csk.gov.in · 1930',
      },
    ],
  },
  {
    id: 'guide-account-compromise',
    slug: 'account-compromise',
    title: 'WhatsApp & Social Account Takeover',
    urgency: 'high',
    summary:
      'Attackers hijack WhatsApp or Instagram accounts using forwarded 6-digit verification codes to message your contacts asking for urgent loans.',
    immediateActions: [
      'Re-register your phone number inside WhatsApp to force-sign-out the attacker (wait out any SMS timer if triggered).',
      'Check WhatsApp Settings -> Linked Devices and remove every unrecognized browser or desktop session.',
      'Enable Two-Step Verification (6-digit PIN) inside WhatsApp Settings -> Account.',
      'Alert close family and workplace contacts via a phone call so they ignore money requests sent in your name.',
    ],
    verificationChecklist: [
      'Check your phone’s call-forwarding settings (*#21# or carrier settings) in case OTP calls are being diverted.',
    ],
    whatNotToDo: [
      'Do not pay anyone claiming to be a "WhatsApp recovery specialist".',
    ],
    officialChannels: [
      {
        region: 'India',
        name: 'National Cyber Crime Portal (Impersonation / Account Hack)',
        contact: 'cybercrime.gov.in · 1930',
      },
    ],
  },
  {
    id: 'guide-identity-theft',
    slug: 'identity-theft',
    title: 'Identity Theft & KYC Document Exposure',
    urgency: 'high',
    summary:
      'Steps to take if you uploaded Aadhaar, PAN, passport, NRIC, or selfie videos to an unverified portal or impersonator.',
    immediateActions: [
      'India: Lock your Aadhaar biometrics via the official mAadhaar app or uidai.gov.in.',
      'Check your CIBIL / Experian credit report for unfamiliar loan inquiries and place a dispute alert if needed.',
      'Check Sanchar Saathi TAFCOP portal (tafcop.sancharsaathi.gov.in) to verify mobile numbers issued against your identity.',
    ],
    verificationChecklist: [
      'Record exactly which document images or video KYC clips were shared and on which date.',
    ],
    whatNotToDo: [
      'Do not send additional ID documents to "verify your identity" to recover a compromised account.',
    ],
    officialChannels: [
      {
        region: 'India',
        name: 'UIDAI Aadhaar Lock & TAFCOP',
        contact: 'myaadhaar.uidai.gov.in · tafcop.sancharsaathi.gov.in',
      },
      {
        region: 'Australia',
        name: 'IDCARE National Identity & Cyber Support',
        contact: 'idcare.org · 1800 595 160',
      },
    ],
  },
  {
    id: 'guide-recovery-scams',
    slug: 'recovery-scams',
    title: 'Avoiding "Fund Recovery" Follow-Up Scams',
    urgency: 'preventive',
    summary:
      'Scammers actively target recent victims on social media and search ads, posing as "ethical hackers", legal agents, or cyber-recovery agencies.',
    immediateActions: [
      'Verify any recovery claim against official government and banking channels—private individuals cannot reverse settled UPI, wire, or crypto transfers.',
      'Report secondary recovery solicitors using the same 1930 / cybercrime.gov.in case reference.',
    ],
    verificationChecklist: [
      'Be skeptical of anyone asking for upfront "software fees", gift cards, or crypto gas fees to recover stolen money.',
    ],
    whatNotToDo: [
      'Never hire unverified "cyber recovery" accounts found in YouTube, Telegram, or X comments.',
    ],
    officialChannels: [
      {
        region: 'India & APAC',
        name: 'Official Law Enforcement Only',
        contact: '1930 (IN) · 1799 (SG) · 997 (MY) · 18222 (HK)',
      },
    ],
  },
  {
    id: 'guide-evidence',
    slug: 'evidence-preservation',
    title: 'Preserving Digital Evidence Properly',
    urgency: 'preventive',
    summary:
      'Clean, unedited evidence makes bank lien requests and police complaints significantly faster to process.',
    immediateActions: [
      'Take uncropped screenshots showing full URLs, sender phone numbers/handles, timestamps, and payment UTRs.',
      'Export the full chat transcript (e.g., WhatsApp Export Chat without deleting messages).',
      'Save full email headers (.eml / "Show Original") rather than only forwarding the email body.',
      'Write a simple timeline noting exact dates, amounts, accounts debited, and platforms used.',
    ],
    verificationChecklist: [
      'Keep original files unmodified on your device or read-only backup.',
    ],
    whatNotToDo: [
      'Do not crop out phone numbers or URLs from evidence screenshots sent to banks or police.',
    ],
    officialChannels: [
      {
        region: 'India',
        name: 'Citizen Financial Cyber Fraud Reporting & Management System',
        contact: 'cybercrime.gov.in · Helpline 1930',
      },
    ],
  },
];
