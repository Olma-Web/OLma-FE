import Topbar from "@/components/topbar";
import WriteForm from "@/components/community/WriteForm";

export default function CommunityWritePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <Topbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-6">
        <h1 className="text-2xl font-extrabold text-gray-900">글쓰기</h1>

        <div className="mt-6">
          <WriteForm />
        </div>
      </main>
    </div>
  );
}
