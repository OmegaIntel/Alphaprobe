export default function NotFound() {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
        <p className="text-gray-600 mt-2">The page you're looking for doesn't exist.</p>
        <a href="/" className="text-blue-500 mt-4">Go back to Home</a>
      </div>
    );
  }
  