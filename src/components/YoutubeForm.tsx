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

const YoutubeForm = () => {
  const prompt = `Your output should use the following template:\n### Summary\n### Analogy\n### Notes\n- [Emoji] Bulletpoint\n### Keywords\n- Explanation\n### Score\nMake a concise summary of the transcript, including keywords and a short analogy to provide context. Create 10 bullet points summarizing key moments, and extract important keywords with explanations.\n\nTranscript: `;

  const [transcript, setTranscript] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copyText, setCopyText] = useState("Copy Prompt With Transcript");
  const [promptText, setPromptText] = useState(prompt);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      youtubeUrl: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    try {
      const { data } = await axios.post("/api/getTranscript", {
        youtubeUrl: values.youtubeUrl,
      });
      setTranscript(`"${data.transcript}"`);
      setCopyText("Copy Prompt With Transcript");
      toast("✅ Prompt generated successfully!");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast(`❌ Error: ${error.response?.data.error}`);
        setTranscript(null);
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
                <FormLabel className="">YouTube URL</FormLabel>
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
          <Button type="submit" disabled={loading}>
            {loading ? "Loading..." : "Generate Prompt"}
          </Button>
        </form>
      </Form>

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
            className="text-sm whitespace-pre-warp border rounded-md p-3 max-h-[300px] overflow-y-auto"
          />

          <h2 className="text-lg font-semibold">Transcript</h2>
          <div className="text-sm whitespace-pre-warp border rounded-md p-3 max-h-[100px] overflow-y-auto">
            {transcript}
          </div>
        </div>
      )}
    </div>
  );
};

export default YoutubeForm;
