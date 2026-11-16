import { LabScenario, MythFactItem, QuizQuestion } from '../types/trucio';

export const LAB_SCENARIOS: LabScenario[] = [
  {
    id: 'lab-upi-refund',
    title: 'The "Marketplace Advance" Collect Request',
    channel: 'WhatsApp',
    senderDisplay: '+91 98••• ••412 (Unknown Buyer)',
    timestamp: 'Today · 14:18',
    body:
      'Hi, I am buying your sofa for ₹18,000. Sending ₹2,000 advance now via business UPI. I sent a payment QR—scan it and enter your UPI PIN to receive ₹2,000 instantly. Hurry, my pickup van is waiting.',
    hotspots: [
      {
        id: 'hs-1',
        label: 'PIN to Receive Money',
        textFragment: 'enter your UPI PIN to receive ₹2,000',
        tactic: 'Payment Flow Reversal',
        explanation:
          'You NEVER enter a UPI PIN or scan a QR code to receive money. A PIN only authorizes money leaving your bank account.',
      },
      {
        id: 'hs-2',
        label: 'Artificial Pickup Urgency',
        textFragment: 'Hurry, my pickup van is waiting',
        tactic: 'Time Pressure',
        explanation:
          'Creating an urgent logistics deadline discourages you from pausing to read the payment app’s warning screen ("Paying ₹2,000").',
      },
      {
        id: 'hs-3',
        label: 'False "Business UPI" Excuse',
        textFragment: 'via business UPI',
        tactic: 'Authority Jargon',
        explanation:
          'Scammers invent fake "army", "merchant", or "business UPI" rules to explain why the payment screen looks unusual.',
      },
    ],
    takeaway:
      'If a buyer asks you to scan a QR code, click a "Pay" button, or enter your UPI PIN to receive funds, it is a debit attempt.',
  },
  {
    id: 'lab-kyc-apk',
    title: 'The "Account Suspended Today" KYC Attachment',
    channel: 'SMS',
    senderDisplay: '+91 70••• ••891',
    timestamp: 'Today · 19:42',
    body:
      'Dear Customer, your Bank KYC expires at 10 PM tonight. Your netbanking will be blocked. Install official update tool: Bank_KYC_Verify_v4.apk or call 90123-XX811 immediately.',
    hotspots: [
      {
        id: 'hs-4',
        label: 'Personal Mobile Sender',
        textFragment: '+91 70••• ••891',
        tactic: 'Sender Mismatch',
        explanation:
          'Registered banks in India send alerts via official DLT alphanumeric headers (e.g., AX-HDFCBK-S), not 10-digit personal numbers.',
      },
      {
        id: 'hs-5',
        label: 'Same-Night Deadline',
        textFragment: 'expires at 10 PM tonight',
        tactic: 'Panic Trigger',
        explanation:
          'Late-evening deadlines strike when bank branches are closed so victims act hastily.',
      },
      {
        id: 'hs-6',
        label: 'Direct .apk Installer',
        textFragment: 'Bank_KYC_Verify_v4.apk',
        tactic: 'Malicious Payload',
        explanation:
          'Banks never distribute Android updates as raw .apk files over SMS or WhatsApp. Installing this exposes your SMS OTPs.',
      },
    ],
    takeaway:
      'Never install .apk files from messages, and never call 10-digit mobile numbers listed inside an urgent banking alert.',
  },
  {
    id: 'lab-job-task',
    title: 'The "Prepaid Merchant Task" Escalation',
    channel: 'WhatsApp',
    senderDisplay: 'HR Coordinator · APAC Talent',
    timestamp: 'Yesterday · 11:05',
    body:
      'Earn ₹3,500–₹8,000 daily rating travel listings from home! Complete 3 free trial tasks to get ₹300 instant UPI bonus, then join our VIP Merchant Group where a ₹5,000 refundable order unlocks ₹6,800 payout.',
    hotspots: [
      {
        id: 'hs-7',
        label: 'Unrealistic Task Pay',
        textFragment: 'Earn ₹3,500–₹8,000 daily rating travel listings',
        tactic: 'High-Reward Lure',
        explanation:
          'Simple clicks or fake reviews never pay full-time professional salaries.',
      },
      {
        id: 'hs-8',
        label: 'Bait Micro-Payout',
        textFragment: '₹300 instant UPI bonus',
        tactic: 'Confidence Hook',
        explanation:
          'Sending a real small payout first convinces targets the platform is legitimate before larger sums are demanded.',
      },
      {
        id: 'hs-9',
        label: 'Deposit to Earn',
        textFragment: '₹5,000 refundable order unlocks ₹6,800',
        tactic: 'Sunk-Cost Trap',
        explanation:
          'Any "job" requiring you to transfer your own money to unlock commissions is a prepaid task scam.',
      },
    ],
    takeaway:
      'Real employers pay you for your work; you never pay deposits to unlock salary or task payouts.',
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    scenario:
      'You receive a video call from someone in a police uniform claiming your Aadhaar was used to ship illegal parcels and you are under "Digital Arrest" until you transfer a security deposit.',
    question: 'What is the safest immediate action?',
    options: [
      'Stay on the video call to prove your innocence and share bank balance details.',
      'Hang up immediately, make no transfer, and verify independently via 1930 or a local police station.',
      'Transfer a small verification amount so the automated system clears your name.',
    ],
    correctIndex: 1,
    explanation:
      'No law enforcement agency in India or APAC places citizens under "digital arrest" over video calls or demands verification transfers.',
  },
  {
    id: 'q2',
    scenario:
      'An SMS says a courier parcel is held for a ₹25 customs/redelivery fee and includes a link: https://indiapost-parcel-pay.top/track',
    question: 'What is the clearest domain red flag?',
    options: [
      'The link uses HTTPS encryption.',
      'The message mentions a small ₹25 fee.',
      'The root domain is "indiapost-parcel-pay.top" instead of an official .gov.in domain.',
    ],
    correctIndex: 2,
    explanation:
      'HTTPS only encrypts traffic—anyone can register a lookalike ".top" domain with HTTPS. Always inspect the root domain before the first slash.',
  },
  {
    id: 'q3',
    scenario:
      'Your UPI app shows a pending collect request for ₹14,500 with a note saying "Cashback Approved — Enter PIN to Credit".',
    question: 'What actually happens if you enter your UPI PIN?',
    options: [
      '₹14,500 is debited from your bank account and sent to the requester.',
      'Your bank verifies your identity and credits ₹14,500.',
      'Nothing happens unless you scan a QR code too.',
    ],
    correctIndex: 0,
    explanation:
      'Entering a UPI PIN on a collect request always authorizes an outgoing debit, regardless of what the free-text note claims.',
  },
  {
    id: 'q4',
    scenario:
      'Hours after losing money in an online scam, someone messages you on Telegram claiming they can hack the scammer’s wallet and recover your funds for a 10% software fee.',
    question: 'What is this interaction?',
    options: [
      'An authorized private recovery contractor.',
      'A secondary recovery scam targeting previous victims.',
      'A standard NPCI chargeback desk.',
    ],
    correctIndex: 1,
    explanation:
      'Recovery scammers monitor complaint threads to defraud victims a second time. Only banks and official law enforcement portals (like 1930 / cybercrime.gov.in) can process lien holds.',
  },
];

