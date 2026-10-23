function CoffeeBean({ filled = true, size = 16, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g transform="rotate(35 12 12)">
        {filled ? (
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M12 2C16 2 19 6.5 19 12S16 22 12 22 5 17.5 5 12 8 2 12 2Z M13.3 3.4C9.2 8.1 15.5 15.3 10.7 20.6C13 15 6.8 8.1 13.3 3.4Z"
          />
        ) : (
          <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <ellipse cx="12" cy="12" rx="7" ry="10" />
            <path d="M13.3 3.4C8.3 8.1 14.6 15.3 10.7 20.6" />
          </g>
        )}
      </g>
    </svg>
  );
}

export default CoffeeBean;
