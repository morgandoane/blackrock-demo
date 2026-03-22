import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import InteractionDetailPage from "./pages/InteractionDetailPage";
import InteractionsLayout from "./pages/InteractionsLayout";
import InteractionsPage from "./pages/InteractionsPage";
import MessagingPage from "./pages/MessagingPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-full min-h-0 flex-col">
        <main className="min-h-0 flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/messaging" replace />} />
            <Route
              path="/messaging"
              element={
                <div className="h-full min-h-0 overflow-hidden">
                  <MessagingPage />
                </div>
              }
            />
            <Route path="/interactions" element={<InteractionsLayout />}>
              <Route index element={<InteractionsPage />} />
              <Route
                path=":interactionId"
                element={<InteractionDetailPage />}
              />
            </Route>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
