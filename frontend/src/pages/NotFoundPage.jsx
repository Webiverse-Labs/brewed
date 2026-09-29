import Button from "../components/ui/Button.jsx";
import CoffeeBean from "../components/ui/CoffeeBean.jsx";

function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <CoffeeBean size={32} filled={false} className="text-muted" />
      <h1 className="mt-4 font-display text-[28px] font-medium">Nothing brewing here</h1>
      <p className="mt-2 text-[15px] text-secondary">The page you're looking for doesn't exist.</p>
      <Button to="/" shape="pill" className="mt-6">
        Back to Home
      </Button>
    </div>
  );
}

export default NotFoundPage;
