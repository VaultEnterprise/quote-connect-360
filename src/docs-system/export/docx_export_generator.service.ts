import fs from "node:fs";
import path from "node:path";
import {
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
} from "docx";
import { buildDocumentControlTable, buildPageSection, buildTitlePage, buildWorkflowSection } from "./docx_section_builder";
import type { DocxExportOptions } from "./docx_types";
import type { DocumentationDataset } from "../shared/documentation_types";

export class DocxExportGeneratorService {
  async generate(dataset: DocumentationDataset, options: DocxExportOptions): Promise<string> {
    const generatedOn = options.generatedOnIso ?? new Date().toISOString();
    const outPath =
      options.outputPath ??
      path.resolve(process.cwd(), `${options.applicationName.replace(/\s+/g, "_")}_Complete_Function_Manual.docx`);

    const children: (Paragraph | Table)[] = [];

    children.push(
      ...buildTitlePage(
        options.applicationName,
        options.manualTitle,
        options.version,
        options.author,
        generatedOn,
      ),
    );

    children.push(new Paragraph({ text: "Document Control", heading: HeadingLevel.HEADING_1 }));
    children.push(buildDocumentControlTable());

    children.push(new Paragraph({ text: "Revision History", heading: HeadingLevel.HEADING_1 }));
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph("Version")] }),
              new TableCell({ children: [new Paragraph("Date")] }),
              new TableCell({ children: [new Paragraph("Summary")] }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(options.version)] }),
              new TableCell({ children: [new Paragraph(generatedOn)] }),
              new TableCell({ children: [new Paragraph("Initial generated manual export")] }),
            ],
          }),
        ],
      }),
    );

    children.push(new Paragraph({ text: "Application Overview", heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph("This document describes every page, control, feature, workflow, dependency, and system behavior in the application."));
    children.push(new Paragraph({ text: "Page-by-Page Manual", heading: HeadingLevel.HEADING_1 }));

    for (const page of dataset.pages) {
      const pageControls = dataset.controls.filter((c) => c.page_code === page.page_code);
      const pageFeatures = dataset.features.filter((f) => f.page_code === page.page_code);
      const pageWorkflows = dataset.workflows.filter((w) => page.related_workflows.includes(w.workflow_code));

      children.push(...buildPageSection(page, pageControls, pageFeatures, pageWorkflows));
      children.push(new Paragraph({ children: [], pageBreakBefore: true }));
    }

    children.push(new Paragraph({ text: "Workflows and State Transitions", heading: HeadingLevel.HEADING_1 }));
    for (const workflow of dataset.workflows) {
      children.push(...buildWorkflowSection(workflow));
      children.push(new Paragraph({ children: [], pageBreakBefore: true }));
    }

    const doc = new Document({
      sections: [
        {
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outPath, buffer);
    return outPath;
  }
}