import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md"
      >
        {/* Big 404 */}
        <div className="relative mb-6">
          <p className="text-[120px] font-black text-brand-100 leading-none select-none">404</p>
          <p className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-brand-600">
            Oops!
          </p>
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-2">Page not found</h1>
        <p className="text-text-muted mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft size={15} /> Go Back
          </button>
          <Link to="/" className="btn-primary flex items-center gap-2">
            <Home size={15} /> Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
