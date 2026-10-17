import type { SampleScenario } from '../types/analysis';

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: 'fake-refund-pin',
    name: 'Fake Refund (Requests UPI PIN)',
    badge: 'High Risk Example',
    category: 'Refund Fraud',
    description: 'Fraudulent SMS claiming an electricity bill refund but deceptively asking to enter a UPI PIN to receive money.',
    request: {
      text: 'Dear customer, your electricity bill refund of Rs 1,499 has been approved. Open your UPI app and enter your UPI PIN to claim immediate refund to your bank account.',
      url: null,
      request_type: 'message',
      recipient_name: 'Bijli Board Refund Desk',
    },
  },
  {
    id: 'urgent-kyc-url',
    name: 'Urgent KYC Suspension Link',
    badge: 'High Risk Link',
    category: 'Phishing Scam',
    description: 'High-pressure panic SMS warning of immediate account suspension unless a suspicious external link is opened.',
    request: {
      text: 'URGENT: Your SBI bank account will be blocked within 24 hours due to pending KYC expiry. Complete verification immediately at the link.',
      url: 'http://sbi-kyc-verification-update.xyz/verify-pan',
      request_type: 'url',
      recipient_name: 'SBI Alert Desk',
    },
  },
  {
    id: 'normal-grocery-payment',
    name: 'Normal Counter Grocery Payment',
    badge: 'Low Risk Example',
    category: 'Legitimate Purchase',
    description: 'Routine in-person merchant payment for grocery provisions at a local neighborhood store.',
    request: {
      text: 'Paying Rs 450 to Ramesh Kirana Store for daily provisions at retail counter.',
      url: null,
      request_type: 'payment',
      recipient_name: 'Ramesh Kirana Store (rameshstore@okhdfcbank)',
    },
  },
  {
    id: 'suspicious-qr-cashback',
    name: 'Decoded QR "Prize Cashback" Claim',
    badge: 'Suspicious QR Payload',
    category: 'QR Code Tampering',
    description: 'Decoded UPI QR payload from a social media contest disguised as receiving prize money but actually initiating a debit.',
    request: {
      text: 'upi://pay?pa=cashbackrewards99@ybl&pn=Mega%20Jackpot%20Cashback&am=4999&cu=INR&tn=Scan%20to%20Receive%20Cashback',
      url: null,
      request_type: 'qr',
      recipient_name: 'Mega Jackpot Cashback',
    },
  },
];
