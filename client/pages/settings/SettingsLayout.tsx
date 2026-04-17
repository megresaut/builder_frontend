import { NavLink, Outlet } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";

const TABS = [
  { to: "/settings/bugs", label: "Bug Reports" },
  { to: "/settings/profile", label: "Profile" },
  { to: "/settings/notifications", label: "Notifications" },
  { to: "/settings/integrations", label: "Integrations" },
];

export default function SettingsLayout() {
  return (
    <PageTemplate>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Manage your account, integrations, and report bugs.</p>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `pb-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-[#013764] text-[#013764]"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </PageTemplate>
  );
}
