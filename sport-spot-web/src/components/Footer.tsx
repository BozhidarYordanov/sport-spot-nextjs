export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Left: Brand */}
          <div className="text-slate-600 text-sm font-medium">
            © <span className="font-bold">SportSpot</span>
          </div>

          {/* Right: Tagline */}
          <div className="text-slate-600 text-sm font-medium mt-4 md:mt-0">
            Train smarter, book faster.
          </div>
        </div>
      </div>
    </footer>
  );
}
