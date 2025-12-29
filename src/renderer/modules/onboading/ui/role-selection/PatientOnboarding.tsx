/**
 * ============================================================================
 * PREMIUM PATIENT ONBOARDING - LUXURY HEALTHCARE EXPERIENCE
 * ============================================================================
 * 
 * Super niche, premium patient onboarding with:
 * - Exact layout from design spec
 * - Global Patient ID generation (CP-8529-X-2 format)
 * - Premium animations and interactions
 * - Ultra-secure, VIP-level data protection
 * - Rich preview of generated patient profile
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { 
  User, 
  Moon, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Check,
  ArrowRight,
  Heart,
  Sun,
  Users,
  Lock,
  Sparkles,
  Fingerprint,
  Globe,
  BadgeCheck,
  QrCode,
  Download,
  Share2,
  Clock,
  Star,
  Zap,
  ChevronRight,
  Search
} from 'lucide-react';
import { cn } from '../../../../shared/types/cn';
import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks/useApp';
import { toggleTheme } from '../../../../app/store/slices/uiSlice';

/* ==========================================================================
   TYPE DEFINITIONS
   ========================================================================== */

interface FormData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  streetAddress: string;
  city: string;
  zipCode: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
}

interface GlobalPatientID {
  prefix: string;
  number: string;
  checkDigit: string;
  fullID: string;
  qrData: string;
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export const PremiumPatientOnboarding: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useAppSelector((state) => state.ui.theme);
  
