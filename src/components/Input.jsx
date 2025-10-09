import React from "react";

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  className = "",
}) {
  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && (
        <label
          className="text-gray-700 font-medium mb-2 text-sm sm:text-base"
          htmlFor={label}
        >
          {label}
        </label>
      )}

      <input
        id={label}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`
          w-full p-3 sm:p-4 rounded-xl border border-gray-300
          text-gray-800 placeholder-gray-400
          focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200
          outline-none transition
          text-sm sm:text-base
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
        `}
      />
    </div>
  );
}
