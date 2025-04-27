import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export async function POST(request: Request) {
  try {
    const ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
    });

    const ip = (request.headers.get("x-forwarded-for") ?? "127.0.0.1").split(
      ","
    )[0];

    const { remaining } = await ratelimit.limit(ip);

    if (remaining === 0) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

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
