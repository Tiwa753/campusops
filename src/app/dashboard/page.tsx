import Card from "@/components/card";

export default function DashboardPage() {
    return (
        <main className="p-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Card title="Total Students" value={1200} />
                <Card title="Active Events" value={18} />
                <Card title="Applications" value={342} />
            </div>
        </main>
    );
}