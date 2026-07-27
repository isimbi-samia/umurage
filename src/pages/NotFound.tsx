import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center text-center p-8">
      <div>
        <div className="text-8xl mb-6">🦣</div>
        <h1 className="font-cinzel text-umurage-gold text-4xl font-bold mb-4">404</h1>
        <h2 className="text-umurage-cream text-xl font-semibold mb-3">Page Not Found</h2>
        <p className="text-umurage-muted mb-8 max-w-sm mx-auto">
          This page doesn't exist in our cultural library yet. Let's take you back home.
        </p>
        <button onClick={() => navigate('/')} className="btn-gold px-8 py-3">
          Return Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
