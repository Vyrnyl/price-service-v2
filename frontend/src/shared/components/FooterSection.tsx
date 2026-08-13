import { FaFacebookF } from "react-icons/fa";
import { IoLanguage } from "react-icons/io5";

export default function FooterSection() {
  return (
    <footer className="flex w-full lg:ml-72 lg:max-w-[calc(100%-18rem)] flex-col items-center justify-between gap-stack-md border-t border-outline-variant bg-surface-container-highest px-container-margin-mobile py-stack-lg md:flex-row md:px-container-margin-desktop">
      <div className="flex flex-col gap-2">
        <h2 className="font-h3-desktop text-h3-desktop font-bold text-on-surface">PresyoSerbisyo</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          © 2024 DTI Catanduanes. Government of the Philippines.
        </p>
      </div>
      <div className="flex gap-4">
        <span className="cursor-pointer text-outline transition-colors hover:text-primary">
          <FaFacebookF />
        </span>
        <span className="cursor-pointer text-outline transition-colors hover:text-primary">
          <IoLanguage />
        </span>
      </div>
    </footer>
  );
}
