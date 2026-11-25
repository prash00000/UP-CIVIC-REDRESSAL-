import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-[600px] mx-auto py-16 text-center space-y-5">
      <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#C84B16]">
        404 · Page Not Found
      </p>
      <h1 className="font-editorial text-[32px] sm:text-[38px] font-bold text-text leading-tight">
        This page could not be found.
      </h1>
      <p className="text-[16px] text-muted leading-relaxed">
        यह पृष्ठ उपलब्ध नहीं है। आप मुख्य पृष्ठ पर जा सकते हैं या अपने क्षेत्र के अधिकारी खोज सकते हैं।
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="inline-flex items-center justify-center min-h-btn px-6 py-2.5 bg-[#154273] hover:bg-[#0F3156] text-white font-semibold rounded-[4px] transition-colors"
        >
          Go to Home / मुख्य पृष्ठ
        </Link>
        <Link
          href="/find/"
          className="inline-flex items-center justify-center min-h-btn px-6 py-2.5 border border-borderStrong hover:border-[#154273] bg-surface text-text font-semibold rounded-[4px] transition-colors"
        >
          Find Officer / अधिकारी खोजें
        </Link>
      </div>
    </div>
  );
}
