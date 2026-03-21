import Link from "next/link";
import { Home } from "lucide-react";

type Props = {
  /** Tailwind bottom offset class, e.g. bottom-28 or bottom-48 */
  bottomClassName?: string;
};

export function FloatingHomeButton({
  bottomClassName = "bottom-28",
}: Props) {
  return (
    <Link
      href="/"
      className={`fixed left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-[#1F6B66] shadow-md transition-transform hover:bg-[#F8F7F5] active:scale-95 ${bottomClassName}`}
      aria-label="Back to home"
    >
      <Home size={24} strokeWidth={1.5} />
    </Link>
  );
}
