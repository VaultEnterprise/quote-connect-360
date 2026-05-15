export interface ScreenshotTarget {
  screenshot_code: string;
  page_code: string;
  page_name: string;
  route: string;
  capture_type: "full_page" | "modal" | "tab" | "section";
  selector?: string | null;
  state_label: string;
  required_role: string;
  output_file_name: string;
  sort_order: number;
}

export interface ScreenshotMappingResult {
  page_code: string;
  screenshots: ScreenshotTarget[];
}