import { useGoogleAuth } from './GoogleAuthContext';
import type { CSSProperties, ReactNode } from 'react';

interface GoogleSignInButtonProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  variant?: 'default' | 'outline' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  disabled?: boolean;
}

const GoogleIcon = () => (
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 18 18" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" 
      fill="#4285F4"
    />
    <path 
      d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.26c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9.003 18z" 
      fill="#34A853"
    />
    <path 
      d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" 
      fill="#FBBC05"
    />
    <path 
      d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.48 0 2.438 2.017.956 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z" 
      fill="#EA4335"
    />
  </svg>
);

const baseStyles: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontWeight: 500,
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  border: 'none',
  outline: 'none',
};

const variantStyles: Record<string, CSSProperties> = {
  default: {
    backgroundColor: '#ffffff',
    color: '#3c4043',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
  },
  outline: {
    backgroundColor: 'transparent',
    color: '#3c4043',
    border: '1px solid #dadce0',
  },
  minimal: {
    backgroundColor: 'transparent',
    color: '#1a73e8',
  },
};

const sizeStyles: Record<string, CSSProperties> = {
  sm: {
    padding: '6px 12px',
    fontSize: '13px',
  },
  md: {
    padding: '10px 16px',
    fontSize: '14px',
  },
  lg: {
    padding: '12px 24px',
    fontSize: '16px',
  },
};

export function GoogleSignInButton({
  className,
  style,
  children,
  variant = 'default',
  size = 'md',
  showIcon = true,
  disabled = false,
}: GoogleSignInButtonProps) {
  const { login, isLoading } = useGoogleAuth();

  const handleClick = () => {
    if (!disabled && !isLoading) {
      login();
    }
  };

  const combinedStyle: CSSProperties = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
    ...style,
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={className}
      style={combinedStyle}
      data-testid="button-google-signin"
    >
      {showIcon && <GoogleIcon />}
      {children || 'Sign in with Google'}
    </button>
  );
}
