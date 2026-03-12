// src/components/SalesInputField.tsx
interface SalesInputFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'textarea';
  required?: boolean;
  icon?: any;
}

export default function SalesInputField({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  required = false,
  icon
}: SalesInputFieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        <div className="flex items-center">
          {icon && typeof icon !== 'undefined' && icon !== null ? (
            <span className="mr-2">{icon}</span>
          ) : null}
          <span>{label}</span>
          {required && <span className="text-red-500 ml-1">*</span>}
        </div>
      </label>
      {type === 'textarea' ? (
        <textarea
          className="w-full p-2 border border-gray-300 rounded"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          maxLength={200}
        />
      ) : (
        <input
          type={type}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}