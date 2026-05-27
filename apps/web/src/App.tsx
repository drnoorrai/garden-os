import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { EatPage } from "./pages/EatPage";
import { ReviewPage } from "./pages/ReviewPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ThinkPage } from "./pages/ThinkPage";
import { TodayPage } from "./pages/TodayPage";
import { TrainPage } from "./pages/TrainPage";
import { WeeklyReviewPage } from "./pages/WeeklyReviewPage";
import { WorkPage } from "./pages/WorkPage";

export const App = () => (
  <AppShell>
    <Routes>
      <Route path="/" element={<Navigate replace to="/today" />} />
      <Route path="/today" element={<TodayPage />} />
      <Route path="/train" element={<TrainPage />} />
      <Route path="/think/*" element={<ThinkPage />} />
      <Route path="/work/*" element={<WorkPage />} />
      <Route path="/eat" element={<EatPage />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/weekly-review" element={<WeeklyReviewPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate replace to="/today" />} />
    </Routes>
  </AppShell>
);
