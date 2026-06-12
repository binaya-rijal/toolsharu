import { z } from "zod";

/**
 * Timeline schema — the contract between the AI planner and the Remotion
 * composition. The AI returns JSON matching `timelineSchema`; the player and
 * the server renderer both consume the validated object.
 *
 * Coordinates (x/y) are percentages of the canvas (0–100) so a single timeline
 * works at any 1080p aspect ratio. Times are in seconds from the start.
 */

export const ANIMATIONS = [
  "none",
  "fade",
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "pop",
] as const;

const animationSchema = z.enum(ANIMATIONS);

const baseElement = {
  id: z.string(),
  start: z.number().min(0),
  end: z.number().min(0),
  animation: animationSchema.default("fade"),
};

const textElementSchema = z.object({
  ...baseElement,
  type: z.literal("text"),
  text: z.string(),
  x: z.number().default(50),
  y: z.number().default(50),
  fontSize: z.number().default(64),
  color: z.string().default("#ffffff"),
  fontWeight: z.number().default(700),
  align: z.enum(["left", "center", "right"]).default("center"),
  maxWidth: z.number().default(80),
  background: z.string().optional(),
});

const svgElementSchema = z.object({
  ...baseElement,
  type: z.literal("svg"),
  // Raw inline <svg>…</svg> markup authored by the AI.
  svg: z.string(),
  x: z.number().default(50),
  y: z.number().default(50),
  width: z.number().default(30),
  height: z.number().default(30),
});

const handKeyframeSchema = z.object({
  // t is normalized 0–1 across the element's [start, end] span.
  t: z.number().min(0).max(1),
  x: z.number(),
  y: z.number(),
  scale: z.number().default(1),
  rotate: z.number().default(0),
});

const handElementSchema = z.object({
  ...baseElement,
  type: z.literal("hand"),
  width: z.number().default(20),
  keyframes: z.array(handKeyframeSchema).min(1),
});

export const elementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  svgElementSchema,
  handElementSchema,
]);

export const timelineSchema = z.object({
  durationInSeconds: z.number().min(0.1),
  fps: z.number().int().min(1).max(60).default(30),
  background: z
    .object({
      color: z.string().default("#0b0b14"),
      // Whether the uploaded video is shown as the background layer.
      useVideo: z.boolean().default(true),
      fit: z.enum(["cover", "contain"]).default("cover"),
    })
    .default({ color: "#0b0b14", useVideo: true, fit: "cover" }),
  elements: z.array(elementSchema).default([]),
});

export type Timeline = z.infer<typeof timelineSchema>;
export type TimelineElement = z.infer<typeof elementSchema>;
export type TextElement = z.infer<typeof textElementSchema>;
export type SvgElement = z.infer<typeof svgElementSchema>;
export type HandElement = z.infer<typeof handElementSchema>;
export type AnimationKind = (typeof ANIMATIONS)[number];

export interface ScriptVideoProps {
  timeline: Timeline;
  videoSrc: string | null;
  audioSrc: string | null;
  handSrc: string | null;
}

export const DIMENSIONS = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
} as const;

export type AspectRatio = keyof typeof DIMENSIONS;

/** Safe defaults so the Player can mount before a timeline exists. */
export const EMPTY_TIMELINE: Timeline = {
  durationInSeconds: 5,
  fps: 30,
  background: { color: "#0b0b14", useVideo: true, fit: "cover" },
  elements: [],
};
