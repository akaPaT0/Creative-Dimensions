import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import ContactOptions from "../components/ContactOptions";

export default function ContactPage() {
  return (
    <div className="relative min-h-screen text-white">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Get in touch</h1>
          <p className="mt-2 text-sm sm:text-base text-white/60">
            Questions, custom pieces or business orders. Reach us whichever way suits you.
          </p>
          <div className="mt-6">
            <ContactOptions />
          </div>
        </div>

        <div className="mt-14">
          <Footer />
        </div>
      </main>
    </div>
  );
}
