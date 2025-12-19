import React, { useState, useRef, useEffect } from 'react';
import Button from '../../components/Common/Button';

// 1. Define a strict interface for your form data
export interface PatientFormData {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  gender: 'M' | 'F' | 'Other';
}

interface PatientFormProps {
  // 2. Use the interface instead of 'any'
  onSubmit?: (data: PatientFormData) => void;
  initialData?: Partial<PatientFormData>;
}

function PatientForm({ onSubmit, initialData }: PatientFormProps) {
  const isInitialMount = useRef(true);
  const [formData, setFormData] = useState<PatientFormData>(() => ({
    name: initialData?.name ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    dateOfBirth: initialData?.dateOfBirth ?? '',
    address: initialData?.address ?? '',
    gender: initialData?.gender ?? 'M',
  }));

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (initialData) {
    //   setFormData((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  const inputStyles = "w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelStyles = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label className={labelStyles}>Full Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputStyles} required />
        </div>

        {/* Email */}
        <div>
          <label className={labelStyles}>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputStyles} required />
        </div>

        {/* Phone - Added missing field */}
        <div>
          <label className={labelStyles}>Phone Number</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputStyles} />
        </div>

        {/* Gender - Added missing field */}
        <div>
          <label className={labelStyles}>Gender</label>
          <select name="gender" value={formData.gender} onChange={handleChange} className={inputStyles}>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Address - Added missing field */}
      <div>
        <label className={labelStyles}>Address</label>
        <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputStyles} />
      </div>

      <div>
        <Button type="submit" variant="primary" className="w-full">
          {initialData ? 'Update Patient' : 'Register Patient'}
        </Button>
      </div>
    </form>
  );
}

export default PatientForm;