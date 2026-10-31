import { createContext, createElement, useCallback, useContext, useState } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    title: 'Confirm action',
    message: '',
    confirm_label: 'Confirm',
    cancel_label: 'Cancel',
    on_confirm: null,
  });

  const open_confirm = useCallback(
    ({ title = 'Confirm action', message, on_confirm, confirm_label = 'Confirm', cancel_label = 'Cancel' }) => {
      setState({ open: true, title, message, on_confirm, confirm_label, cancel_label });
    },
    []
  );

  const close_confirm = useCallback(() => {
    setState((current) => ({ ...current, open: false, on_confirm: null }));
  }, []);

  const handle_confirm = useCallback(() => {
    const handler = state.on_confirm;
    if (handler) {
      handler();
    }
    close_confirm();
  }, [state.on_confirm, close_confirm]);

  const value = {
    ...state,
    open_confirm,
    close_confirm,
    confirm: handle_confirm,
  };

  return createElement(ConfirmContext.Provider, { value }, children);
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
