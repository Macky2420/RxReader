import { Link, useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error: any = useRouteError();

  const code = error?.status || 500;
  const message =
    error?.statusText || error?.message || "Something went wrong";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow">
        <h1 className="text-6xl font-bold text-red-500">{code}</h1>

        <p className="mt-4 text-gray-600">{message}</p>

        <Link
          to="/dashboard"
          className="mt-6 inline-block px-5 py-2 bg-blue-600 text-white rounded"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}