export const MYTH_FACT_ITEMS: MythFactItem[] = [
  {
    id: 'mf-1',
    statement: 'A website showing HTTPS and a padlock icon means it is legitimate and safe.',
    isFact: false,
    explanation:
      'Myth. HTTPS only means the connection between your browser and that server is encrypted. Phishing pages routinely use free SSL/TLS certificates.',
  },
  {
    id: 'mf-2',
    statement: 'You never need to enter your UPI PIN or scan a QR code to receive money.',
    isFact: true,
    explanation:
      'Fact. UPI PINs and QR scans only authorize money leaving your account. Incoming transfers happen automatically with zero PIN entry.',
  },
  {
    id: 'mf-3',
    statement: 'Calling 1930 in India within the first few hours can help freeze funds before they are withdrawn.',
    isFact: true,
    explanation:
      'Fact. The Citizen Financial Cyber Fraud Reporting system connects banks and wallets rapidly so disputed funds can be put on hold if reported early.',
  },
  {
    id: 'mf-4',
    statement: 'Submitting a scam report on a safety intelligence platform automatically files a formal FIR with the police.',
    isFact: false,
    explanation:
      'Myth. Platform reports do not replace official police or national cybercrime filings. Always report directly to cybercrime.gov.in (India) or your national APAC police portal.',
  },
];
