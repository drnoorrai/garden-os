import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ReviewPage } from "./pages/ReviewPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TodayPage } from "./pages/TodayPage";
import { WeeklyReviewPage } from "./pages/WeeklyReviewPage";

const TrainRoutes = lazy(() => import("@garden/module-train").then((module) => ({ default: module.TrainRoutes })));
const ThinkRoutes = lazy(() => import("@garden/module-think").then((module) => ({ default: module.ThinkRoutes })));
const WorkRoutes = lazy(() => import("@garden/module-work").then((module) => ({ default: module.WorkRoutes })));
const EatRoutes = lazy(() => import("@garden/module-eat").then((module) => ({ default: module.EatRoutes })));

const LoadingModule = () => <p className="py-14 text-sm text-muted">Opening module...</p>;

export const App = () => (
  <AppShell>
    <Suspense fallback={<LoadingModule />}>
      <Routes>
        <Route path="/" element={<Navigate replace to="/today" />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/train/*" element={<TrainRoutes />} />
        <Route path="/think/*" element={<ThinkRoutes />} />
        <Route path="/work/*" element={<WorkRoutes />} />
        <Route path="/eat/*" element={<EatRoutes />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/weekly-review" element={<WeeklyReviewPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate replace to="/today" />} />
      </Routes>
    </Suspense>
  </AppShell>
);
