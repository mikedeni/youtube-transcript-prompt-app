import { NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export async function POST(request: Request) {
  try {
    const { youtubeUrl } = await request.json();

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    const info = await ytdl.getBasicInfo(youtubeUrl);
    const d = info.videoDetails;

    return NextResponse.json({
      title: d.title,
      description: d.description,
      channelName: d.author.name,
      channelUrl: d.author.channel_url,
      subscriberCount: d.author.subscriber_count ?? null,
      viewCount: d.viewCount,
      publishDate: d.publishDate,
      lengthSeconds: d.lengthSeconds,
      keywords: d.keywords ?? [],
      category: d.category,
      isLiveContent: d.isLiveContent,
      thumbnailUrl: d.thumbnails?.[d.thumbnails.length - 1]?.url ?? null,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}
