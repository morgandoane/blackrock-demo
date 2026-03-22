import { Outlet } from "react-router-dom";

export default function InteractionsLayout() {
  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden">
      <Outlet />
    </div>
  );
}
