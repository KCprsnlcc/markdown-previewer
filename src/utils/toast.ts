import { toast, ToastOptions } from 'react-toastify';

// Default toast configuration
const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

/**
 * Show a success toast notification
 */
export const showSuccess = (message: string, options?: ToastOptions) => {
  return toast.success(message, { ...defaultOptions, ...options });
};

/**
 * Show an error toast notification
 */
export const showError = (message: string, options?: ToastOptions) => {
  return toast.error(message, { ...defaultOptions, ...options });
};

/**
 * Show an info toast notification
 */
export const showInfo = (message: string, options?: ToastOptions) => {
  return toast.info(message, { ...defaultOptions, ...options });
};

/**
 * Show a warning toast notification
 */
export const showWarning = (message: string, options?: ToastOptions) => {
  return toast.warning(message, { ...defaultOptions, ...options });
};

/**
 * Process authentication errors and show appropriate toast notifications
 */
export const handleAuthError = (error: any) => {
  if (!error) return;
  
  let message = 'An unexpected error occurred';
  
  if (typeof error === 'string') {
    message = error;
  } else if (error.message) {
    if (error.message.includes('rate limit')) {
      message = 'Too many attempts. Please try again later.';
    } else if (error.message.includes('Invalid login credentials')) {
      message = 'Invalid email or password.';
    } else if (error.message.includes('already registered')) {
      message = 'This email is already registered. Please sign in instead.';
    } else {
      message = error.message;
    }
  }
  
  showError(message);
  return message;
};
