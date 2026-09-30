import Button from "./Button.jsx";

// Shown when a request fails; `onRetry` usually comes from useApi's reload.
function LoadError({ message, onRetry }) {
  return (
    <div className="rounded-box border border-dashed border-base-300 px-6 py-12 text-center">
      <p className="text-[15px] text-secondary">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" shape="pill" onClick={onRetry} className="mt-4">
          Try again
        </Button>
      )}
    </div>
  );
}

export default LoadError;
