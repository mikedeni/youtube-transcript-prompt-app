
import ModeToggle from "@/components/ModeToggle";
import YoutubeForm from "@/components/YoutubeForm";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="absolute top-6 right-6">
        <ModeToggle variant={"ghost"} />
      </div>

      <div className="max-w-2xl text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold">📝 YouTube Transcript Prompt App</h1>
        <p>Generate a prompt from any YouTube video using its URL.</p>
      </div>

      <YoutubeForm />
    </main>
  );
}
