import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getSubtitles } from "youtube-captions-scraper";

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

    const videoID = url.split("v=")[1];
    if (!videoID) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    const captions = await getSubtitles({
      videoID: videoID,
      lang: "en",
    });

    const caption = captions.map((c) => c.text).join("");

    return NextResponse.json({ transcript: caption });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: `${error.message}` }, { status: 500 });
    }
  }
}