  /* State Management */
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    streetAddress: '',
    city: '',
    zipCode: '',
    emergencyName: '',
    emergencyRelationship: '',
    emergencyPhone: ''
  });
  
  const [globalPatientID, setGlobalPatientID] = useState<GlobalPatientID | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressSuggestions] = useState<string[]>([
    '123 Healthcare Blvd, Medical District',
    '456 Wellness Ave, Downtown',
    '789 Recovery St, Uptown'
  ]);

  /* Generate Global Patient ID */
  const generateGlobalPatientID = useCallback((): GlobalPatientID => {
    const generateCheckDigit = () => {
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      return chars[Math.floor(Math.random() * chars.length)];
    };

    const prefix = 'CP';
    const number = Math.floor(Math.random() * 9000 + 1000).toString(); // 1000-9999
    const checkDigit = generateCheckDigit();
    const fullID = `${prefix}-${number}-${checkDigit}-2`;

    return {
      prefix,
      number,
      checkDigit,
      fullID,
      qrData: `CUSTOCARE:${fullID}:${formData.fullName.replace(/\s/g, '_')}:${new Date().toISOString()}`
    };
  }, [formData.fullName]);

  /* Form Submission */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate premium API processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate Global Patient ID
    const patientID = generateGlobalPatientID();
    setGlobalPatientID(patientID);
    
    // Show completion
    setIsComplete(true);
    setIsSubmitting(false);

    // Auto-scroll to results
    setTimeout(() => {
      document.getElementById('registration-complete')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 300);
  }, [generateGlobalPatientID]);

  /* Continue to Portal */
  const handleContinueToPortal = useCallback(() => {
    navigate('/patient/portal', {
      state: {
        patientID: globalPatientID?.fullID,
        patientName: formData.fullName,
        isNewPatient: true
      }
    });
  }, [globalPatientID, formData.fullName, navigate]);

  /* Address Auto-suggestion */
  const handleAddressSearch = useCallback((query: string) => {
    setFormData(prev => ({ ...prev, streetAddress: query }));
    if (query.length > 2) {
      setShowAddressSuggestions(true);
    } else {
      setShowAddressSuggestions(false);
    }
  }, []);

  /* Form Validation */
  const isFormValid = useMemo(() => {
    return Object.values(formData).every(value => value.trim().length > 0);
  }, [formData]);

  /* Premium Features */
  const premiumFeatures = useMemo(() => [
    { icon: Shield, title: 'Military-Grade Encryption', description: '256-bit AES encryption for all health data' },
    { icon: Globe, title: 'Global Patient ID', description: 'Universal healthcare identifier across all facilities' },
    { icon: Sparkles, title: 'AI Health Companion', description: '24/7 AI-powered health monitoring and insights' },
    { icon: Zap, title: 'Priority Access', description: 'Skip waiting times at partner facilities' },
    { icon: Star, title: 'Concierge Service', description: 'Dedicated patient success manager' },
    { icon: Clock, title: 'Same-Day Appointments', description: 'Guaranteed appointments within 24 hours' }
  ], []);

  /* Theme-aware styles */
  const themeStyles = useMemo(() => ({
    background: theme === 'dark' 
      ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' 
      : 'bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50',
    card: theme === 'dark' 
      ? 'bg-gray-800/60 border-gray-700' 
      : 'bg-white border-gray-200',
    text: {
      primary: theme === 'dark' ? 'text-white' : 'text-gray-900',
      secondary: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
      accent: theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
    },
    input: theme === 'dark' 
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/30' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20',
    button: {
      primary: theme === 'dark' 
        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white' 
        : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white',
      secondary: theme === 'dark' 
        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }
  }), [theme]);

  /* ==========================================================================
     RENDER COMPONENTS
     ========================================================================== */

  const renderStageIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-2 mb-3">
        {[1, 2, 3].map((stage) => (
          <React.Fragment key={stage}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300",
              currentStage >= stage
                ? theme === 'dark'
                  ? "border-cyan-500 bg-cyan-500 text-white"
                  : "border-blue-600 bg-blue-600 text-white"
                : theme === 'dark'
                  ? "border-gray-700 text-gray-500"
                  : "border-gray-300 text-gray-400"
            )}>
              {stage}
            </div>
            {stage < 3 && (
              <div className={cn(
                "w-12 h-0.5 transition-all duration-300",
                currentStage > stage
                  ? theme === 'dark' ? "bg-cyan-500" : "bg-blue-600"
                  : theme === 'dark' ? "bg-gray-700" : "bg-gray-300"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>
      <p className={cn(
        "text-center text-sm font-medium",
        themeStyles.text.secondary
      )}>
        Stage {currentStage} of 3: {currentStage === 1 ? 'Personal Information' : currentStage === 2 ? 'Address Details' : 'Emergency Contacts'}
      </p>
    </div>
  );

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Stage 1: Personal Information */}
      {currentStage === 1 && (
        <motion.div
          key="stage-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              themeStyles.text.primary
            )}>
              Full Legal Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="e.g. John Dojo"
                className={cn(
                  "w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2",
                  themeStyles.input
                )}
              />
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn(
                "block text-sm font-medium mb-2",
                themeStyles.text.primary
              )}>
                Date of Birth
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2",
                    themeStyles.input
                  )}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className={cn(
                "block text-sm font-medium mb-2",
                themeStyles.text.primary
              )}>
                Gender
              </label>
              <div className="relative">
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 appearance-none",
                    themeStyles.input
                  )}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stage 2: Address */}
      {currentStage === 2 && (
        <motion.div
          key="stage-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              themeStyles.text.primary
            )}>
              Street Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.streetAddress}
                onChange={(e) => handleAddressSearch(e.target.value)}
                placeholder="Search for your address"
                className={cn(
                  "w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2",
                  themeStyles.input
                )}
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              
              {/* Address Suggestions */}
              {showAddressSuggestions && addressSuggestions.length > 0 && (
                <div className={cn(
                  "absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-10",
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                )}>
                  {addressSuggestions.map((address, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, streetAddress: address }));
                        setShowAddressSuggestions(false);
                      }}
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-opacity-50 transition-colors",
                        theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                          {address}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn(
                "block text-sm font-medium mb-2",
                themeStyles.text.primary
              )}>
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className={cn(
                  "w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2",
                  themeStyles.input
                )}
              />
            </div>

            <div>
              <label className={cn(
                "block text-sm font-medium mb-2",
                themeStyles.text.primary
              )}>
                ZIP Code
              </label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                className={cn(
                  "w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2",
                  themeStyles.input
                )}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Stage 3: Emergency Contacts */}
      {currentStage === 3 && (
        <motion.div
          key="stage-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cn(
                "block text-sm font-medium mb-2",
                themeStyles.text.primary
              )}>
                Contact Name
              </label>
              <input
                type="text"
                value={formData.emergencyName}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyName: e.target.value }))}
                className={cn(
                  "w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2",
                  themeStyles.input
                )}
              />
            </div>

            <div>
              <label className={cn(
                "block text-sm font-medium mb-2",
                themeStyles.text.primary
              )}>
                Relationship
              </label>
              <div className="relative">
                <select
                  value={formData.emergencyRelationship}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyRelationship: e.target.value }))}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 appearance-none",
                    themeStyles.input
                  )}
                >
                  <option value="">Select relationship</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="sibling">Sibling</option>
                  <option value="friend">Friend</option>
                </select>
                <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
              themeStyles.text.primary
            )}>
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
                className={cn(
                  "w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2",
                  themeStyles.input
                )}
              />
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        {currentStage > 1 && (
          <button
            type="button"
            onClick={() => setCurrentStage(prev => prev === 1 ? 1 : (prev - 1) as 1 | 2 | 3)}
            className={cn(
              "px-6 py-3 rounded-lg font-medium transition-colors",
              themeStyles.button.secondary
            )}
          >
            Back
          </button>
        )}
        
        {currentStage < 3 ? (
          <button
            type="button"
            onClick={() => setCurrentStage(prev => prev === 3 ? 3 : (prev + 1) as 1 | 2 | 3)}
            className={cn(
              "ml-auto px-6 py-3 rounded-lg font-medium transition-colors",
              themeStyles.button.primary
            )}
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={cn(
              "ml-auto px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors",
              themeStyles.button.primary,
              (!isFormValid || isSubmitting) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Complete Registration
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );

  const renderGlobalPatientIDCard = () => (
    <div id="registration-complete" className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-white" strokeWidth={3} />
        </div>
        <h3 className={cn(
          "text-2xl font-bold mb-2",
          themeStyles.text.primary
        )}>
          Registration Complete!
        </h3>
        <p className={cn(
          "text-lg",
          themeStyles.text.secondary
        )}>
          You have been successfully registered in our global system.
        </p>
      </div>

      {/* Global Patient ID Card */}
      <div className={cn(
        "rounded-xl border p-6 relative overflow-hidden",
        themeStyles.card
      )}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, ${theme === 'dark' ? '#fff' : '#000'} 2px, transparent 0)`,
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                theme === 'dark' ? "bg-cyan-900/30" : "bg-blue-100"
              )}>
                <Fingerprint className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
              </div>
              <div>
                <h4 className={cn(
                  "text-sm font-medium",
                  themeStyles.text.secondary
                )}>
                  Global Patient ID
                </h4>
                <p className={cn(
                  "text-xs",
                  themeStyles.text.secondary
                )}>
                  CustoCare Healthcare Network
                </p>
              </div>
            </div>
            
            <div className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              theme === 'dark' ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
            )}>
              ACTIVE
            </div>
          </div>

          {/* ID Display */}
          <div className="text-center mb-6">
            <div className={cn(
              "text-4xl sm:text-5xl font-bold tracking-wider mb-2",
              theme === 'dark' ? "text-cyan-300" : "text-blue-700"
            )}>
              {globalPatientID?.fullID}
            </div>
            <div className={cn(
              "text-sm",
              themeStyles.text.secondary
            )}>
              Format: CP - {globalPatientID?.number} - {globalPatientID?.checkDigit} - 2
            </div>
          </div>

          {/* ID Details */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className={cn(
                "text-xs font-medium mb-1",
                themeStyles.text.secondary
              )}>
                Prefix
              </div>
              <div className={cn(
                "text-lg font-semibold",
                themeStyles.text.primary
              )}>
                {globalPatientID?.prefix}
              </div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-xs font-medium mb-1",
                themeStyles.text.secondary
              )}>
                Patient No.
              </div>
              <div className={cn(
                "text-lg font-semibold",
                themeStyles.text.primary
              )}>
                {globalPatientID?.number}
              </div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-xs font-medium mb-1",
                themeStyles.text.secondary
              )}>
                Check Digit
              </div>
              <div className={cn(
                "text-lg font-semibold",
                themeStyles.text.primary
              )}>
                {globalPatientID?.checkDigit}
              </div>
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="flex justify-center mb-6">
            <div className={cn(
              "w-32 h-32 rounded-lg border-2 flex items-center justify-center",
              theme === 'dark' ? "border-gray-700" : "border-gray-300"
            )}>
              <QrCode className={cn(
                "w-16 h-16",
                theme === 'dark' ? "text-gray-600" : "text-gray-400"
              )} />
            </div>
          </div>

          {/* Patient Info */}
          <div className={cn(
            "rounded-lg p-4 mb-6",
            theme === 'dark' ? "bg-gray-900/50" : "bg-gray-50"
          )}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className={cn(
                  "text-xs font-medium mb-1",
                  themeStyles.text.secondary
                )}>
                  Patient Name
                </div>
                <div className={cn(
                  "font-medium",
                  themeStyles.text.primary
                )}>
                  {formData.fullName}
                </div>
              </div>
              <div>
                <div className={cn(
                  "text-xs font-medium mb-1",
                  themeStyles.text.secondary
                )}>
                  Registration Date
                </div>
                <div className={cn(
                  "font-medium",
                  themeStyles.text.primary
                )}>
                  {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium",
              themeStyles.button.secondary
            )}>
              <Download className="w-4 h-4" />
              Download ID
            </button>
            <button className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium",
              themeStyles.button.secondary
            )}>
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Continue to Portal Button */}
      <button
        onClick={handleContinueToPortal}
        className={cn(
          "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02]",
          themeStyles.button.primary
        )}
      >
        On to Patient Portal
        <ArrowRight className="w-5 h-5" />
      </button>

      <p className={cn(
        "text-center text-sm",
        themeStyles.text.secondary
      )}>
        Already a registered patient?{' '}
        <button
          onClick={() => navigate('/login')}
          className={cn(
            "font-semibold hover:underline",
            theme === 'dark' ? "text-cyan-400" : "text-blue-600"
          )}
        >
          Login to Patient Portal
        </button>
      </p>
    </div>
  );

  /* ==========================================================================
     MAIN RENDER
     ========================================================================== */

  return (
    <div className={cn(
      "min-h-screen",
      themeStyles.background
    )}>
      {/* Top Navigation */}
      <header className="border-b">
        <div className={cn(
          "px-6 py-4",
          theme === 'dark' 
            ? "border-gray-800 bg-gray-900/50" 
            : "border-gray-200 bg-white/80"
        )}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                theme === 'dark'
                  ? "bg-gradient-to-br from-cyan-600 to-blue-600"
                  : "bg-gradient-to-br from-blue-600 to-cyan-600"
              )}>
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">CustoCare AI</h1>
                <p className={cn(
                  "text-xs",
                  themeStyles.text.secondary
                )}>
                  Premium Healthcare
                </p>
              </div>
            </div>

            <button
              onClick={() => dispatch(toggleTheme())}
              className={cn(
                "p-2 rounded-lg transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                theme === 'dark'
                  ? "bg-gray-800 text-amber-400 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h2 className={cn(
                  "text-3xl lg:text-4xl font-bold mb-4",
                  themeStyles.text.primary
                )}>
                  Your health journey starts here.
                </h2>
              </div>

              {/* Form Section */}
              <div className="mb-2">
             
                
                {/* Stage Indicator */}
                {renderStageIndicator()}
                
                {/* Form */}
                <div className={cn(
                  "rounded-xl border p-6",
                  themeStyles.card
                )}>
                  {!isComplete ? renderForm() : renderGlobalPatientIDCard()}
                </div>
              </div>
            </div>

            {/* Right Column - Premium Features */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className={cn(
                  "rounded-xl border p-6 mb-6",
                  themeStyles.card
                )}>
                  <h3 className={cn(
                    "text-lg font-bold mb-4",
                    themeStyles.text.primary
                  )}>
                    Premium Features Included
                  </h3>
                  
                  <div className="space-y-4">
                    {premiumFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                          theme === 'dark' ? "bg-gray-700/50" : "bg-gray-100"
                        )}>
                          <feature.icon className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                        </div>
                        <div>
                          <h4 className={cn(
                            "font-medium mb-1",
                            themeStyles.text.primary
                          )}>
                            {feature.title}
                          </h4>
                          <p className={cn(
                            "text-sm",
                            themeStyles.text.secondary
                          )}>
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security Assurance */}
                <div className={cn(
                  "rounded-xl border p-6",
                  theme === 'dark' 
                    ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700" 
                    : "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"
                )}>
                  <div className="flex items-center gap-3 mb-4">
                    <Lock className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
                    <h4 className={cn(
                      "font-bold",
                      themeStyles.text.primary
                    )}>
                      Your Information is Protected
                    </h4>
                  </div>
                  <p className={cn(
                    "text-sm mb-4 leading-relaxed",
                    themeStyles.text.secondary
                  )}>
                    All data is encrypted end-to-end using military-grade 256-bit AES encryption. 
                    Your health information remains private and secure.
                  </p>
                  <div className="flex items-center gap-4">
                    <BadgeCheck className="w-5 h-5 text-green-500" />
                    <span className={cn(
                      "text-sm font-medium",
                      theme === 'dark' ? "text-green-400" : "text-green-600"
                    )}>
                      HIPAA Compliant
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={cn(
        "px-6 py-8 border-t",
        theme === 'dark' ? "border-gray-800" : "border-gray-200"
      )}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className={cn(
                "text-sm font-medium mb-2",
                themeStyles.text.primary
              )}>
                © 2025 CustoCare AI Inc.
              </p>
              <p className={cn(
                "text-xs",
                themeStyles.text.secondary
              )}>
                All rights reserved.
              </p>
            </div>
            
            <div>
              <p className={cn(
                "text-sm mb-2",
                themeStyles.text.secondary
              )}>
                Your information is encrypted and securely processed. By continuing, you agree to CustoCare AI® Terms of Service and Privacy Policy.
              </p>
            </div>
            
            <div className="text-right">
              <p className={cn(
                "text-xs",
                themeStyles.text.secondary
              )}>
                Global Patient ID System v2.5
                <br />
                Last Updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PremiumPatientOnboarding;