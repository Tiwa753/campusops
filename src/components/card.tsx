type CardProps = {
    title: string;
    value: string | number;
};

export default function Card({ title, value }: CardProps) {
    return (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
    );
}