import { useLocation } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import Page from "../../components/layout/Page.jsx";
import Button from "../../components/ui/Button.jsx";

function LogSuccessPage() {
  const { state } = useLocation();
  const published = state?.type === "review";

  return (
    <Page className="flex min-h-[75vh] flex-col items-center justify-center text-center">
      <span className="grid size-16 place-items-center rounded-full bg-neutral-100 text-secondary">
        <CircleCheck size={30} strokeWidth={1.75} />
      </span>
      <h1 className="mt-5 font-display text-[28px] font-medium">Visit logged!</h1>
      <p className="mt-2 text-[15px] text-secondary">
        {published ? "Your review has been published." : "Your diary entry has been saved."}
      </p>
      <Button to="/" shape="pill" className="mt-6">
        Back to Home
      </Button>
    </Page>
  );
}

export default LogSuccessPage;
