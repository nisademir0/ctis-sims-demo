import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

/**
 * Loading spinner component
 */
export default function Loader({ 
  size = 'md', 
  variant = 'primary',
  fullScreen = false,
  text,
  className 
}) {
  const { t } = useTranslation();
  const loadingText = text || t('common.loading');
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const variants = {
    primary: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  const spinner = (
    <div className={clsx('flex flex-col items-center justify-center', className)}>
      <svg
        className={clsx(
          'animate-spin',
          sizes[size],
          variants[variant]
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {loadingText && (
        <p className={clsx('mt-2 text-sm', variants[variant])}>
          {loadingText}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 dark:bg-gray-800">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Skeleton loader for content placeholders
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={clsx('animate-pulse bg-gray-200 rounded', className)}
      {...props}
    />
  );
}

/**
 * Table skeleton loader
 */
export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card skeleton loader
 */
export function CardSkeleton({ count = 1 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6 space-y-4 dark:bg-gray-800">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
