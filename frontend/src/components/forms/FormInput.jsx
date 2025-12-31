import { clsx } from 'clsx';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

/**
 * Form Input component
 */
export default function FormInput({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  helperText,
  icon,
  className,
  inputClassName,
  register, // React Hook Form register function (optional)
  ...props
}) {
  // Support two usage patterns:
  // 1. register={register} name="field" - register is function
  // 2. {...register('field')} - register result already spread in props
  const registerProps = register && typeof register === 'function' ? register(name) : {};
  
  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
          {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          id={name}
          disabled={disabled}
          placeholder={placeholder}
          data-testid={`${name}-input`}
          className={clsx(
            'block w-full rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
            icon && 'pl-10',
            error
              ? 'border-red-300 dark:border-red-600 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500',
            disabled && 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed',
            inputClassName
          )}
          {...registerProps}
          {...props}
        />
        
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400" />
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <p className={clsx(
          'mt-1 text-sm',
          error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
        )}>
          {error?.message || error || helperText}
        </p>
      )}
    </div>
  );
}

/**
 * Form Textarea component
 */
export function FormTextarea({
  label,
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  rows = 4,
  helperText,
  className,
  register, // React Hook Form register function
  ...props
}) {
  const inputProps = register ? register(name) : { value, onChange, onBlur };
  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
          {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        id={name}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        className={clsx(
          'block w-full rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
          error
            ? 'border-red-300 dark:border-red-600 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500',
          disabled && 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
        )}
        {...registerProps}
        {...props}
      />
      
      {(error || helperText) && (
        <p className={clsx(
          'mt-1 text-sm',
          error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
        )}>
          {error?.message || error || helperText}
        </p>
      )}
    </div>
  );
}

/**
 * FormSelect Component
 */
export function FormSelect({
  label,
  name,
  options = [],
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  placeholder,
  helperText,
  className,
  register, // React Hook Form register function (optional)
  ...props
}) {
  const { t } = useTranslation();
  const selectPlaceholder = placeholder || t('other.seciniz');
  const registerProps = register && typeof register === 'function' ? register(name) : {};
  
  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
          {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <select
        id={name}
        disabled={disabled}
        className={clsx(
          'block w-full rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
          error
            ? 'border-red-300 dark:border-red-600 text-red-900 dark:text-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500',
          disabled && 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
        )}
        {...registerProps}
        {...props}
      >
        {selectPlaceholder && (
          <option value="">{selectPlaceholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {(error || helperText) && (
        <p className={clsx(
          'mt-1 text-sm',
          error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
        )}>
          {error?.message || error || helperText}
        </p>
      )}
    </div>
  );
}

/**
 * Form Checkbox component
 */
export function FormCheckbox({
  label,
  name,
  checked,
  onChange,
  disabled = false,
  error,
  helperText,
  className,
  ...props
}) {
  return (
    <div className={className}>
      <div className="flex items-start">
        <input
          type="checkbox"
          id={name}
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={clsx(
            'h-4 w-4 rounded',
            error
              ? 'text-red-600 border-red-300 focus:ring-red-500'
              : 'text-blue-600 border-gray-300 focus:ring-blue-500',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          {...props}
        />
        {label && (
          <label 
            htmlFor={name} 
            className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
          >
            {label}
          </label>
        )}
      </div>
      
      {(error || helperText) && (
        <p className={clsx(
          'mt-1 text-sm',
          error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}
