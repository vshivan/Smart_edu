import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | failed

  const orderId = params.get('order_id');

  useEffect(() => {
    if (!orderId) { setStatus('failed'); return; }

    api.post('/payments/verify', { order_id: orderId })
      .then(() => {
        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 3000);
      })
      .catch(() => setStatus('failed'));
  }, [orderId]);

  return (
    <div className="min-h-screen bg-surface dark:bg-dark-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm"
      >
        {status === 'verifying' && (
          <>
            <Loader2 size={48} className="text-brand-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-text-primary dark:text-white">Verifying payment...</h2>
            <p className="text-text-muted mt-2 text-sm">Please wait, do not close this page.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-text-primary dark:text-white">Payment Successful!</h2>
            <p className="text-text-muted mt-2 text-sm">Redirecting to your dashboard...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={40} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-text-primary dark:text-white">Payment Failed</h2>
            <p className="text-text-muted mt-2 text-sm mb-6">Something went wrong. Your card was not charged.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate(-1)} className="btn-secondary text-sm">Try Again</button>
              <Link to="/dashboard" className="btn-primary text-sm">Go to Dashboard</Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
