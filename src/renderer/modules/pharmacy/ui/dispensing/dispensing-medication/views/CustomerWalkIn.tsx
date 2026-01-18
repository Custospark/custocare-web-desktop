// views/CustomerWalkIn.tsx
import React, { useState } from 'react';
import { UserPlus, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PHARMACY_ROUTES } from '../../../../../../app/routes/routeConstants';

interface CustomerWalkInProps {
  theme: 'light' | 'dark';
}

const CustomerWalkIn: React.FC<CustomerWalkInProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [visitCreated, setVisitCreated] = useState(false);
  const [generatedVisit, setGeneratedVisit] = useState<{
    visitId: string;
    customerId: string;
    customerName: string;
  } | null>(null);

  const handleCreateWalkIn = () => {
    setIsCreating(true);

    // Simulate API call
    setTimeout(() => {
      const mockVisit = {
        visitId: `VST-${Date.now()}`,
        customerId: `CUST-${Date.now()}`,
        customerName: `Walk-in Customer ${new Date().toLocaleTimeString()}`,
      };

      setGeneratedVisit(mockVisit);
      setVisitCreated(true);
      setIsCreating(false);
    }, 1500);
  };

  const handleProceedToDispense = () => {
    if (generatedVisit) {
      navigate(
        `${PHARMACY_ROUTES.DISPENSING_SEARCH_PRESCRIPTION}?visitId=${generatedVisit.visitId}&customerId=${generatedVisit.customerId}`
      );
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              isDark ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}
          >
            <UserPlus className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Customer Walk-in</h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            System will automatically generate a customer profile and create a visit record
          </p>
        </div>

        {!visitCreated ? (
          <div
            className={`rounded-xl border p-8 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Auto-generated Customer Profile</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    System creates a unique customer ID
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Visit Record Created</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Service container to track all dispensed items
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Ready for Dispensing</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Proceed immediately to add medications
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateWalkIn}
              disabled={isCreating}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Walk-in Customer
                </>
              )}
            </button>
          </div>
        ) : (
          <div
            className={`rounded-xl border p-8 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-green-50 border-green-200'
            }`}
          >
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Visit Created Successfully!</h3>
            </div>

            <div className="space-y-3 mb-6">
              <div
                className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-white'} border ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Visit ID
                </div>
                <div className="font-mono font-semibold">{generatedVisit?.visitId}</div>
              </div>

              <div
                className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-white'} border ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Customer ID
                </div>
                <div className="font-mono font-semibold">{generatedVisit?.customerId}</div>
              </div>

              <div
                className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-white'} border ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Customer Name
                </div>
                <div className="font-semibold">{generatedVisit?.customerName}</div>
              </div>
            </div>

            <button
              onClick={handleProceedToDispense}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              Proceed to Dispense Medication
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerWalkIn;
