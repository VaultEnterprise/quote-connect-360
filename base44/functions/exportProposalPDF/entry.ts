import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { proposal_id } = await req.json();
    if (!proposal_id) return Response.json({ error: 'proposal_id required' }, { status: 400 });

    const proposals = await base44.entities.Proposal.filter({ id: proposal_id });
    if (!proposals?.length) return Response.json({ error: 'Proposal not found' }, { status: 404 });

    const proposal = proposals[0];
    const doc = new jsPDF();

    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Benefits Proposal', 20, 20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(proposal.employer_name || '', 20, 30);

    // Reset text color
    doc.setTextColor(30, 30, 30);
    let y = 55;

    // Proposal details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(proposal.title || 'Proposal', 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    if (proposal.effective_date) { doc.text(`Effective Date: ${proposal.effective_date}`, 20, y); y += 6; }
    if (proposal.broker_name) { doc.text(`Prepared by: ${proposal.broker_name}`, 20, y); y += 6; }
    if (proposal.agency_name) { doc.text(`Agency: ${proposal.agency_name}`, 20, y); y += 6; }
    y += 4;

    // Financials box
    if (proposal.total_monthly_premium || proposal.employer_monthly_cost || proposal.employee_avg_cost) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(20, y, 170, 35, 3, 3, 'FD');
      y += 8;
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Financial Summary', 28, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const financials = [];
      if (proposal.total_monthly_premium) financials.push(`Total Monthly Premium: $${Number(proposal.total_monthly_premium).toLocaleString()}`);
      if (proposal.employer_monthly_cost) financials.push(`Employer Monthly Cost: $${Number(proposal.employer_monthly_cost).toLocaleString()}`);
      if (proposal.employee_avg_cost) financials.push(`Avg Employee Cost: $${Number(proposal.employee_avg_cost).toLocaleString()}`);
      doc.text(financials.join('   |   '), 28, y);
      y += 18;
    }

    // Cover message
    if (proposal.cover_message) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text('Message from your Broker', 20, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(proposal.cover_message, 170);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 8;
    }

    // Plan summary
    if (proposal.plan_summary?.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text('Plan Summary', 20, y);
      y += 8;

      proposal.plan_summary.forEach((plan, i) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
        doc.rect(20, y - 4, 170, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.text(plan.plan_name || plan.name || `Plan ${i + 1}`, 24, y + 3);
        if (plan.carrier) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(plan.carrier, 120, y + 3);
        }
        y += 13;
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Connect Quote 360  |  Page ${i} of ${pageCount}  |  Generated ${new Date().toLocaleDateString()}`, 20, 290);
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposal-${(proposal.employer_name || 'proposal').replace(/\s+/g, '-')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[function' + '] error:', error.message, error.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});