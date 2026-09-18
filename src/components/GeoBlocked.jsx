export default function GeoBlocked({ reason = 'denied' }) {
  return (
    <div className="min-h-screen bg-brand flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-red-600">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {reason === 'denied'
            ? 'Available In-Store Only'
            : 'Location Check Failed'}
        </h1>

        <p className="text-gray-600 mb-6">
          {reason === 'denied'
            ? 'Prices are only available inside our shop. Please scan the QR code at our location to view the catalogue.'
            : "We couldn't verify your location. Please make sure location services are enabled and try again."}
        </p>

        <div className="text-sm text-gray-400">
          Thank you for your understanding
        </div>
      </div>
    </div>
  );
}
