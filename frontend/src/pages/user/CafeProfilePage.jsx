import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Clock, MapPin } from "lucide-react";
import BeanRating from "../../components/ui/BeanRating.jsx";
import BookmarkBtn from "../../components/ui/BookmarkBtn.jsx";
import Button from "../../components/ui/Button.jsx";
import CoffeeBean from "../../components/ui/CoffeeBean.jsx";
import InfoCard from "../../components/cafe/InfoCard.jsx";
import InfoRow from "../../components/cafe/InfoRow.jsx";
import RatingBreakdown from "../../components/cafe/RatingBreakdown.jsx";
import ReviewCard from "../../components/cafe/ReviewCard.jsx";
import NotFoundPage from "../NotFoundPage.jsx";
import { currentUser, getCafe, logs } from "../../data/mock.js";

function CafeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const cafe = getCafe(id);

  if (!cafe) return <NotFoundPage />;

  // TODO(api): GET /api/cafes/:id and /api/cafes/:id/logs (public reviews only)
  const reviews = logs.filter((l) => l.cafeId === cafe.id && l.type === "review");
  // "default" means the page was opened directly, so there is no in-app history to go back to.
  const goBack = () => (location.key === "default" ? navigate("/") : navigate(-1));

  return (
    <>
      <section className="relative h-[320px] overflow-hidden bg-primary md:h-[384px]">
        {cafe.photo ? (
          <img src={cafe.photo} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-white/10">
            <CoffeeBean size={180} filled={false} />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-black/10" />

        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="absolute top-5 left-5 grid size-9 place-items-center rounded-full bg-black/30 text-white backdrop-blur hover:bg-black/45 md:top-20 md:left-10"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-5 pb-8 md:px-10">
          <div className="min-w-0 text-white">
            <h1 className="font-display text-[32px] leading-tight font-medium md:text-[40px]">{cafe.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-[15px] text-white/85">
              <MapPin size={15} /> {cafe.area}
            </p>
            <BeanRating value={cafe.rating} size={16} className="mt-3" />
          </div>
          <BookmarkBtn onDark size="lg" defaultActive={currentUser.favorites.includes(cafe.id)} />
        </div>
      </section>

      <div className="mx-auto grid max-w-[1024px] gap-8 px-5 py-8 md:grid-cols-[292px_1fr] md:px-10">
        <aside className="flex flex-col gap-4">
          <InfoCard title="About">
            <p className="text-[15px] leading-relaxed">{cafe.description}</p>
          </InfoCard>
          <InfoCard title="Details">
            <div className="flex flex-col gap-3">
              <InfoRow icon={MapPin}>{cafe.address}</InfoRow>
              <InfoRow icon={Clock}>{cafe.hours}</InfoRow>
            </div>
          </InfoCard>
          <InfoCard title="Community Ratings">
            <RatingBreakdown average={cafe.rating} counts={cafe.ratingCounts} />
          </InfoCard>
        </aside>

        <section>
          <h2 className="mb-4 font-display text-2xl font-medium">Diary Entries & Reviews</h2>
          {reviews.length > 0 ? (
            <div className="flex flex-col gap-4">
              {reviews.map((log) => (
                <ReviewCard key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <div className="rounded-box border border-dashed border-base-300 px-6 py-12 text-center">
              <p className="text-[15px] text-secondary">No public reviews yet.</p>
              <Button to="/log" shape="pill" size="sm" className="mt-4">
                Be the first to log a visit
              </Button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default CafeProfilePage;
