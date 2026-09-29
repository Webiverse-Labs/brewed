import { useOutletContext } from "react-router-dom";
import Page from "../../components/layout/Page.jsx";
import CafeRow from "../../components/cafe/CafeRow.jsx";
import LoadError from "../../components/ui/LoadError.jsx";
import Loader from "../../components/ui/Loader.jsx";
import { useApi } from "../../hooks/useApi.js";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const rows = [
  { title: "Popular Cafés", path: "/cafes?sort=popular&limit=12" },
  { title: "Featured Cafés", path: "/cafes?featured=true&limit=12" },
  { title: "Top Rated", path: "/cafes?sort=rating&limit=12" },
  { title: "Recently Added", path: "/cafes?sort=new&limit=12" },
];

// one request per row, so each section loads (or fails) on its own
function HomeRow({ title, path, onSeeAll }) {
  const { data, loading, error, reload } = useApi(path);

  if (loading && !data) return <Loader />;
  if (error) return <LoadError message={error} onRetry={reload} />;
  if (!data.cafes.length) return null;
  return <CafeRow title={title} cafes={data.cafes} onSeeAll={onSeeAll} />;
}

function HomePage() {
  const { openExplore } = useOutletContext();

  return (
    <Page className="overflow-x-clip">
      <p className="text-[15px] text-secondary">{greeting()}</p>
      <h1 className="mt-1 font-display text-[32px] leading-tight font-medium md:text-[40px]">
        What will you discover today?
      </h1>
      <div className="mt-10 flex flex-col gap-10">
        {rows.map((row) => (
          <HomeRow key={row.title} {...row} onSeeAll={openExplore} />
        ))}
      </div>
    </Page>
  );
}

export default HomePage;
