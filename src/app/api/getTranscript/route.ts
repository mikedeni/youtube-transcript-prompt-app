import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const url = data.youtubeUrl;
    if (!url) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    const transcripts = await YoutubeTranscript.fetchTranscript(url);
    const transcript = transcripts.map((item) => item.text).join(" ");

    return NextResponse.json({ transcript });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: `${error.message}` }, { status: 500 });
    }
  }
}
