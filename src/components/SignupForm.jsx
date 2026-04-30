import React, { useState } from 'react';
import { 
  Eye, EyeOff, Loader2, AlertCircle, User, Mail, Lock, CheckCircle, ArrowRight 
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router';

const BRAND_COLOR = '#30c2b7';
const BRAND_DARK = '#26a39a';

const SignupForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    else if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Please enter a valid email address';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return;

  try {
    setIsSubmitting(true);

    const response = await axios.post('http://localhost:5001/signup', formData);

    console.log(response.data);
    setIsSuccess(true);
    navigate('/login');
  } catch (error) {
    console.error('Error creating account:', error);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <style>{`
        .text-brand { color: ${BRAND_COLOR}; }
        .bg-brand { background-color: ${BRAND_COLOR}; }
        .border-brand { border-color: ${BRAND_COLOR}; }
        .hover-brand:hover { background-color: ${BRAND_DARK}; }
        .card {
          background: white;
          border-radius: 1.5rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
        }
        .input-field {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }
        .input-field:focus {
          border-color: ${BRAND_COLOR};
          box-shadow: 0 0 0 3px rgba(48, 194, 183, 0.15);
        }
        .input-error {
          border-color: #ef4444;
          background-color: #fef2f2;
        }
        .input-error:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }
      `}</style>

      <div className="card w-full max-w-md p-8 relative overflow-hidden">
        {/* Decorative Background Blob */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Logo & Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg shadow-teal-500/20">
            A
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 mt-2 text-sm">Start your journey to financial freedom today.</p>
        </div>

        {isSuccess ? (
          /* Success State */
          <div className="text-center py-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Account Created!</h2>
            <p className="text-slate-500 text-sm mb-6">We've sent a verification link to <span className="font-semibold text-slate-700">{formData.email}</span>. Please check your inbox.</p>
            <button 
              onClick={() => window.location.href = '/dashboard'} 
              className="w-full py-3 bg-brand text-white rounded-xl font-semibold hover-brand shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
            >
              Go to Dashboard <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  autoComplete="name"
                  className={`input-field ${errors.name ? 'input-error' : ''}`}
                />
              </div>
              {errors.name && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.name}</p>}
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  autoComplete="email"
                  className={`input-field ${errors.email ? 'input-error' : ''}`}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.email}</p>}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className={`input-field pr-10 ${errors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.password}</p>}
            </div>

            {/* Terms & Submit */}
            <div className="pt-2">
              <p className="text-xs text-slate-500 mb-5 text-center">
                By creating an account, you agree to our <a href="#" className="text-brand hover:underline font-medium">Terms</a> and <a href="#" className="text-brand hover:underline font-medium">Privacy Policy</a>.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-brand text-white rounded-xl font-semibold hover-brand shadow-lg shadow-teal-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Creating account...</span>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 text-center relative z-10">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <a href="/login" className="text-brand font-semibold hover:underline transition-all">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;