import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { LayoutDashboard } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl font-black text-indigo-600 dark:text-indigo-400 mb-2">404</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Page Not Found</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        The route you are trying to access does not exist or has been relocated.
      </p>
      <Link to="/">
        <Button variant="primary" icon={<LayoutDashboard size={16} />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;