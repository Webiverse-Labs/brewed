import { Outlet } from "react-router-dom";
import CoffeeBean from "../ui/CoffeeBean.jsx";
import Logo from "../ui/Logo.jsx";

const bullets = ["Discover & rate cafés", "Log every visit", "Track your coffee history"];

// Figma `LandingPage`: shared hero on the left, the route's form card on the right.
function AuthLayout() {
  return (
    <div className="mx-auto grid min-h-screen max-w-[1024px] content-center items-center gap-10 px-5 py-10 md:grid-cols-[1fr_340px] md:gap-16 md:px-12">
      <div className="text-center md:text-left">
        <h1 className="mx-auto max-w-[440px] font-display text-[40px] leading-[1.1] font-medium md:mx-0 md:text-[64px]">
          {/* Line breaks pinned on desktop to match the Figma wrap */}
          Every cup <br className="hidden md:block" />
          <em>deserves</em> to <br className="hidden md:block" />
          be remembered.
        </h1>
        <p className="mx-auto mt-5 max-w-sm text-[17px] leading-relaxed text-secondary md:mx-0 md:mt-8">
          Brewed is your personal café diary. Discover extraordinary cafés, log your visits, and track a lifetime of
          coffee memories.
        </p>
        <ul className="mt-10 hidden flex-col gap-3 md:flex">
          {bullets.map((text) => (
            <li key={text} className="flex items-center gap-3 text-[15px]">
              <CoffeeBean size={14} />
              {text}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col items-center gap-8">
        <div className="w-full max-w-[400px] rounded-3xl border border-base-300 bg-surface p-7 shadow-soft">
          <Outlet />
        </div>
        <Logo size="lg" />
      </div>
    </div>
  );
}

export default AuthLayout;
