interface GoogleCalendarIconProps {
  className?: string;
}

export function GoogleCalendarIcon({ className = "h-4 w-4" }: GoogleCalendarIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Calendar background */}
      <path
        d="M18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4Z"
        fill="#FFFFFF"
        stroke="#E0E0E0"
        strokeWidth="0.5"
      />
      {/* Top bar - Blue */}
      <path
        d="M4 8H20V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V8Z"
        fill="#4285F4"
      />
      {/* Calendar rings */}
      <rect x="7" y="2" width="2" height="4" rx="1" fill="#4285F4" />
      <rect x="15" y="2" width="2" height="4" rx="1" fill="#4285F4" />
      {/* Grid - Red square */}
      <rect x="6" y="10" width="4" height="3" fill="#EA4335" />
      {/* Grid - Yellow square */}
      <rect x="10" y="10" width="4" height="3" fill="#FBBC04" />
      {/* Grid - Green square */}
      <rect x="14" y="10" width="4" height="3" fill="#34A853" />
      {/* Grid - Blue square */}
      <rect x="6" y="13" width="4" height="3" fill="#4285F4" />
      {/* Grid - Light gray */}
      <rect x="10" y="13" width="4" height="3" fill="#E0E0E0" />
      {/* Grid - Yellow */}
      <rect x="14" y="13" width="4" height="3" fill="#FBBC04" />
      {/* Grid - Green */}
      <rect x="6" y="16" width="4" height="3" fill="#34A853" />
      {/* Grid - Blue */}
      <rect x="10" y="16" width="4" height="3" fill="#4285F4" />
      {/* Grid - Red */}
      <rect x="14" y="16" width="4" height="3" fill="#EA4335" />
    </svg>
  );
}
