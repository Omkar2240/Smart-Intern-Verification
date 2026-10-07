import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

export default function SecurityPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Header
          title="Security & AI"
          description="Manage security settings, AI configurations, and access controls"
        />
        <div className="flex-1 p-7">
          <div className="max-w-4xl">
            <div className="bg-white rounded-xl border border-slate-200 p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Security Settings</h2>
              <p className="text-slate-600">
                Security and AI configuration options will be displayed here.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
