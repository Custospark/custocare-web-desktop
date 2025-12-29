import React from 'react';
import { cn } from '../../types/cn'; // Assuming you have this utility (classNames merger)
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store/store';

/**
 * HospitalBillReceipt.tsx
 * A single-component file for rendering a hospital bill receipt.
 * Uses mock data.
 * Respects the app's theme (light/dark) from Redux uiSlice.
 * Designed to look professional and printable (thermal-receipt style, narrow layout).
 */

interface Item {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface MockReceiptData {
  hospitalName: string;
  address: string;
  phone: string;
  website: string;
  billNo: string;
  date: string;
  patientName: string;
  patientId: string;
  doctor: string;
  items: Item[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  notes: string;
}

const mockData: MockReceiptData = {
  hospitalName: 'City General Hospital',
  address: '123 Health Street, Medical City, MC 12345',
  phone: '+1 (555) 123-4567',
  website: 'www.citygeneralhospital.com',
  billNo: 'BILL-2025-001234',
  date: 'December 28, 2025',
  patientName: 'John Doe',
  patientId: 'PT-987654',
  doctor: 'Dr. Emily Carter',
  items: [
    { description: 'Room Charge (Deluxe Ward - 2 days)', quantity: 2, unitPrice: 450.00, total: 900.00 },
    { description: 'Consultation Fee', quantity: 1, unitPrice: 150.00, total: 150.00 },
    { description: 'Blood Test Panel', quantity: 1, unitPrice: 280.00, total: 280.00 },
    { description: 'X-Ray (Chest)', quantity: 1, unitPrice: 120.00, total: 120.00 },
    { description: 'IV Fluids & Medications', quantity: 1, unitPrice: 195.00, total: 195.00 },
    { description: 'Nursing Care', quantity: 2, unitPrice: 80.00, total: 160.00 },
  ],
  subtotal: 1805.00,
  tax: 90.25, // 5% example
  discount: 100.00, // Senior citizen discount
  total: 1795.25,
  paymentMethod: 'Credit Card',
  notes: 'Thank you for choosing City General Hospital. Please retain this receipt for your records.',
};

const HospitalBillReceipt: React.FC = () => {
  const { theme } = useSelector((state: RootState) => state.ui);

  const isDark = theme === 'dark';

  return (
    <div
      className={cn(
        'max-w-md mx-auto p-6 font-mono text-sm leading-relaxed',
        'border rounded-lg shadow-lg print:max-w-none print:shadow-none print:border-0',
        isDark
          ? 'bg-gray-900 text-gray-100 border-gray-800'
          : 'bg-white text-gray-900 border-gray-200'
      )}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">{mockData.hospitalName}</h1>
        <p>{mockData.address}</p>
        <p>Phone: {mockData.phone}</p>
        <p>{mockData.website}</p>
        <div className="mt-4 pt-4 border-t border-dashed border-gray-500">
          <h2 className="text-lg font-semibold">HOSPITAL BILL RECEIPT</h2>
        </div>
      </div>

      {/* Bill Info */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-6">
        <div>
          <strong>Bill No:</strong> {mockData.billNo}
        </div>
        <div>
          <strong>Date:</strong> {mockData.date}
        </div>
        <div>
          <strong>Patient:</strong> {mockData.patientName}
        </div>
        <div>
          <strong>Patient ID:</strong> {mockData.patientId}
        </div>
        <div className="col-span-2">
          <strong>Attending Doctor:</strong> {mockData.doctor}
        </div>
      </div>

      <div className="border-t border-b border-dashed border-gray-500 py-2 mb-4">
        <div className="grid grid-cols-12 font-semibold">
          <div className="col-span-6">Description</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-2 text-right">Unit</div>
          <div className="col-span-2 text-right">Total</div>
        </div>
      </div>

      {/* Items */}
      <div className="mb-4">
        {mockData.items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-12 py-1">
            <div className="col-span-6">{item.description}</div>
            <div className="col-span-2 text-center">{item.quantity}</div>
            <div className="col-span-2 text-right">${item.unitPrice.toFixed(2)}</div>
            <div className="col-span-2 text-right">${item.total.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-dashed border-gray-500 pt-4 text-right space-y-1">
        <div>
          <strong>Subtotal:</strong> ${mockData.subtotal.toFixed(2)}
        </div>
        <div>
          <strong>Tax (5%):</strong> ${mockData.tax.toFixed(2)}
        </div>
        <div>
          <strong>Discount:</strong> -${mockData.discount.toFixed(2)}
        </div>
        <div className="text-lg font-bold pt-2 border-t border-dashed border-gray-500">
          Total Amount: ${mockData.total.toFixed(2)}
        </div>
        <div className="mt-2">
          <strong>Payment Method:</strong> {mockData.paymentMethod}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center border-t border-dashed border-gray-500 pt-4">
        <p className="italic">{mockData.notes}</p>
        <p className="mt-4">*** Thank You ***</p>
      </div>

      {/* Print-friendly tip */}
      <div className="print:hidden mt-8 text-center text-xs opacity-70">
        Tip: Use browser print (Ctrl+P) for a clean receipt. Media="print" styles can be added if needed.
      </div>
    </div>
  );
};

HospitalBillReceipt.displayName = 'HospitalBillReceipt';

export default HospitalBillReceipt;