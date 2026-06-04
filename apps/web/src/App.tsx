import { RequireAuth } from "@garden/auth";
import { useGarden } from "@garden/shared-state";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { LandingPage } from "./pages/LandingPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ReviewPage } from "./pages/ReviewPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UniversalObjectPage } from "./pages/UniversalObjectPage";
import { WeeklyReviewPage } from "./pages/WeeklyReviewPage";

const TrainRoutes = lazy(() => import("@garden/module-train").then((module) => ({ default: module.TrainRoutes })));
const ThinkRoutes = lazy(() => import("@garden/module-think").then((module) => ({ default: module.ThinkRoutes })));
const WorkRoutes = lazy(() => import("@garden/module-work").then((module) => ({ default: module.WorkRoutes })));
const EatRoutes = lazy(() => import("@garden/module-eat").then((module) => ({ default: module.EatRoutes })));

const LoadingModule = () => <p className="py-14 text-sm text-muted">Opening module...</p>;

const PrivateRoutes = () => {
  const { data, ready } = useGarden();
  const location = useLocation();
  if (!ready) return <p className="py-14 text-sm text-muted">Preparing your Garden...</p>;
  if (!data.profile.onboardingComplete && location.pathname !== "/onboarding") {
    return <Navigate replace to="/onboarding" />;
  }
  return (
    <Suspense fallback={<LoadingModule />}>
      <Routes>
        <Route path="/today" element={<Navigate replace to="/work" />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/train/*" element={<TrainRoutes />} />
        <Route path="/think/*" element={<ThinkRoutes />} />
        <Route path="/work/*" element={<WorkRoutes />} />
        <Route path="/objects/:kind/:id" element={<UniversalObjectPage />} />
        <Route path="/eat/*" element={<EatRoutes />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/weekly-review" element={<WeeklyReviewPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate replace to="/work" />} />
      </Routes>
    </Suspense>
  );
};

export const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LandingPage />} />
    <Route
      path="*"
      element={
        <RequireAuth>
          <AppShell>
            <PrivateRoutes />
          </AppShell>
        </RequireAuth>
      }
    />
  </Routes>
);
