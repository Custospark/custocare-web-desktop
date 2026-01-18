// SearchPrescription.tsx (Updated)
import React, { useState } from 'react';
import { Search, Plus, Minus, Trash2, Send, DollarSign } from 'lucide-react';

interface SearchPrescriptionProps {
  theme: 'light' | 'dark';
}

interface InventoryItem {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  unitPrice: number;
  stockQuantity: number;
}

interface PrescriptionLineItem {
  inventoryItemId: string;
  name: string;
  dosage: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const SearchPrescription: React.FC<SearchPrescriptionProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [lineItems, setLineItems] = useState<PrescriptionLineItem[]>([]);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // Mock inventory data
  const mockInventory: InventoryItem[] = [
    {
      id: 'INV-001',
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      dosage: '500mg',
      unitPrice: 0.5,
      stockQuantity: 1000,
    },
    {
      id: 'INV-002',
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      dosage: '250mg',
      unitPrice: 2.5,
      stockQuantity: 500,
    },
    {
      id: 'INV-003',
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      dosage: '400mg',
      unitPrice: 1.0,
      stockQuantity: 800,
    },
    {
      id: 'INV-004',
      name: 'Omeprazole',
      genericName: 'Omeprazole',
      dosage: '20mg',
      unitPrice: 3.0,
      stockQuantity: 300,
    },
  ];

  const mockDepartments = [
    'Clinical',
    'Laboratory',
    'Radiology',
    'Billing Office',
    'Nursing Station',
    'Emergency',
  ];

  const filteredInventory = mockInventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.genericName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = (item: InventoryItem) => {
    const existing = lineItems.find((li) => li.inventoryItemId === item.id);

    if (existing) {
      handleIncreaseQuantity(item.id);
    } else {
      const newLineItem: PrescriptionLineItem = {
        inventoryItemId: item.id,
        name: item.name,
        dosage: item.dosage,
        quantity: 1,
        unitPrice: item.unitPrice,
        total: item.unitPrice,
      };
      setLineItems([...lineItems, newLineItem]);
    }

    setSearchTerm('');
    setShowResults(false);
  };

  const handleIncreaseQuantity = (itemId: string) => {
    setLineItems(
      lineItems.map((item) =>
        item.inventoryItemId === itemId
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
          : item
      )
    );
  };

  const handleDecreaseQuantity = (itemId: string) => {
    setLineItems(
      lineItems.map((item) =>
        item.inventoryItemId === itemId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1, total: (item.quantity - 1) * item.unitPrice }
          : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setLineItems(lineItems.filter((item) => item.inventoryItemId !== itemId));
  };

  const calculateGrandTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleForwardToDepartment = () => {
    if (selectedDepartment) {
      alert(`Forwarding to ${selectedDepartment}...`);
      setShowForwardModal(false);
      // Reset or navigate
    }
  };

  const handleSettleBill = () => {
    alert('Proceeding to settle bill...');
    // Navigate to billing or process payment
  };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Add Prescription Items</h2>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowResults(e.target.value.length > 0);
              }}
              placeholder="Search medications (name or generic)..."
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          {/* Search Results Dropdown */}
          {showResults && filteredInventory.length > 0 && (
            <div
              className={`absolute z-10 w-full mt-2 rounded-lg border shadow-lg max-h-64 overflow-y-auto ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              {filteredInventory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className={`w-full text-left p-3 hover:bg-opacity-50 transition-colors border-b last:border-b-0 ${
                    isDark
                      ? 'hover:bg-gray-700 border-gray-700'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="font-medium">{item.name}</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.genericName} • {item.dosage} • ${item.unitPrice.toFixed(2)} • Stock:{' '}
                    {item.stockQuantity}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div
          className={`rounded-xl border mb-6 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className="font-semibold">Prescription Items</h3>
          </div>

          {lineItems.length === 0 ? (
            <div className="p-8 text-center">
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                No items added yet. Search and add medications above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-gray-900' : 'bg-gray-50'}>
                  <tr>
                    <th
                      className={`px-4 py-3 text-left text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Medication
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Dosage
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Unit Price
                    </th>
                    <th
                      className={`px-4 py-3 text-center text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Quantity
                    </th>
                    <th
                      className={`px-4 py-3 text-right text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Total
                    </th>
                    <th
                      className={`px-4 py-3 text-center text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr
                      key={item.inventoryItemId}
                      className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.dosage}
                      </td>
                      <td className="px-4 py-3">${item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDecreaseQuantity(item.inventoryItemId)}
                            className={`p-1 rounded ${
                              isDark
                                ? 'hover:bg-gray-700 text-gray-400'
                                : 'hover:bg-gray-100 text-gray-600'
                            }`}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleIncreaseQuantity(item.inventoryItemId)}
                            className={`p-1 rounded ${
                              isDark
                                ? 'hover:bg-gray-700 text-gray-400'
                                : 'hover:bg-gray-100 text-gray-600'
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ${item.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemoveItem(item.inventoryItemId)}
                          className={`p-2 rounded ${
                            isDark
                              ? 'hover:bg-red-900/30 text-red-400'
                              : 'hover:bg-red-50 text-red-600'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Grand Total */}
          {lineItems.length > 0 && (
            <div
              className={`px-4 py-4 border-t flex justify-between items-center ${
                isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <span className="text-lg font-semibold">Grand Total:</span>
              <span className="text-2xl font-bold text-blue-600">
                ${calculateGrandTotal().toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {lineItems.length > 0 && (
          <div className="flex gap-4">
            <button
              onClick={() => setShowForwardModal(true)}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              <Send className="w-5 h-5" />
              Forward to Department
            </button>

            <button
              onClick={handleSettleBill}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <DollarSign className="w-5 h-5" />
              Settle Bill
            </button>
          </div>
        )}

        {/* Forward Modal */}
        {showForwardModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`rounded-xl p-6 max-w-md w-full mx-4 ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <h3 className="text-xl font-bold mb-4">Forward to Department</h3>

              <div className="mb-6">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Select Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-900 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">Choose department...</option>
                  {mockDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowForwardModal(false)}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleForwardToDepartment}
                  disabled={!selectedDepartment}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Forward
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPrescription;
