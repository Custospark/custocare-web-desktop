import { useState, useEffect } from 'react';

export function useTimeAgo(lastSaved: Date | null) {
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);

  useEffect(() => {
    if (!lastSaved) return;

    const update = () => {
      setSecondsAgo(Math.round((Date.now() - lastSaved.getTime()) / 1000));
    };

    update(); // update immediately
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [lastSaved]);

  return secondsAgo;
}
