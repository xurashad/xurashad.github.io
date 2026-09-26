/**
 * Direct LaTeX-Style Academic PDF Generator for Rashad Hamidi's CV
 * Compiles public/cv/cv.json into a publication-grade LaTeX-styled academic PDF
 * with clickable hyperlinks, classic serif typography, and formal academic formatting.
 * Saved to public/documents/cv.pdf and public/cv/cv.pdf using pdf-lib.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFDocument, PDFString, StandardFonts, rgb, PageSizes } from "pdf-lib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const cvJsonPath = path.join(rootDir, "public", "cv", "cv.json");
const cvData = JSON.parse(fs.readFileSync(cvJsonPath, "utf-8"));

function cleanWinAnsi(str) {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // removes diacritics (î -> i, é -> e, etc.)
    .replace(/[łŁ]/g, (m) => (m === "ł" ? "l" : "L"))
    .replace(/[—–]/g, "-")
    .replace(/•/g, "*")
    .replace(/[·]/g, "|")
    .replace(/’|‘/g, "'")
    .replace(/“|”/g, '"')
    .replace(/₃/g, "3")
    .replace(/₂/g, "2")
    .replace(/₁/g, "1")
    .replace(/₀/g, "0")
    .replace(/₄/g, "4")
    .replace(/ℤ/g, "Z")
    .replace(/σ/g, "sigma")
    .replace(/η/g, "eta")
    .replace(/λ/g, "lambda")
    .replace(/🇵🇸/g, "")
    .replace(/[^\x20-\x7E\n\r\t]/g, ""); // clean non-ASCII for WinAnsi
}

function getMonthName(monthStr) {
  if (!monthStr) return "";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const idx = parseInt(monthStr, 10) - 1;
  return idx >= 0 && idx < 12 ? months[idx] : monthStr;
}

function formatPeriod(startYear, startMonth, endYear, endMonth, current) {
  const start = startMonth ? `${getMonthName(startMonth)} ${startYear}` : startYear;
  if (current) return `${start} - Present`;
  if (!endYear) return start;
  const end = endMonth ? `${getMonthName(endMonth)} ${endYear}` : endYear;
  return `${start} - ${end}`;
}

async function generatePDF() {
  const doc = await PDFDocument.create();
  doc.setTitle("Curriculum Vitae - Rashad Hamidi");
  doc.setAuthor("Rashad Hamidi");
  doc.setSubject("Academic Curriculum Vitae - Mathematical and Theoretical Physics");
  doc.setKeywords([
    "Curriculum Vitae",
    "Rashad Hamidi",
    "Integrable Systems",
    "String Theory",
    "Quantum Field Theory",
    "Durham University",
  ]);

  // Classic Academic LaTeX Serif Fonts (Times-Roman)
  const fontRegular = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const fontBoldItalic = await doc.embedFont(StandardFonts.TimesRomanBoldItalic);

  // LaTeX Academic Color Palette
  const colorText = rgb(0.10, 0.10, 0.12);        // Formal Charcoal Black
  const colorPrimary = rgb(0.06, 0.16, 0.32);     // Academic Oxford Navy
  const colorLink = rgb(0.02, 0.35, 0.65);        // LaTeX hyperref Royal Blue
  const colorMuted = rgb(0.35, 0.38, 0.44);       // LaTeX muted slate
  const colorRule = rgb(0.20, 0.22, 0.26);        // LaTeX \hrule bar
  const colorLightRule = rgb(0.82, 0.84, 0.87);   // Running header/footer rule

  const [pageWidth, pageHeight] = PageSizes.A4;   // 595.28 x 841.89 pt
  const marginX = 44;
  const marginTop = 44;
  const marginBottom = 44;
  const contentWidth = pageWidth - marginX * 2;

  let currentPage = doc.addPage(PageSizes.A4);
  let y = pageHeight - marginTop;

  function checkPageBreak(spaceNeeded) {
    if (y - spaceNeeded < marginBottom) {
      currentPage = doc.addPage(PageSizes.A4);
      y = pageHeight - marginTop;
      drawRunningHeader();
    }
  }

  function drawRunningHeader() {
    currentPage.drawText("Rashad Hamidi | Curriculum Vitae", {
      x: marginX,
      y: pageHeight - 24,
      size: 8,
      font: fontItalic,
      color: colorMuted,
    });
    currentPage.drawLine({
      start: { x: marginX, y: pageHeight - 28 },
      end: { x: pageWidth - marginX, y: pageHeight - 28 },
      thickness: 0.5,
      color: colorLightRule,
    });
  }

  function drawSectionHeading(title) {
    checkPageBreak(45);
    y -= 16;
    currentPage.drawText(cleanWinAnsi(title).toUpperCase(), {
      x: marginX,
      y,
      size: 10.5,
      font: fontBold,
      color: colorPrimary,
    });
    y -= 4;
    // Classic LaTeX \hrule line
    currentPage.drawLine({
      start: { x: marginX, y },
      end: { x: pageWidth - marginX, y },
      thickness: 0.8,
      color: colorRule,
    });
    y -= 9;
  }

  function drawText(text, x, targetY, font, size, color) {
    const cleaned = cleanWinAnsi(text);
    currentPage.drawText(cleaned, {
      x,
      y: targetY,
      size,
      font,
      color,
    });
    return font.widthOfTextAtSize(cleaned, size);
  }

  function drawBullet(x, targetY) {
    // Draws a tiny filled circular bullet dot like in LaTeX
    currentPage.drawCircle({
      x: x + 2,
      y: targetY + 3,
      size: 1.6,
      color: colorText,
    });
  }

  function drawLink(text, x, targetY, font, size, color, url) {
    const cleaned = cleanWinAnsi(text);
    const textWidth = font.widthOfTextAtSize(cleaned, size);

    currentPage.drawText(cleaned, {
      x,
      y: targetY,
      size,
      font,
      color,
    });

    if (url) {
      const linkAnnot = doc.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [x, targetY - 2, x + textWidth, targetY + size + 2],
        Border: [0, 0, 0],
        A: {
          Type: "Action",
          S: "URI",
          URI: PDFString.of(url),
        },
      });
      const linkRef = doc.context.register(linkAnnot);
      currentPage.node.addAnnot(linkRef);
    }

    return textWidth;
  }

  function drawWrappedText(text, x, startY, maxWidth, font, size, color, lineHeight = 12) {
    const cleaned = cleanWinAnsi(text);
    const words = cleaned.replace(/\r\n/g, " ").replace(/\n/g, " ").split(" ");
    let currentLine = "";
    let curY = startY;

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n];
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > maxWidth && currentLine !== "") {
        if (curY - lineHeight < marginBottom) {
          currentPage = doc.addPage(PageSizes.A4);
          curY = pageHeight - marginTop;
          drawRunningHeader();
        }
        currentPage.drawText(currentLine, { x, y: curY, size, font, color });
        currentLine = words[n];
        curY -= lineHeight;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      if (curY - lineHeight < marginBottom) {
        currentPage = doc.addPage(PageSizes.A4);
        curY = pageHeight - marginTop;
        drawRunningHeader();
      }
      currentPage.drawText(currentLine, { x, y: curY, size, font, color });
      curY -= lineHeight;
    }
    return curY;
  }

  function drawHangingWrappedText(text, xFirst, xSubsequent, startY, maxWidthFirst, maxWidthSubsequent, font, size, color, lineHeight = 11) {
    const cleaned = cleanWinAnsi(text);
    const words = cleaned.replace(/\r\n/g, " ").replace(/\n/g, " ").split(" ");
    let currentLine = "";
    let curY = startY;
    let isFirst = true;

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n];
      const maxW = isFirst ? maxWidthFirst : maxWidthSubsequent;
      const testWidth = font.widthOfTextAtSize(testLine, size);

      if (testWidth > maxW && currentLine !== "") {
        if (curY - lineHeight < marginBottom) {
          currentPage = doc.addPage(PageSizes.A4);
          curY = pageHeight - marginTop;
          drawRunningHeader();
        }
        currentPage.drawText(currentLine, { x: isFirst ? xFirst : xSubsequent, y: curY, size, font, color });
        currentLine = words[n];
        curY -= lineHeight;
        isFirst = false;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      if (curY - lineHeight < marginBottom) {
        currentPage = doc.addPage(PageSizes.A4);
        curY = pageHeight - marginTop;
        drawRunningHeader();
      }
      currentPage.drawText(currentLine, { x: isFirst ? xFirst : xSubsequent, y: curY, size, font, color });
      curY -= lineHeight;
    }

    return curY;
  }

  // Extract Personal Info (dynamically matching cv.json)
  const info = cvData.personal_info || {};
  const name = info.name || "Rashad Hamidi";
  const title = info.title || "PhD Researcher in Mathematical and Theoretical Physics";
  const institution = info.institution || "Durham University";
  const location = info.location || cvData.links?.location || "Gateshead, UK";
  const email = info.email || cvData.links?.email || "xurashad@gmail.com";
  const website = info.website || cvData.links?.website || "https://xurashad.github.io/";
  const orcid = info.orcid || cvData.links?.orcid || "0000-0002-0719-3269";
  const inspirehep = info.inspirehep || cvData.links?.inspirehep || "2915639";

  // ── HEADER (LaTeX Formal Centered Layout) ─────────────────────────────
  const nameClean = cleanWinAnsi(name.toUpperCase());
  const nameWidth = fontBold.widthOfTextAtSize(nameClean, 22);
  drawText(nameClean, (pageWidth - nameWidth) / 2, y, fontBold, 22, colorPrimary);

  y -= 15;
  const subClean = cleanWinAnsi(`${title} - ${institution}`);
  const subWidth = fontItalic.widthOfTextAtSize(subClean, 10);
  drawText(subClean, (pageWidth - subWidth) / 2, y, fontItalic, 10, colorText);

  y -= 13;
  // Contact line 1 (Centered with links)
  // Email | Website | Location
  const emailPrefix = "Email: ";
  const emailText = email;
  const sep1 = "   |   ";
  const webPrefix = "Website: ";
  const webText = website.replace("https://", "").replace(/\/$/, "");
  const sep2 = "   |   ";
  const locText = `Location: ${location}`;

  const c1TotalWidth =
    fontRegular.widthOfTextAtSize(emailPrefix, 8.5) +
    fontRegular.widthOfTextAtSize(emailText, 8.5) +
    fontRegular.widthOfTextAtSize(sep1, 8.5) +
    fontRegular.widthOfTextAtSize(webPrefix, 8.5) +
    fontRegular.widthOfTextAtSize(webText, 8.5) +
    fontRegular.widthOfTextAtSize(sep2, 8.5) +
    fontRegular.widthOfTextAtSize(locText, 8.5);

  let curX = (pageWidth - c1TotalWidth) / 2;
  curX += drawText(emailPrefix, curX, y, fontRegular, 8.5, colorMuted);
  curX += drawLink(emailText, curX, y, fontRegular, 8.5, colorLink, `mailto:${email}`);
  curX += drawText(sep1, curX, y, fontRegular, 8.5, colorMuted);
  curX += drawText(webPrefix, curX, y, fontRegular, 8.5, colorMuted);
  curX += drawLink(webText, curX, y, fontRegular, 8.5, colorLink, website);
  curX += drawText(sep2, curX, y, fontRegular, 8.5, colorMuted);
  drawText(locText, curX, y, fontRegular, 8.5, colorMuted);

  y -= 11;
  // Contact line 2 (ORCID & InspireHEP with clickable links)
  const orcidPrefix = "ORCID: ";
  const orcidText = orcid;
  const sep3 = "   |   ";
  const inspirePrefix = "InspireHEP: ";
  const inspireText = inspirehep;

  const c2TotalWidth =
    fontRegular.widthOfTextAtSize(orcidPrefix, 8.5) +
    fontRegular.widthOfTextAtSize(orcidText, 8.5) +
    fontRegular.widthOfTextAtSize(sep3, 8.5) +
    fontRegular.widthOfTextAtSize(inspirePrefix, 8.5) +
    fontRegular.widthOfTextAtSize(inspireText, 8.5);

  curX = (pageWidth - c2TotalWidth) / 2;
  curX += drawText(orcidPrefix, curX, y, fontRegular, 8.5, colorMuted);
  curX += drawLink(orcidText, curX, y, fontRegular, 8.5, colorLink, `https://orcid.org/${orcid}`);
  curX += drawText(sep3, curX, y, fontRegular, 8.5, colorMuted);
  curX += drawText(inspirePrefix, curX, y, fontRegular, 8.5, colorMuted);
  drawLink(inspireText, curX, y, fontRegular, 8.5, colorLink, `https://inspirehep.net/authors/${inspirehep}`);

  y -= 8;
  // Formal LaTeX \hrule separator
  currentPage.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 1,
    color: colorRule,
  });
  y -= 5;

  // ── 1. RESEARCH PROFILE & INTERESTS ──────────────────────────────────
  drawSectionHeading("Research Profile & Interests");
  const topicsStr = `Core Research Areas: ${cvData.research_interests.topics.join("  |  ")}`;
  drawText(topicsStr, marginX, y, fontBold, 9, colorPrimary);
  y -= 13;

  y = drawWrappedText(cvData.research_interests.description, marginX, y, contentWidth, fontRegular, 8.5, colorText, 11.5);
  y -= 3;
  y = drawWrappedText(`Vision: ${cvData.research_interests.vision}`, marginX, y, contentWidth, fontItalic, 8.5, colorMuted, 11.5);
  y -= 4;

  // ── 2. EDUCATION & ACADEMIC BACKGROUND ───────────────────────────────
  drawSectionHeading("Education & Academic Background");

  cvData.education.forEach((edu) => {
    checkPageBreak(50);
    const dateRange = formatPeriod(edu.start_year, edu.start_month, edu.end_year, edu.end_month, !edu.end_year);

    drawText(edu.degree, marginX, y, fontBold, 9.5, colorText);
    const dateWidth = fontBoldItalic.widthOfTextAtSize(dateRange, 8.5);
    drawText(dateRange, pageWidth - marginX - dateWidth, y, fontBoldItalic, 8.5, colorMuted);
    y -= 11;

    const instLine = `${edu.institution}, ${edu.department} - ${edu.location}`;
    drawText(instLine, marginX, y, fontItalic, 8.5, colorPrimary);
    y -= 11;

    if (edu.degree_achievement) {
      drawText(`Degree Achievement: ${edu.degree_achievement}`, marginX + 12, y, fontBold, 8, colorPrimary);
      y -= 10;
    }

    if (edu.supervisor) {
      const supPrefix = "Supervisor: ";
      drawText(supPrefix, marginX + 12, y, fontRegular, 8, colorText);
      const supX = marginX + 12 + fontRegular.widthOfTextAtSize(supPrefix, 8);
      if (edu.supervisor.includes("Ben Hoare")) {
        drawLink(edu.supervisor, supX, y, fontRegular, 8, colorLink, "https://www.benhoare.info/");
      } else {
        drawText(edu.supervisor, supX, y, fontRegular, 8, colorText);
      }
      y -= 10;
    }

    if (edu.thesis_title) {
      y = drawWrappedText(`Thesis: "${edu.thesis_title}"`, marginX + 12, y, contentWidth - 12, fontRegular, 8, colorMuted, 10.5);
      y -= 2;
    }

    if (edu.research_topics && edu.research_topics.length > 0) {
      const topStr = `Focus: ${edu.research_topics.join(", ")}`;
      y = drawWrappedText(topStr, marginX + 12, y, contentWidth - 12, fontItalic, 7.5, colorMuted, 10);
    }
    y -= 4;
  });

  // Pre-University
  if (cvData.pre_university_education && cvData.pre_university_education.length > 0) {
    checkPageBreak(30);
    drawText("Pre-University Secondary Education:", marginX, y, fontBold, 8.5, colorMuted);
    y -= 10;

    cvData.pre_university_education.forEach((p) => {
      drawBullet(marginX + 4, y);
      const pLine = `${p.degree}, ${p.institution} (${p.location}) [${p.start_year}-${p.end_year}] - Grades: ${p.grades}`;
      y = drawWrappedText(pLine, marginX + 12, y, contentWidth - 12, fontRegular, 7.5, colorText, 10);
    });
    y -= 4;
  }

  // ── 3. PUBLICATIONS & PREPRINTS ──────────────────────────────────────
  drawSectionHeading("Publications & Preprints");

  cvData.publications.forEach((pub, idx) => {
    checkPageBreak(45);
    drawText(`[${idx + 1}]`, marginX, y, fontBold, 9, colorPrimary);

    // Format authors with candidate bold
    const authorsStr = pub.authors.join(", ");
    drawText(authorsStr, marginX + 18, y, fontBold, 9, colorText);
    y -= 11;

    // Title in quotes with clickable link to DOI
    const titleText = `"${pub.title}"`;
    drawLink(titleText, marginX + 18, y, fontBoldItalic, 8.5, colorPrimary, `https://doi.org/${pub.doi}`);
    y -= 11;

    // Journal citation & clickable DOI / arXiv
    const jnlCitation = `${pub.journal} ${pub.volume} (${pub.year}) ${pub.pages}`;
    drawText(jnlCitation, marginX + 18, y, fontRegular, 8, colorText);
    const jnlWidth = fontRegular.widthOfTextAtSize(jnlCitation, 8);

    drawText("   |   arXiv: ", marginX + 18 + jnlWidth, y, fontRegular, 8, colorMuted);
    const arxivX = marginX + 18 + jnlWidth + fontRegular.widthOfTextAtSize("   |   arXiv: ", 8);
    const arxivWidth = drawLink(pub.eprint, arxivX, y, fontRegular, 8, colorLink, `https://arxiv.org/abs/${pub.eprint}`);

    const doiPrefixX = arxivX + arxivWidth;
    drawText(` [${pub.primaryClass}]   |   DOI: `, doiPrefixX, y, fontRegular, 8, colorMuted);
    const doiX = doiPrefixX + fontRegular.widthOfTextAtSize(` [${pub.primaryClass}]   |   DOI: `, 8);
    drawLink(pub.doi, doiX, y, fontRegular, 8, colorLink, `https://doi.org/${pub.doi}`);

    y -= 14;
  });

  // ── 4. APPOINTMENTS & WORK EXPERIENCE ────────────────────────────────
  drawSectionHeading("Academic Appointments & Work Experience");

  cvData.work_experience.forEach((w) => {
    checkPageBreak(45);
    const period = formatPeriod(w.start_year, w.start_month, w.end_year, w.end_month, w.current);

    drawText(w.position, marginX, y, fontBold, 9.5, colorText);
    const perWidth = fontBoldItalic.widthOfTextAtSize(period, 8.5);
    drawText(period, pageWidth - marginX - perWidth, y, fontBoldItalic, 8.5, colorMuted);
    y -= 11;

    drawText(`${w.institutions.join(" & ")} - ${w.location} (${w.working_time})`, marginX, y, fontItalic, 8.5, colorPrimary);
    y -= 10;

    if (w.courses && w.courses.length > 0) {
      const courseStr = `Modules taught: ${w.courses.join(", ")}.`;
      y = drawWrappedText(courseStr, marginX + 12, y, contentWidth - 12, fontRegular, 8, colorText, 10.5);
      y -= 2;
    }

    if (w.tasks && w.tasks.length > 0) {
      w.tasks.forEach((task) => {
        drawBullet(marginX + 6, y);
        y = drawWrappedText(task, marginX + 14, y, contentWidth - 14, fontRegular, 7.8, colorText, 10);
      });
      y -= 2;
    }
    y -= 3;
  });

  // ── 5. HONOURS, AWARDS & GRANTS ──────────────────────────────────────
  // (Reads dynamically from cvData.awards_and_grants)
  drawSectionHeading("Honours, Awards & Grants");

  const awardsList = cvData.awards_and_grants || [];

  awardsList.forEach((aw) => {
    checkPageBreak(22);
    drawBullet(marginX + 2, y);
    drawText(aw.title, marginX + 10, y, fontBold, 8.5, colorText);
    const awPerWidth = fontBoldItalic.widthOfTextAtSize(aw.period, 8);
    drawText(aw.period, pageWidth - marginX - awPerWidth, y, fontBoldItalic, 8, colorMuted);
    y -= 10;

    const sponsorText = aw.sponsors && aw.sponsors.length > 0 ? ` (Sponsors: ${aw.sponsors.join(", ")})` : "";
    const detailLine = `${aw.organization} - ${aw.description || ""}${sponsorText}`;
    y = drawWrappedText(detailLine, marginX + 10, y, contentWidth - 10, fontItalic, 7.5, colorMuted, 9.5);
    y -= 2;
  });

  // ── 6. RESEARCH GROUPS & AFFILIATIONS ─────────────────────────────────
  drawSectionHeading("Research Groups & Affiliations");

  cvData.groups.forEach((g) => {
    checkPageBreak(16);
    drawBullet(marginX + 2, y);

    if (g.name.includes("Ben Hoare")) {
      drawLink(g.name, marginX + 10, y, fontBold, 8.5, colorLink, "https://www.benhoare.info/");
    } else {
      drawText(g.name, marginX + 10, y, fontBold, 8.5, colorText);
    }

    const range = g.current ? `${g.start_year} - Present` : `${g.start_year} - ${g.end_year}`;
    const rWidth = fontBoldItalic.widthOfTextAtSize(range, 8);
    drawText(range, pageWidth - marginX - rWidth, y, fontBoldItalic, 8, colorMuted);
    y -= 9.5;

    drawText(g.institution, marginX + 10, y, fontItalic, 7.8, colorPrimary);
    y -= 9;
  });

  // ── 7. CONFERENCES (SEPARATED & ENHANCED) ─────────────────────────────
  drawSectionHeading("Conferences & Symposia (Grouped by Series)");

  cvData.conferences.forEach((conf) => {
    checkPageBreak(35);
    const confTitle = `${conf.title}  [${conf.editions.length} edition${conf.editions.length > 1 ? "s" : ""}]`;
    drawText(confTitle, marginX, y, fontBold, 9, colorPrimary);
    y -= 11;

    conf.editions.forEach((ed) => {
      checkPageBreak(22);
      const role = ed.presentation_type || "Attendee";
      const edDate = `${getMonthName(ed.month)} ${ed.year}`;
      const roleColor = role === "Speaker" ? colorPrimary : role === "Poster" ? colorLink : colorText;

      drawBullet(marginX + 6, y);
      drawText(`[${role}]`, marginX + 12, y, fontBold, 8, roleColor);
      const roleWidth = fontBold.widthOfTextAtSize(`[${role}] `, 8);
      drawText(`${ed.edition} - ${ed.location || ""}`, marginX + 12 + roleWidth, y, fontRegular, 8, colorText);

      const dWidth = fontBoldItalic.widthOfTextAtSize(edDate, 8);
      drawText(edDate, pageWidth - marginX - dWidth, y, fontBoldItalic, 8, colorMuted);
      y -= 9.5;

      if (ed.sponsors && ed.sponsors.length > 0) {
        const spStr = `Sponsors: ${ed.sponsors.join(", ")}`;
        y = drawWrappedText(spStr, marginX + 16, y, contentWidth - 16, fontItalic, 7, colorMuted, 9);
      }
    });
    y -= 3;
  });

  // ── 8. SEMINARS (SEPARATED & ENHANCED) ────────────────────────────────
  drawSectionHeading("Seminars & Colloquia (Grouped by Series)");

  cvData.seminars.forEach((sem) => {
    checkPageBreak(35);
    const semTitle = `${sem.title}  [${sem.editions.length} edition${sem.editions.length > 1 ? "s" : ""}]`;
    drawText(semTitle, marginX, y, fontBold, 9, colorPrimary);
    y -= 11;

    sem.editions.forEach((ed) => {
      checkPageBreak(22);
      const role = ed.presentation_type || "Attendee";
      const edDate = `${getMonthName(ed.month)} ${ed.year}`;
      const roleColor = role === "Speaker" ? colorPrimary : colorText;

      drawBullet(marginX + 6, y);
      drawText(`[${role}]`, marginX + 12, y, fontBold, 8, roleColor);
      const roleWidth = fontBold.widthOfTextAtSize(`[${role}] `, 8);
      drawText(`${ed.edition} - ${ed.location || ""}`, marginX + 12 + roleWidth, y, fontRegular, 8, colorText);

      const dWidth = fontBoldItalic.widthOfTextAtSize(edDate, 8);
      drawText(edDate, pageWidth - marginX - dWidth, y, fontBoldItalic, 8, colorMuted);
      y -= 9.5;

      if (ed.sponsors && ed.sponsors.length > 0) {
        const spStr = `Sponsors: ${ed.sponsors.join(", ")}`;
        y = drawWrappedText(spStr, marginX + 16, y, contentWidth - 16, fontItalic, 7, colorMuted, 9);
      }
    });
    y -= 3;
  });

  // ── 9. ADVANCED SCHOOLS & WORKSHOPS ──────────────────────────────────
  drawSectionHeading("Advanced Schools & Workshops");

  cvData.schools_and_workshops.forEach((sw) => {
    checkPageBreak(25);
    drawText(sw.title, marginX, y, fontBold, 8.5, colorText);
    y -= 10;

    sw.editions.forEach((ed) => {
      checkPageBreak(18);
      const edDate = `${getMonthName(ed.month)} ${ed.year}`;
      drawBullet(marginX + 4, y);
      drawText(`${ed.edition} - ${ed.location || ""}`, marginX + 12, y, fontRegular, 8, colorText);
      const dWidth = fontBoldItalic.widthOfTextAtSize(edDate, 8);
      drawText(edDate, pageWidth - marginX - dWidth, y, fontBoldItalic, 8, colorMuted);
      y -= 9;

      if (ed.sponsors && ed.sponsors.length > 0) {
        const spStr = `Sponsors: ${ed.sponsors.join(", ")}`;
        y = drawWrappedText(spStr, marginX + 14, y, contentWidth - 14, fontItalic, 7, colorMuted, 9);
      }
    });
    y -= 2;
  });

  // ── 10. COMPETITIONS & CERTIFICATION PROGRAMS ────────────────────────
  drawSectionHeading("Competitions & Certification Programs");

  cvData.competitions.forEach((comp) => {
    checkPageBreak(20);
    drawText(`Competition: ${comp.title}`, marginX, y, fontBold, 8.5, colorText);
    y -= 10;

    comp.editions.forEach((ed) => {
      checkPageBreak(15);
      const name = ed.name ? `${ed.name} | ` : "";
      const sp = ed.sponsors && ed.sponsors.length > 0 ? ` (${ed.sponsors.slice(0, 3).join(", ")})` : "";
      const edDate = `${getMonthName(ed.month)} ${ed.year}`;
      const cLine = `${name}${ed.location}${sp}`;

      drawBullet(marginX + 4, y);
      drawText(cLine, marginX + 12, y, fontRegular, 7.5, colorText);
      const dWidth = fontRegular.widthOfTextAtSize(edDate, 7.5);
      drawText(edDate, pageWidth - marginX - dWidth, y, fontRegular, 7.5, colorMuted);
      y -= 9.5;
    });
    y -= 2;
  });

  if (cvData.certification_programs) {
    cvData.certification_programs.forEach((cp) => {
      checkPageBreak(20);
      drawText(`Certification: ${cp.title}`, marginX, y, fontBold, 8.5, colorText);
      y -= 10;

      cp.editions.forEach((ed) => {
        checkPageBreak(15);
        const sp = ed.sponsors ? ` | ${ed.sponsors.join(", ")}` : "";
        const cpLine = `${ed.location} [${ed.start_year}-${ed.end_year}, ${ed.duration}]${sp}`;
        drawBullet(marginX + 4, y);
        y = drawWrappedText(cpLine, marginX + 12, y, contentWidth - 12, fontRegular, 7.5, colorMuted, 9.5);
      });
      y -= 2;
    });
  }

  // ── 11. TECHNICAL & SCIENTIFIC SKILLS ────────────────────────────────
  drawSectionHeading("Technical & Scientific Skills");

  cvData.skills.forEach((sk) => {
    checkPageBreak(15);
    drawBullet(marginX + 2, y);
    const catPrefix = `${sk.category}: `;
    drawText(catPrefix, marginX + 10, y, fontBold, 8, colorText);
    const catWidth = fontBold.widthOfTextAtSize(catPrefix, 8);
    const skillList = sk.skills.join(", ");
    y = drawWrappedText(skillList, marginX + 10 + catWidth, y, contentWidth - 10 - catWidth, fontRegular, 8, colorText, 10.5);
  });
  y -= 4;

  // ── 12. DEVELOPED APPLICATIONS & DATASETS ────────────────────────────
  drawSectionHeading("Developed Applications & Scientific Datasets");

  // Clickable applications portfolio link
  const appPortPrefix = "Web Applications Portfolio: ";
  drawText(appPortPrefix, marginX, y, fontBoldItalic, 8.5, colorPrimary);
  const appPortX = marginX + fontBoldItalic.widthOfTextAtSize(appPortPrefix, 8.5);
  drawLink(cvData.developed_applications.applications_link, appPortX, y, fontRegular, 8.5, colorLink, cvData.developed_applications.applications_link);
  y -= 13;

  cvData.developed_applications.applications.forEach((cat) => {
    checkPageBreak(30);
    drawText(cat.category.toUpperCase(), marginX, y, fontBold, 8, colorPrimary);
    y -= 10;

    cat.apps.forEach((app) => {
      checkPageBreak(25);
      drawBullet(marginX + 4, y);

      const startX = marginX + 12;
      let titleW = 0;
      if (app.link) {
        titleW = drawLink(app.name, startX, y, fontBold, 8, colorLink, app.link);
      } else {
        titleW = drawText(app.name, startX, y, fontBold, 8, colorText);
      }

      const sep = " - ";
      const sepW = fontRegular.widthOfTextAtSize(sep, 8);
      const firstLineStartX = startX + titleW + sepW;
      const availFirstLineW = contentWidth - (firstLineStartX - marginX);

      if (availFirstLineW >= 140) {
        drawText(sep, startX + titleW, y, fontRegular, 8, colorMuted);
        y = drawHangingWrappedText(
          app.description,
          firstLineStartX,
          startX + 6,
          y,
          availFirstLineW,
          contentWidth - 18,
          fontRegular,
          7.8,
          colorText,
          10
        );
      } else {
        y -= 9.5;
        y = drawWrappedText(app.description, startX + 6, y, contentWidth - 18, fontRegular, 7.8, colorText, 10);
      }
      y -= 2;
    });
    y -= 4;
  });

  if (cvData.generated_datasets && cvData.generated_datasets.datasets) {
    checkPageBreak(30);
    y -= 2;
    const dsPortPrefix = "Curated Scientific Datasets: ";
    drawText(dsPortPrefix, marginX, y, fontBoldItalic, 8.5, colorPrimary);
    const dsPortX = marginX + fontBoldItalic.widthOfTextAtSize(dsPortPrefix, 8.5);
    drawLink(cvData.generated_datasets.datasets_link, dsPortX, y, fontRegular, 8.5, colorLink, cvData.generated_datasets.datasets_link);
    y -= 12;

    cvData.generated_datasets.datasets.forEach((ds) => {
      checkPageBreak(25);
      drawBullet(marginX + 4, y);

      const startX = marginX + 12;
      let titleW = 0;
      if (ds.link) {
        titleW = drawLink(ds.name, startX, y, fontBold, 8, colorLink, ds.link);
      } else {
        titleW = drawText(ds.name, startX, y, fontBold, 8, colorText);
      }

      const sep = " - ";
      const sepW = fontRegular.widthOfTextAtSize(sep, 8);
      const firstLineStartX = startX + titleW + sepW;
      const availFirstLineW = contentWidth - (firstLineStartX - marginX);

      if (availFirstLineW >= 140) {
        drawText(sep, startX + titleW, y, fontRegular, 8, colorMuted);
        y = drawHangingWrappedText(
          ds.description,
          firstLineStartX,
          startX + 6,
          y,
          availFirstLineW,
          contentWidth - 18,
          fontRegular,
          7.8,
          colorText,
          10
        );
      } else {
        y -= 9.5;
        y = drawWrappedText(ds.description, startX + 6, y, contentWidth - 18, fontRegular, 7.8, colorText, 10);
      }
      y -= 3;
    });
  }
  y -= 4;

  // ── 13. COURSE-BASED & TECHNICAL PROJECTS ────────────────────────────
  // (Strictly placed right before Coursework!)
  drawSectionHeading("Course-Based & Technical Projects");

  const projectsList = cvData.projects || [];

  projectsList.forEach((proj) => {
    checkPageBreak(18);
    drawBullet(marginX + 2, y);
    const pTitle = `"${proj.title}"`;
    drawText(pTitle, marginX + 10, y, fontBold, 8, colorText);
    const pMeta = `${proj.course} (${proj.semester} ${proj.year})`;
    const pMetaWidth = fontItalic.widthOfTextAtSize(pMeta, 7.5);
    drawText(pMeta, pageWidth - marginX - pMetaWidth, y, fontItalic, 7.5, colorMuted);
    y -= 9.5;
  });
  y -= 4;

  // ── 14. COMPREHENSIVE ACADEMIC COURSEWORK ────────────────────────────
  // (Strictly placed right before References!)
  drawSectionHeading("Comprehensive Academic Coursework");

  const mscEdu = cvData.education.find((e) => e.degree.includes("MSc"));
  if (mscEdu && mscEdu.coursework) {
    checkPageBreak(25);
    drawText("Durham University - MSc in Particles, Strings and Cosmology:", marginX, y, fontBold, 8.5, colorPrimary);
    y -= 10;

    mscEdu.coursework.forEach((cw) => {
      checkPageBreak(16);
      drawBullet(marginX + 4, y);
      const catPrefix = `${cw.category}: `;
      drawText(catPrefix, marginX + 12, y, fontBold, 7.5, colorText);
      const catW = fontBold.widthOfTextAtSize(catPrefix, 7.5);
      const coursesStr = cw.courses.join(", ");
      y = drawWrappedText(coursesStr, marginX + 12 + catW, y, contentWidth - 12 - catW, fontRegular, 7.5, colorText, 9.8);
    });
    y -= 4;
  }

  const bscEdu = cvData.education.find((e) => e.degree.includes("BSc"));
  if (bscEdu && bscEdu.coursework) {
    checkPageBreak(25);
    drawText("Birzeit University - BSc in Physics (Minor Mathematics):", marginX, y, fontBold, 8.5, colorPrimary);
    y -= 10;

    bscEdu.coursework.forEach((cw) => {
      checkPageBreak(16);
      drawBullet(marginX + 4, y);
      const catPrefix = `${cw.category}: `;
      drawText(catPrefix, marginX + 12, y, fontBold, 7.5, colorText);
      const catW = fontBold.widthOfTextAtSize(catPrefix, 7.5);
      const coursesStr = cw.courses.join(", ");
      y = drawWrappedText(coursesStr, marginX + 12 + catW, y, contentWidth - 12 - catW, fontRegular, 7.5, colorText, 9.8);
    });
    y -= 4;
  }

  // ── 15. ACADEMIC REFEREES ────────────────────────────────────────────
  drawSectionHeading("Academic Referees");

  cvData.referees.forEach((ref) => {
    checkPageBreak(24);
    drawBullet(marginX + 2, y);
    drawText(ref.name, marginX + 10, y, fontBold, 8.5, colorText);

    const relStr = `(${ref.relationship})`;
    const relWidth = fontItalic.widthOfTextAtSize(relStr, 8);
    drawText(relStr, pageWidth - marginX - relWidth, y, fontItalic, 8, colorMuted);
    y -= 10;

    let refLineX = marginX + 10;
    refLineX += drawText(`${ref.affiliation}   |   Email: `, refLineX, y, fontRegular, 7.5, colorText);
    refLineX += drawLink(ref.email, refLineX, y, fontRegular, 7.5, colorLink, `mailto:${ref.email}`);

    if (ref.webpage) {
      refLineX += drawText("   |   Web: ", refLineX, y, fontRegular, 7.5, colorText);
      drawLink(ref.webpage, refLineX, y, fontRegular, 7.5, colorLink, ref.webpage);
    }
    y -= 11;
  });

  // ── FOOTERS ON ALL PAGES (With Clickable Website Link) ───────────────
  const totalPages = doc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const page = doc.getPage(i);

    // Subtle LaTeX footer line
    page.drawLine({
      start: { x: marginX, y: 28 },
      end: { x: pageWidth - marginX, y: 28 },
      thickness: 0.5,
      color: colorLightRule,
    });

    const pageStr = `Page ${i + 1} of ${totalPages}   |   `;
    const webStr = "xurashad.github.io";
    const pWidth = fontRegular.widthOfTextAtSize(pageStr, 7.5);
    const wWidth = fontRegular.widthOfTextAtSize(webStr, 7.5);
    const footStartX = (pageWidth - (pWidth + wWidth)) / 2;

    page.drawText(pageStr, {
      x: footStartX,
      y: 18,
      size: 7.5,
      font: fontRegular,
      color: colorMuted,
    });

    page.drawText(webStr, {
      x: footStartX + pWidth,
      y: 18,
      size: 7.5,
      font: fontRegular,
      color: colorLink,
    });

    const footLinkAnnot = doc.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [footStartX + pWidth, 16, footStartX + pWidth + wWidth, 26],
      Border: [0, 0, 0],
      A: {
        Type: "Action",
        S: "URI",
        URI: PDFString.of("https://xurashad.github.io/"),
      },
    });
    const footLinkRef = doc.context.register(footLinkAnnot);
    page.node.addAnnot(footLinkRef);
  }

  const pdfBytes = await doc.save();

  // Save to public/documents/cv.pdf and public/cv/cv.pdf
  const targetDir1 = path.join(rootDir, "public", "documents");
  const targetDir2 = path.join(rootDir, "public", "cv");

  if (!fs.existsSync(targetDir1)) fs.mkdirSync(targetDir1, { recursive: true });
  if (!fs.existsSync(targetDir2)) fs.mkdirSync(targetDir2, { recursive: true });

  const outPath1 = path.join(targetDir1, "cv.pdf");
  const outPath2 = path.join(targetDir2, "cv.pdf");

  fs.writeFileSync(outPath1, pdfBytes);
  fs.writeFileSync(outPath2, pdfBytes);

  console.log(`✅ CV PDF successfully generated!`);
  console.log(`   Pages: ${totalPages}`);
  console.log(`   Size: ${(pdfBytes.length / 1024).toFixed(1)} KB`);
  console.log(`   Saved to: ${outPath1} and ${outPath2}`);
}

generatePDF().catch((err) => {
  console.error("❌ Failed to generate CV PDF:", err);
  process.exit(1);
});
