'use client';

import { useState, useCallback } from 'react';

interface UseRegistrationPromptOptions {
  redirectUrl?: string;
  tripTitle?: string;
}

interface UseRegistrationPromptReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  redirectUrl?: string;
  tripTitle?: string;
}

/**
 * Hook to manage registration prompt modal state
 */
export function useRegistrationPrompt(
  options: UseRegistrationPromptOptions = {}
): UseRegistrationPromptReturn {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    open,
    close,
    redirectUrl: options.redirectUrl,
    tripTitle: options.tripTitle,
  };
}
