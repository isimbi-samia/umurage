import React, { useEffect, useState } from 'react';

const InstallPrompt: React.FC = () => {
  const [deferred, setDeferred] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const d = (window as any).__deferredInstallPrompt;
    if (d) {
      setDeferred(d);
      setShow(true);
    }
    const handler = (e: any) => {
      (window as any).__deferredInstallPrompt = e;
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  const onInstall = async () => {
    if (!deferred) return;
    deferred.prompt();
    const choice = await deferred.userChoice;
    setShow(false);
    (window as any).__deferredInstallPrompt = null;
    return choice;
  };

  if (!show) return null;
  return (
    <button onClick={onInstall} className="hidden sm:inline-flex items-center gap-2 btn-outline-gold text-xs py-2 px-3">
      Install
    </button>
  );
};

export default InstallPrompt;
