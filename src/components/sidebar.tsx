import Link from "next/link";

const links = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Events", href: "/events" },
    { name: "Applications", href: "/applications" },
    { name: "Organizations", href: "/organizations" },
    { name: "Settings", href: "/settings" },
];

export default function Sidebar() {
    return (
        <aside className="w-64 border-r bg-white p-5">
            <h2 className="text-xl font-bold">CampusOps</h2>

            <nav className="mt-8 space-y-2">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="block rounded-lg px-3 py-2 hover:bg-gray-100"
                    >
                        {link.name}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}