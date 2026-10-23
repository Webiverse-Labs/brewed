import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Page from "../../components/layout/Page.jsx";
import CafeCard from "../../components/cafe/CafeCard.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import LoadError from "../../components/ui/LoadError.jsx";
import Loader from "../../components/ui/Loader.jsx";
import NotFoundPage from "../NotFoundPage.jsx";
import { useApi } from "../../hooks/useApi.js";
import { cafeSections } from "../../lib/cafeSections.js";

// "See all" destination for a home row: every café in that section as a grid of tiles.
function SectionTiles({ title, description, query }) {
  // 100 is the API's maximum page size
  const { data, loading, error, reload } = useApi(`/cafes?${query}&limit=100`);
  const cafes = data?.cafes ?? [];

  let body;
  if (loading && !data) body = <Loader />;
  else if (error) body = <LoadError message={error} onRetry={reload} />;
  else if (!cafes.length) body = <EmptyState>No cafés here yet.</EmptyState>;
  else {
    body = (
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cafes.map((cafe) => (
          <li key={cafe.id} className="flex">
            <CafeCard cafe={cafe} fluid />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Page>
      <Link
        to="/"
        className="inline-flex items-center gap-1 rounded-full text-sm text-secondary transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <ChevronLeft size={16} /> Home
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h1 className="font-display text-[32px] leading-tight font-medium md:text-[40px]">{title}</h1>
          <p className="mt-1 text-[15px] text-secondary">{description}</p>
        </div>
        {cafes.length > 0 && (
          <p className="text-sm tabular-nums text-secondary">
            {cafes.length} {cafes.length === 1 ? "café" : "cafés"}
          </p>
        )}
      </div>
      <div className="mt-8">{body}</div>
    </Page>
  );
}

function CafeSectionPage() {
  const { section } = useParams();
  const config = Object.hasOwn(cafeSections, section) ? cafeSections[section] : null;
  if (!config) return <NotFoundPage />;
  // keyed so switching sections starts fresh instead of briefly showing the previous list
  return <SectionTiles key={section} {...config} />;
}

export default CafeSectionPage;
