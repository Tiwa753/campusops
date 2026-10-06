import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">CampusOps</h1>

      <p className="mt-3 text-gray-600">
        University Operations Management Platform
      </p>

      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-black px-5 py-3 text-white"
      >
        Open Dashboard  
      </Link>
    </main>
  );
}