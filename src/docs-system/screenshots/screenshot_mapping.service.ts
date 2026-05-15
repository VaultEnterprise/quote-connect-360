import type { PageInventoryItem } from "../shared/documentation_types";
import type { ScreenshotMappingResult, ScreenshotTarget } from "./screenshot_types";

export class ScreenshotMappingService {
  buildTargets(pages: PageInventoryItem[]): ScreenshotMappingResult[] {
    return pages.map((page) => {
      const targets: ScreenshotTarget[] = [
        {
          screenshot_code: `${page.page_code}-MAIN`,
          page_code: page.page_code,
          page_name: page.page_name,
          route: page.route,
          capture_type: "full_page",
          selector: null,
          state_label: "default",
          required_role: page.access_roles[0] ?? "Admin",
          output_file_name: `${page.page_code}_default.png`,
          sort_order: 1,
        },
      ];

      if (page.page_type === "modal") {
        targets.push({
          screenshot_code: `${page.page_code}-MODAL`,
          page_code: page.page_code,
          page_name: page.page_name,
          route: page.route,
          capture_type: "modal",
          selector: "[data-testid='modal-root']",
          state_label: "modal_open",
          required_role: page.access_roles[0] ?? "Admin",
          output_file_name: `${page.page_code}_modal.png`,
          sort_order: 2,
        });
      }

      return {
        page_code: page.page_code,
        screenshots: targets,
      };
    });
  }

  buildManualPlaceholders(result: ScreenshotMappingResult[]): Record<string, string[]> {
    return Object.fromEntries(
      result.map((r) => [
        r.page_code,
        r.screenshots.map(
          (s) => `[Insert screenshot here: ${s.output_file_name} | state=${s.state_label} | type=${s.capture_type}]`,
        ),
      ]),
    );
  }
}