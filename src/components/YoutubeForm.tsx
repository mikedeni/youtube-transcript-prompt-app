"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  youtubeUrl: z
    .string()
    .url("Please enter a valid URL")
    .regex(
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
      "Must be a valid YouTube URL"
    ),
});

interface VideoMeta {
  title: string;
  description: string;
  channelName: string;
  channelUrl: string;
  subscriberCount: number | null;
  viewCount: string;
  publishDate: string;
  lengthSeconds: string;
  keywords: string[];
  category: string;
  isLiveContent: boolean;
  thumbnailUrl: string | null;
}

const BASE_PROMPT = `Your output should use the following template:\n### Summary\n### Analogy\n### Notes\n- Bulletpoint\n### Keywords\n- Explanation\n### Score\nMake a concise summary of the transcript, including keywords and a short analogy to provide context. Create 10 bullet points summarizing key moments, and extract important keywords with explanations.\n\n`;

function formatDuration(seconds: string): string {
  const s = parseInt(seconds, 10);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function formatNumber(n: string | number | null): string {
  if (n === null || n === undefined) return "N/A";
  return Number(n).toLocaleString();
}

function buildMetaContext(meta: VideoMeta): string {
  const lines = [
    `Video Title: ${meta.title}`,
    `Channel: ${meta.channelName}`,
    meta.subscriberCount !== null
      ? `Subscribers: ${formatNumber(meta.subscriberCount)}`
      : null,
    `Views: ${formatNumber(meta.viewCount)}`,
    `Published: ${meta.publishDate}`,
    `Duration: ${formatDuration(meta.lengthSeconds)}`,
    meta.category ? `Category: ${meta.category}` : null,
    meta.keywords?.length
      ? `Keywords: ${meta.keywords.slice(0, 10).join(", ")}`
      : null,
    meta.description
      ? `Description: ${meta.description.slice(0, 500)}${meta.description.length > 500 ? "..." : ""}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `### Video Metadata\n${lines}\n\n`;
}

const YoutubeForm = () => {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [copyText, setCopyText] = useState("Copy Prompt With Transcript");
  const [promptText, setPromptText] = useState(BASE_PROMPT);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      youtubeUrl: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    try {
      const [transcriptRes, metaRes] = await Promise.all([
        axios.post("/api/getTranscript", { youtubeUrl: values.youtubeUrl }),
        axios.post("/api/getVideoMeta", { youtubeUrl: values.youtubeUrl }),
      ]);

      const fetchedMeta: VideoMeta = metaRes.data;
      setMeta(fetchedMeta);
      setTranscript(`"${transcriptRes.data.transcript}"`);
      setPromptText(BASE_PROMPT + buildMetaContext(fetchedMeta) + "Transcript: ");
      setCopyText("Copy Prompt With Transcript");
      form.resetField("youtubeUrl");
      toast("✅ Prompt generated successfully!");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast(`❌ Error: ${error.response?.data.error}`);
        setTranscript(null);
        setMeta(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (transcript) {
      navigator.clipboard.writeText(promptText + transcript);
      setCopyText("Copied! ✅");
      setTimeout(() => setCopyText("Copy Prompt With Transcript"), 2000);
    }
  };

  return (
    <div className="w-full max-w-xl p-6 rounded-2xl space-y-6 border border-border">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="youtubeUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>YouTube URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://www.youtube.com/watch?v=xxxxxxx"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Paste the full YouTube link you want to process.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading || !form.watch("youtubeUrl")}>
            {loading ? "Loading..." : "Generate Prompt"}
          </Button>
        </form>
      </Form>

      {meta && (
        <div className="flex gap-3 text-sm border rounded-md p-3">
          {meta.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={meta.thumbnailUrl}
              alt={meta.title}
              className="w-36 h-24 rounded-md object-cover shrink-0"
            />
          )}
          <div className="flex flex-col justify-center space-y-1 min-w-0">
            <p className="font-semibold text-base leading-tight line-clamp-2">{meta.title}</p>
            <p className="text-muted-foreground truncate">{meta.channelName}{meta.subscriberCount !== null ? ` · ${formatNumber(meta.subscriberCount)} subscribers` : ""}</p>
            <p className="text-muted-foreground truncate">
              {formatNumber(meta.viewCount)} views · {meta.publishDate} · {formatDuration(meta.lengthSeconds)}
            </p>
            {meta.category && (
              <p className="text-muted-foreground truncate">Category: {meta.category}</p>
            )}
          </div>
        </div>
      )}

      {transcript && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Prompt</h2>
            <Button
              onClick={handleCopy}
              variant={"outline"}
              className="text-sm"
            >
              {copyText}
            </Button>
          </div>
          <Textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="text-sm whitespace-pre-wrap border rounded-md p-3 max-h-[300px] overflow-y-auto"
          />

          <h2 className="text-lg font-semibold">Transcript</h2>
          <div className="text-sm whitespace-pre-wrap border rounded-md p-3 max-h-[100px] overflow-y-auto">
            {transcript}
          </div>
        </div>
      )}
    </div>
  );
};

export default YoutubeForm;
