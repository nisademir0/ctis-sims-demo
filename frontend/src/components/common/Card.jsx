import { clsx } from 'clsx';

/**
 * Reusable Card component
 */
export default function Card({ 
  children, 
  title, 
  subtitle,
  headerAction,
  footer,
  padding = true,
  hoverable = false,
  className,
  ...props 
}) {
  return (
    <div 
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50',
        hoverable && 'transition-shadow hover:shadow-lg dark:hover:shadow-gray-900/70',
        className
      )}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
              )}
            </div>
            {headerAction && (
              <div className="ml-4 flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={clsx(padding && 'px-6 py-4')}>
        {children}
      </div>

      {footer && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
}
