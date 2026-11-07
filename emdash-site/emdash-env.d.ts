// Generated shape for the initial seed. EmDash refreshes this file after startup.
/// <reference types="emdash/locals" />

import type { BylineSummary, ContentBylineCredit, TaxonomyTerm } from "emdash";

export interface Site {
  id: string;
  slug: string | null;
  status: string;
  name: string;
  template: "editorial" | "vivid" | "calm" | "compact" | "mosaic";
  html: string;
  expires_at: Date;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  byline?: BylineSummary | null;
  bylines?: ContentBylineCredit[];
  terms?: Record<string, TaxonomyTerm[]>;
}

declare module "emdash" {
  interface EmDashCollections {
    sites: Site;
  }
}
