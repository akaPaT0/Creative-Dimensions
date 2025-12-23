import Navbar from "../../components/Navbar";
import Background from "../../components/Background";

export default function Page() {
  return (
    <div className="relative min-h-screen">
      <Background />
      <Navbar />
      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-28 pb-16">
        <h1 className="text-4xl font-semibold text-white">Keychains</h1>
      </main>
    </div>
  );
}
