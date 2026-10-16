import React from "react";

interface GoogleIconProps {
  className?: string;
  size?: number;
}

export function GoogleIcon({ className, size = 48 }: GoogleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="var(--ui-brand-google-blue, #4285F4)"
        d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"
      />
      <path
        fill="var(--ui-brand-google-green, #34A853)"
        d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13.5 24 13.5c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.3 6.3 14.7z"
      />
      <path
        fill="var(--ui-brand-google-yellow, #FBBC05)"
        d="M24 46c5.5 0 10.4-1.9 14.2-5.2l-6.6-5.4c-2.1 1.4-4.7 2.2-7.6 2.2-6 0-10.6-3.1-11.8-8.5l-6.6 5.1C9 40.4 15.9 46 24 46z"
      />
      <path
        fill="var(--ui-brand-google-red, #EA4335)"
        d="M44.5 20H24v8.5h11.8c-.8 2.5-2.4 4.6-4.6 6.1l6.6 5.4c4.3-4 6.7-9.8 6.7-16 0-1.3-.2-2.7-.5-4z"
      />
    </svg>
  );
}
