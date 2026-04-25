import { motion } from 'framer-motion';

/**
 * Wraps page content with a smooth fade+slide-up entrance animation.
 * Use around each page's root element, or wrap <Outlet /> in layouts.
 */
export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
