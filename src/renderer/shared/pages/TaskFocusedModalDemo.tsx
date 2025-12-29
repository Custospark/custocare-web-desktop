import React, { useState, useRef } from 'react';
import Modal from '../components/Modals/Modal';
import Button from '../components/Buttons/Button';
import { FiAlertCircle, FiCheckCircle, FiLock, FiCreditCard } from 'react-icons/fi';

const TaskFocusedModalDemo: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'critical' | 'payment' | 'auth' | 'success' | null>(null);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: '',
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = (type: typeof activeModal) => {
    setActiveModal(type);
  };

  const handleClose = () => {
    setActiveModal(null);
  };

  const handleSubmit = () => {
    alert('Task completed successfully!');
    handleClose();
  };

  const handleAfterOpen = () => {
    console.log('Modal opened, user focused on task');
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleAfterClose = () => {
    console.log('Modal closed, user returned to main flow');
  };

  const renderModal = () => {
    switch (activeModal) {
      case 'critical':
        return (
          <Modal
            isOpen={true}
            onClose={handleClose}
            title="Critical Action Required"
            subtitle="This action cannot be undone. Please review carefully."
            variant="critical"
            size="small"
            focusLevel="high"
            disableEscape={true}
            icon={<FiAlertCircle />}
            onAfterOpen={handleAfterOpen}
            onAfterClose={handleAfterClose}
            footer={
              <>
                <Button variant="secondary" onClick={handleClose}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleSubmit}>
                  Confirm Delete
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              <div className="p-4 bg-critical-light/30 rounded-lg border border-critical-light/50">
                <p className="text-body font-medium text-critical-DEFAULT">
                  ⚠️ You are about to permanently delete:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-body text-critical-DEFAULT">
                  <li>All patient records in this category</li>
                  <li>Associated medical history</li>
                  <li>Prescription data</li>
                  <li>This action cannot be reversed</li>
                </ul>
              </div>
              <p className="text-body text-neutral-gray-dark">
                Type "DELETE" to confirm:
              </p>
              <input
                ref={inputRef}
                type="text"
                className="w-full border border-critical-light rounded-lg px-4 py-2.5
                  focus:outline-none focus:ring-2 focus:ring-critical-DEFAULT
                  text-body text-neutral-black placeholder-neutral-gray-medium"
                placeholder="Type DELETE here"
                onChange={(e) => {
                  if (e.target.value === 'DELETE') {
                    // Auto-confirm after typing
                    setTimeout(handleSubmit, 500);
                  }
                }}
              />
            </div>
          </Modal>
        );

      case 'payment':
        return (
          <Modal
            isOpen={true}
            onClose={handleClose}
            title="Payment Information"
            subtitle="Complete your purchase securely"
            variant="info"
            size="medium"
            focusLevel="high"
            icon={<FiCreditCard />}
            onAfterOpen={handleAfterOpen}
            onAfterClose={handleAfterClose}
            footer={
              <>
                <Button variant="secondary" onClick={handleClose}>
                  Cancel Payment
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                  Pay $249.99
                </Button>
              </>
            }
          >
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body font-semibold text-neutral-black mb-2">
                    Card Number
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    maxLength={19}
                    placeholder="1234 5678 9012 3456"
                    className="w-full border border-neutral-gray-light rounded-lg px-4 py-2.5
                      focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT
                      text-body-lg text-neutral-black"
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
                      setFormData({ ...formData, cardNumber: formatted });
                    }}
                    value={formData.cardNumber}
                  />
                </div>
                <div>
                  <label className="block text-body font-semibold text-neutral-black mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="MM/YY"
                    className="w-full border border-neutral-gray-light rounded-lg px-4 py-2.5
                      focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT
                      text-body-lg text-neutral-black"
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const formatted = value.length > 2 
                        ? `${value.slice(0,2)}/${value.slice(2,4)}`
                        : value;
                      setFormData({ ...formData, expiry: formatted });
                    }}
                    value={formData.expiry}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body font-semibold text-neutral-black mb-2">
                    CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="123"
                    className="w-full border border-neutral-gray-light rounded-lg px-4 py-2.5
                      focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT
                      text-body-lg text-neutral-black"
                    onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                    value={formData.cvv}
                  />
                </div>
                <div>
                  <label className="block text-body font-semibold text-neutral-black mb-2">
                    Name on Card
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full border border-neutral-gray-light rounded-lg px-4 py-2.5
                      focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT
                      text-body-lg text-neutral-black"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    value={formData.name}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 text-body-sm text-neutral-gray-medium">
                <div className="w-2 h-2 rounded-full bg-success-DEFAULT"></div>
                <span>Your payment is secured with 256-bit encryption</span>
              </div>
            </div>
          </Modal>
        );

      case 'auth':
        return (
          <Modal
            isOpen={true}
            onClose={handleClose}
            title="Authentication Required"
            subtitle="Verify your identity to continue"
            variant="warning"
            size="xs"
            focusLevel="high"
            disableEscape={true}
            icon={<FiLock />}
            onAfterOpen={handleAfterOpen}
            onAfterClose={handleAfterClose}
            footer={
              <Button variant="primary" onClick={handleSubmit} fullWidth>
                Verify Identity
              </Button>
            }
          >
            <div className="space-y-4">
              <p className="text-body text-neutral-gray-dark text-center">
                Enter the 6-digit code sent to your device:
              </p>
              <div className="flex justify-center space-x-2">
                {[...Array(6)].map((_, i) => (
                  <input
                    key={i}
                    ref={i === 0 ? inputRef : null}
                    type="text"
                    maxLength={1}
                    className="w-12 h-12 border-2 border-primary-DEFAULT rounded-lg
                      text-center text-h3 font-bold text-neutral-black
                      focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT
                      focus:border-transparent"
                    onChange={(e) => {
                      if (e.target.value && i < 5) {
                        const nextInput = document.querySelector<HTMLInputElement>(
                          `input:nth-child(${i + 2})`
                        );
                        nextInput?.focus();
                      }
                    }}
                  />
                ))}
              </div>
              <p className="text-body-sm text-neutral-gray-medium text-center">
                Code expires in 04:59
              </p>
            </div>
          </Modal>
        );

      case 'success':
        return (
          <Modal
            isOpen={true}
            onClose={handleClose}
            title="Task Completed!"
            subtitle="Your action was successful"
            variant="success"
            size="small"
            focusLevel="medium"
            icon={<FiCheckCircle />}
            onAfterOpen={handleAfterOpen}
            onAfterClose={handleAfterClose}
            footer={
              <Button variant="success" onClick={handleClose} fullWidth>
                Continue
              </Button>
            }
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto">
                <FiCheckCircle className="w-8 h-8 text-success-DEFAULT" />
              </div>
              <p className="text-body-lg text-neutral-black">
                Your changes have been saved successfully.
              </p>
              <p className="text-body text-neutral-gray-medium">
                You can now continue with your workflow.
              </p>
            </div>
          </Modal>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-gray-bg to-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-black mb-4">
            Task-Focused Popup Modals
          </h1>
          <p className="text-lg text-neutral-gray-medium">
            Modals that completely block and focus users on critical tasks
          </p>
        </div>

        {/* Task Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 rounded-lg bg-critical-light/20">
                <FiAlertCircle className="w-6 h-6 text-critical-DEFAULT" />
              </div>
              <h3 className="text-h3 font-semibold text-neutral-black">Critical Actions</h3>
            </div>
            <p className="text-body text-neutral-gray-medium mb-4">
              High-focus modals for dangerous operations that require full attention
            </p>
            <Button
              variant="danger"
              onClick={() => handleOpen('critical')}
              fullWidth
            >
              Delete Records
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 rounded-lg bg-primary-light/20">
                <FiCreditCard className="w-6 h-6 text-primary-DEFAULT" />
              </div>
              <h3 className="text-h3 font-semibold text-neutral-black">Payment Forms</h3>
            </div>
            <p className="text-body text-neutral-gray-medium mb-4">
              Secure payment flows that lock user focus on sensitive information
            </p>
            <Button
              variant="primary"
              onClick={() => handleOpen('payment')}
              fullWidth
            >
              Make Payment
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 rounded-lg bg-warning-light/20">
                <FiLock className="w-6 h-6 text-warning-DEFAULT" />
              </div>
              <h3 className="text-h3 font-semibold text-neutral-black">Authentication</h3>
            </div>
            <p className="text-body text-neutral-gray-medium mb-4">
              Security verification that blocks all other interactions
            </p>
            <Button
              variant="warning"
              onClick={() => handleOpen('auth')}
              fullWidth
            >
              Verify Identity
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 rounded-lg bg-success-light/20">
                <FiCheckCircle className="w-6 h-6 text-success-DEFAULT" />
              </div>
              <h3 className="text-h3 font-semibold text-neutral-black">Success Confirmation</h3>
            </div>
            <p className="text-body text-neutral-gray-medium mb-4">
              Clear feedback for completed tasks before returning to main flow
            </p>
            <Button
              variant="success"
              onClick={() => handleOpen('success')}
              fullWidth
            >
              Complete Task
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 p-6 bg-neutral-gray-bg rounded-xl">
          <h3 className="text-h3 font-semibold text-neutral-black mb-4">
            Focus Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-primary-DEFAULT mb-2"></div>
              <p className="text-body font-medium text-neutral-black">Focus Trap</p>
              <p className="text-body-sm text-neutral-gray-medium">
                Tab key cycles within modal, can't escape
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-critical-DEFAULT mb-2"></div>
              <p className="text-body font-medium text-neutral-black">Pointer Block</p>
              <p className="text-body-sm text-neutral-gray-medium">
                Clicks outside modal are blocked
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-success-DEFAULT mb-2"></div>
              <p className="text-body font-medium text-neutral-black">Auto Focus</p>
              <p className="text-body-sm text-neutral-gray-medium">
                First input automatically focused
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Render active modal */}
      {renderModal()}
    </div>
  );
};

export default TaskFocusedModalDemo;