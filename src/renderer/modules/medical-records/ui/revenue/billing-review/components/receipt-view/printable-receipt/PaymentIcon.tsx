// PaymentIcon.tsx
import React from 'react';
import { 
  Banknote, 
  CreditCard, 
  Building2, 
  Smartphone, 
  FileText 
} from 'lucide-react';

interface PaymentIconProps {
  type: string;
  className?: string;
}

const PaymentIcon: React.FC<PaymentIconProps> = ({ type, className = 'w-4 h-4' }) => {
  const icons: Record<string, React.FC<any>> = {
    cash: Banknote,
    card: CreditCard,
    insurance: Building2,
    mobile: Smartphone,
    bank_transfer: Building2,
    cheque: FileText,
  };
  const IconComponent = icons[type] || Banknote;
  return <IconComponent className={className} />;
};

export default PaymentIcon;