export interface MindmapNode {
  label: string;
  children?: MindmapNode[];
}

export interface MindmapArtifact {
  input: string;
  tree: MindmapNode;
}

export interface StorySlide {
  title: string;
  description: string;
  keyPoints: string[];
}

export interface StoryArtifact {
  storyTitle: string;
  targetSlides: number;
  slides: StorySlide[];
}

export interface SlideDesignArtifact {
  slideIndex: number;
  title: string;
  template: string;
  syntax: string;
}

export interface IllustrationDecision {
  slideIndex: number;
  prompt: string | null;
}

export interface RenderedSlide {
  slideIndex: number;
  status: "ok" | "error";
  path: string;
  svgPath?: string;
  illustration?: string;
  error?: string;
}

export interface PipelineOptions {
  input: string;
  inputSource: "text" | "file";
  slides?: number;
  outputDir: string;
  llmUrl: string;
  model: string;
  illustrations: "on" | "off" | "auto";
  acceptAll: boolean;
  skip: string[];
  regenerate: string[];
  from?: string;
  imageWidth: number;
  imageHeight: number;
  noEdit: boolean;
  noTitle: boolean;
}

export interface ArtifactPaths {
  mindmap: string;
  story: string;
  slideDesign: string;
  illustrations: string;
  rendered: string;
}

export const STAGE_NAMES = [
  "mindmap",
  "story",
  "slides",
  "illustrations",
  "render",
  "export",
] as const;

export type StageName = (typeof STAGE_NAMES)[number];

export function artifactPaths(outputDir: string): ArtifactPaths {
  const artifacts = `${outputDir}/artifacts`;
  return {
    mindmap: `${artifacts}/01-mindmap.json`,
    story: `${artifacts}/02-story.json`,
    slideDesign: `${artifacts}/03-slides.json`,
    illustrations: `${artifacts}/04-illustrations.json`,
    rendered: `${artifacts}/05-rendered.json`,
  };
}
