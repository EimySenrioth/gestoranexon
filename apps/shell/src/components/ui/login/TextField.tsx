"use client";

import React from "react";

interface TextFieldProps {
  id: string;
  label: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  autoComplete?: string;
  className?: string;
}

export function TextField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  autoComplete,
  className = "",
}: TextFieldProps) {
  return (
    <div className={`ui-text-field ${className}`}>
      <label htmlFor={id} className="ui-text-field__label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        className="ui-text-field__input"
      />
    </div>
  );
}
