import { useOutletContext } from "react-router-dom";
import Page from "../../components/layout/Page.jsx";
import CafeRow from "../../components/cafe/CafeRow.jsx";
import { cafes, currentUser } from "../../data/mock.js";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

function HomePage() {
  const { openExplore } = useOutletContext();

  // TODO(api): GET /api/cafes?sort=popular | ?featured=true | ?sort=rating | ?sort=new
  const active = cafes.filter((c) => c.active);
  const rows = [
    { title: "Popular Cafés", cafes: active },
    { title: "Featured Cafés", cafes: active.filter((c) => c.featured) },
    { title: "Top Rated", cafes: [...active].sort((a, b) => b.rating - a.rating) },
    { title: "Recently Added", cafes: [...active].reverse() },
  ];

  return (
    <Page className="overflow-x-clip">
      <p className="text-[15px] text-secondary">{greeting()}</p>
      <h1 className="mt-1 font-display text-[32px] leading-tight font-medium md:text-[40px]">
        What will you discover today?
      </h1>
      <div className="mt-10 flex flex-col gap-10">
        {rows.map((row) => (
          <CafeRow key={row.title} title={row.title} cafes={row.cafes} savedIds={currentUser.favorites} onSeeAll={openExplore} />
        ))}
      </div>
    </Page>
  );
}

export default HomePage;
