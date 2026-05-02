import Topbar from "@/components/topbar";

export default function Home() {
  return (
    <div className="relative isolate flex min-h-screen w-full flex-1 flex-col font-sans">
      <div className="bg-home-background-layer pointer-events-none" aria-hidden />
      <div className="relative z-10 flex flex-col">
        <Topbar />
      </div>
    </div>
  );
}
