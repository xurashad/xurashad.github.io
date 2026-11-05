/**
 * Concise / Shortened LaTeX-Style Academic PDF Generator for Rashad Hamidi's CV
 * Compiles public/cv/cv.json into a streamlined, high-density LaTeX-styled academic PDF.
 *
 * Specific customizations:
 * 1. Removed Pre-University Secondary Education
 * 2. Shortened Pre-University Competitions to a concise inline summary
 * 3. Shortened Developed Applications & Scientific Datasets (no descriptions, listed inline by category)
 * 4. Shortened Seminars & Colloquia (title, edition, and year lined next to each other)
 * 5. Shortened Conferences & Symposia (title, edition, and year lined next to each other)
 * 6. Research Groups & Affiliations (group name and institution on the exact same line)
 *
 * Output: public/documents/cv-short.pdf and public/cv/cv-short.pdf
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

async function generateShortPDF() {
  const doc = await PDFDocument.create();
  doc.setTitle("Curriculum Vitae (Concise) - Rashad Hamidi");
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
  const marginTop = 42;
  const marginBottom = 42;
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
    checkPageBreak(65);
    y -= 14;
    currentPage.drawText(cleanWinAnsi(title).toUpperCase(), {
      x: marginX,
      y,
      size: 10,
      font: fontBold,
      color: colorPrimary,
    });
    y -= 4;
    currentPage.drawLine({
      start: { x: marginX, y },
      end: { x: pageWidth - marginX, y },
      thickness: 0.8,
      color: colorRule,
    });
    y -= 8;
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

  function drawWrappedText(text, x, startY, maxWidth, font, size, color, lineHeight = 11.5) {
    const cleaned = cleanWinAnsi(text);
    const words = cleaned.replace(/\r\n/g, " ").replace(/\n/g, " ").split(" ").filter(Boolean);
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

  function drawHangingWrappedText(
    text,
    xFirst,
    xSubsequent,
    startY,
    maxWidthFirst,
    maxWidthSubsequent,
    font,
    size,
    color,
    lineHeight = 10.5
  ) {
    const cleaned = cleanWinAnsi(text);
    const words = cleaned.replace(/\r\n/g, " ").replace(/\n/g, " ").split(" ").filter(Boolean);
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
        currentPage.drawText(currentLine, {
          x: isFirst ? xFirst : xSubsequent,
          y: curY,
          size,
          font,
          color,
        });
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
      currentPage.drawText(currentLine, {
        x: isFirst ? xFirst : xSubsequent,
        y: curY,
        size,
        font,
        color,
      });
      curY -= lineHeight;
    }

    return curY;
  }

  // Extract Personal Info
  const info = cvData.personal_info || {};
  const name = info.name || "Rashad Hamidi";
  const title = info.title || "PhD Researcher in Mathematical and Theoretical Physics";
  const institution = info.institution || "Durham University";
  const location = info.location || cvData.links?.location || "London, UK";
  const email = info.email || cvData.links?.email || "xurashad@gmail.com";
  const website = info.website || cvData.links?.website || "https://xurashad.github.io/";
  const orcid = info.orcid || cvData.links?.orcid || "0000-0002-0719-3269";
  const inspirehep = info.inspirehep || cvData.links?.inspirehep || "2915639";

  // ── HEADER (LaTeX Formal Centered Layout) ─────────────────────────────
  const nameClean = cleanWinAnsi(name.toUpperCase());
  const nameWidth = fontBold.widthOfTextAtSize(nameClean, 21);
  drawText(nameClean, (pageWidth - nameWidth) / 2, y, fontBold, 21, colorPrimary);

  y -= 14;
  const subClean = cleanWinAnsi(`${title} - ${institution}`);
  const subWidth = fontItalic.widthOfTextAtSize(subClean, 9.5);
  drawText(subClean, (pageWidth - subWidth) / 2, y, fontItalic, 9.5, colorText);

  y -= 12;
  // Contact line 1 (Centered with links)
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
  currentPage.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 1,
    color: colorRule,
  });
  y -= 4;

  // ── 1. RESEARCH PROFILE & INTERESTS ──────────────────────────────────
  drawSectionHeading("Research Profile & Interests");
  const topicsStr = `Core Research Areas: ${cvData.research_interests.topics.join("  |  ")}`;
  drawText(topicsStr, marginX, y, fontBold, 8.5, colorPrimary);
  y -= 12;

  y = drawWrappedText(cvData.research_interests.description, marginX, y, contentWidth, fontRegular, 8.5, colorText, 11);
  y -= 2;
  y = drawWrappedText(`Vision: ${cvData.research_interests.vision}`, marginX, y, contentWidth, fontItalic, 8.5, colorMuted, 11);
  y -= 3;

  // ── 2. EDUCATION & ACADEMIC BACKGROUND ───────────────────────────────
  // (Requirement 1: Pre-University Secondary Education is REMOVED)
  drawSectionHeading("Education & Academic Background");

  cvData.education.forEach((edu) => {
    checkPageBreak(45);
    const dateRange = formatPeriod(edu.start_year, edu.start_month, edu.end_year, edu.end_month, !edu.end_year);

    drawText(edu.degree, marginX, y, fontBold, 9, colorText);
    const dateWidth = fontBoldItalic.widthOfTextAtSize(dateRange, 8.5);
    drawText(dateRange, pageWidth - marginX - dateWidth, y, fontBoldItalic, 8.5, colorMuted);
    y -= 11;

    const instLine = `${edu.institution}, ${edu.department} - ${edu.location}`;
    drawText(instLine, marginX, y, fontItalic, 8.5, colorPrimary);
    y -= 10;

    if (edu.degree_achievement) {
      drawText(`Degree Achievement: ${edu.degree_achievement}`, marginX + 10, y, fontBold, 8, colorPrimary);
      y -= 10;
    }

    if (edu.supervisor) {
      const supPrefix = "Supervisor: ";
      drawText(supPrefix, marginX + 10, y, fontRegular, 8, colorText);
      const supX = marginX + 10 + fontRegular.widthOfTextAtSize(supPrefix, 8);
      if (edu.supervisor.includes("Ben Hoare")) {
        drawLink(edu.supervisor, supX, y, fontRegular, 8, colorLink, "https://www.benhoare.info/");
      } else {
        drawText(edu.supervisor, supX, y, fontRegular, 8, colorText);
      }
      y -= 10;
    }

    if (edu.thesis_title) {
      y = drawWrappedText(`Thesis: "${edu.thesis_title}"`, marginX + 10, y, contentWidth - 10, fontRegular, 8, colorMuted, 10);
      y -= 2;
    }

    if (edu.research_topics && edu.research_topics.length > 0) {
      const topStr = `Focus: ${edu.research_topics.join(", ")}`;
      y = drawWrappedText(topStr, marginX + 10, y, contentWidth - 10, fontItalic, 7.5, colorMuted, 9.5);
    }
    y -= 3;
  });

  // ── 3. PUBLICATIONS & PREPRINTS ──────────────────────────────────────
  drawSectionHeading("Publications & Preprints");

  cvData.publications.forEach((pub, idx) => {
    checkPageBreak(40);
    drawText(`[${idx + 1}]`, marginX, y, fontBold, 8.5, colorPrimary);

    const authorsStr = pub.authors.join(", ");
    drawText(authorsStr, marginX + 16, y, fontBold, 8.5, colorText);
    y -= 10.5;

    const titleText = `"${pub.title}"`;
    drawLink(titleText, marginX + 16, y, fontBoldItalic, 8.5, colorPrimary, `https://doi.org/${pub.doi}`);
    y -= 10.5;

    const jnlCitation = `${pub.journal} ${pub.volume} (${pub.year}) ${pub.pages}`;
    drawText(jnlCitation, marginX + 16, y, fontRegular, 8, colorText);
    const jnlWidth = fontRegular.widthOfTextAtSize(jnlCitation, 8);

    drawText("   |   arXiv: ", marginX + 16 + jnlWidth, y, fontRegular, 8, colorMuted);
    const arxivX = marginX + 16 + jnlWidth + fontRegular.widthOfTextAtSize("   |   arXiv: ", 8);
    const arxivWidth = drawLink(pub.eprint, arxivX, y, fontRegular, 8, colorLink, `https://arxiv.org/abs/${pub.eprint}`);

    const doiPrefixX = arxivX + arxivWidth;
    drawText(` [${pub.primaryClass}]   |   DOI: `, doiPrefixX, y, fontRegular, 8, colorMuted);
    const doiX = doiPrefixX + fontRegular.widthOfTextAtSize(` [${pub.primaryClass}]   |   DOI: `, 8);
    drawLink(pub.doi, doiX, y, fontRegular, 8, colorLink, `https://doi.org/${pub.doi}`);

    y -= 12;
  });

  // ── 4. APPOINTMENTS & WORK EXPERIENCE ────────────────────────────────
  drawSectionHeading("Academic Appointments & Work Experience");

  cvData.work_experience.forEach((w) => {
    checkPageBreak(40);
    const period = formatPeriod(w.start_year, w.start_month, w.end_year, w.end_month, w.current);

    drawText(w.position, marginX, y, fontBold, 9, colorText);
    const perWidth = fontBoldItalic.widthOfTextAtSize(period, 8.5);
    drawText(period, pageWidth - marginX - perWidth, y, fontBoldItalic, 8.5, colorMuted);
    y -= 10.5;

    drawText(`${w.institutions.join(" & ")} - ${w.location} (${w.working_time})`, marginX, y, fontItalic, 8.5, colorPrimary);
    y -= 9.5;

    if (w.courses && w.courses.length > 0) {
      const courseStr = `Modules taught: ${w.courses.join(", ")}.`;
      y = drawWrappedText(courseStr, marginX + 10, y, contentWidth - 10, fontRegular, 8, colorText, 10);
      y -= 2;
    }

    if (w.tasks && w.tasks.length > 0) {
      w.tasks.forEach((task) => {
        drawBullet(marginX + 4, y);
        y = drawWrappedText(task, marginX + 12, y, contentWidth - 12, fontRegular, 7.8, colorText, 9.8);
      });
      y -= 1;
    }
    y -= 2.5;
  });

  // ── 5. HONOURS, AWARDS & GRANTS ──────────────────────────────────────
  drawSectionHeading("Honours, Awards & Grants");

  const awardsList = cvData.awards_and_grants || [];
  awardsList.forEach((aw) => {
    checkPageBreak(20);
    drawBullet(marginX + 2, y);
    drawText(aw.title, marginX + 10, y, fontBold, 8.5, colorText);
    const awPerWidth = fontBoldItalic.widthOfTextAtSize(aw.period, 8);
    drawText(aw.period, pageWidth - marginX - awPerWidth, y, fontBoldItalic, 8, colorMuted);
    y -= 9.5;

    const sponsorText = aw.sponsors && aw.sponsors.length > 0 ? ` (Sponsors: ${aw.sponsors.join(", ")})` : "";
    const detailLine = `${aw.organization} - ${aw.description || ""}${sponsorText}`;
    y = drawWrappedText(detailLine, marginX + 10, y, contentWidth - 10, fontItalic, 7.5, colorMuted, 9.5);
    y -= 1.5;
  });

  // ── 6. RESEARCH GROUPS & AFFILIATIONS ─────────────────────────────────
  // (Requirement 6: Institution on the exact same line as the group name)
  drawSectionHeading("Research Groups & Affiliations");

  cvData.groups.forEach((g) => {
    checkPageBreak(15);
    drawBullet(marginX + 2, y);

    const range = g.current ? `${g.start_year} - Present` : `${g.start_year} - ${g.end_year}`;
    const rWidth = fontBoldItalic.widthOfTextAtSize(range, 8);
    drawText(range, pageWidth - marginX - rWidth, y, fontBoldItalic, 8, colorMuted);

    let curGroupX = marginX + 10;
    if (g.name.includes("Ben Hoare")) {
      curGroupX += drawLink(g.name, curGroupX, y, fontBold, 8.5, colorLink, "https://www.benhoare.info/");
    } else {
      curGroupX += drawText(g.name, curGroupX, y, fontBold, 8.5, colorText);
    }

    const instStr = `, ${g.institution}`;
    drawText(instStr, curGroupX, y, fontItalic, 8, colorPrimary);
    y -= 10.5;
  });
  y -= 2;

  // ── 7. CONFERENCES & SYMPOSIA ─────────────────────────────────────────
  // (Requirement 5: Shortened - title, edition, and year lined next to each other)
  drawSectionHeading("Conferences & Symposia");

  cvData.conferences.forEach((conf) => {
    checkPageBreak(22);
    drawBullet(marginX + 2, y);

    const titleStr = `${conf.title}: `;
    const titleW = fontBold.widthOfTextAtSize(titleStr, 8.5);

    // Build editions string with edition name, role if Speaker/Poster, and year
    const editionsSummary = conf.editions
      .map((ed) => {
        const roleTag =
          ed.presentation_type === "Speaker"
            ? " [Speaker]"
            : ed.presentation_type === "Poster"
              ? " [Poster]"
              : "";
        // Strip duplicate trailing year from edition if already present (e.g. "Wrocław 2026" -> "Wrocław (2026)")
        const cleanEd = ed.edition.replace(/\s*\d{4}$/, "").trim();
        return `${cleanEd}${roleTag} (${ed.year})`;
      })
      .join(", ");

    if (contentWidth - 10 - titleW >= 140) {
      drawText(titleStr, marginX + 10, y, fontBold, 8.5, colorPrimary);
      y = drawHangingWrappedText(
        editionsSummary,
        marginX + 10 + titleW,
        marginX + 10,
        y,
        contentWidth - 10 - titleW,
        contentWidth - 10,
        fontRegular,
        8,
        colorText,
        10
      );
    } else {
      drawText(conf.title, marginX + 10, y, fontBold, 8.5, colorPrimary);
      y -= 9.5;
      y = drawWrappedText(editionsSummary, marginX + 10, y, contentWidth - 10, fontRegular, 8, colorText, 10);
    }
    y -= 1.5;
  });
  y -= 2;

  // ── 8. SEMINARS & COLLOQUIA ──────────────────────────────────────────
  // (Requirement 4: Shortened - title, edition, and year lined next to each other)
  drawSectionHeading("Seminars & Colloquia");

  cvData.seminars.forEach((sem) => {
    checkPageBreak(22);
    drawBullet(marginX + 2, y);

    const cleanTitle = sem.title.replace("Siminars", "Seminars");
    const titleStr = `${cleanTitle}: `;
    const titleW = fontBold.widthOfTextAtSize(titleStr, 8.5);

    const editionsSummary = sem.editions
      .map((ed) => {
        const roleTag = ed.presentation_type === "Speaker" ? " [Speaker]" : "";
        const city = ed.city || (ed.location ? ed.location.split(",")[0].trim() : "");
        const cityStr = city ? `${city}, ` : "";
        return `${ed.edition}${roleTag} (${cityStr}${ed.year})`;
      })
      .join(", ");

    if (contentWidth - 10 - titleW >= 140) {
      drawText(titleStr, marginX + 10, y, fontBold, 8.5, colorPrimary);
      y = drawHangingWrappedText(
        editionsSummary,
        marginX + 10 + titleW,
        marginX + 10,
        y,
        contentWidth - 10 - titleW,
        contentWidth - 10,
        fontRegular,
        8,
        colorText,
        10
      );
    } else {
      drawText(cleanTitle, marginX + 10, y, fontBold, 8.5, colorPrimary);
      y -= 9.5;
      y = drawWrappedText(editionsSummary, marginX + 10, y, contentWidth - 10, fontRegular, 8, colorText, 10);
    }
    y -= 1.5;
  });
  y -= 2;

  // ── 9. ADVANCED SCHOOLS & WORKSHOPS ──────────────────────────────────
  drawSectionHeading("Advanced Schools & Workshops");

  cvData.schools_and_workshops.forEach((sw) => {
    checkPageBreak(20);
    drawBullet(marginX + 2, y);

    const titleStr = `${sw.title}: `;
    const titleW = fontBold.widthOfTextAtSize(titleStr, 8.5);

    const editionsSummary = sw.editions
      .map((ed) => {
        const cleanEd = ed.edition.replace(/\s*\d{4}$/, "").trim();
        return `${cleanEd} (${ed.year})`;
      })
      .join(", ");

    if (contentWidth - 10 - titleW >= 140) {
      drawText(titleStr, marginX + 10, y, fontBold, 8.5, colorPrimary);
      y = drawHangingWrappedText(
        editionsSummary,
        marginX + 10 + titleW,
        marginX + 10,
        y,
        contentWidth - 10 - titleW,
        contentWidth - 10,
        fontRegular,
        8,
        colorText,
        10
      );
    } else {
      drawText(sw.title, marginX + 10, y, fontBold, 8.5, colorPrimary);
      y -= 9.5;
      y = drawWrappedText(editionsSummary, marginX + 10, y, contentWidth - 10, fontRegular, 8, colorText, 10);
    }
    y -= 1.5;
  });
  y -= 2;

  // ── 10. COMPETITIONS & CERTIFICATION PROGRAMS ────────────────────────
  // (Requirement 2: Shorten Pre-University Competitions)
  drawSectionHeading("Competitions & Certification Programs");

  cvData.competitions.forEach((comp) => {
    checkPageBreak(18);

    if (comp.title.toLowerCase().includes("pre-university")) {
      drawBullet(marginX + 2, y);
      const titlePrefix = "Pre-University Competitions: ";
      const pfxW = fontBold.widthOfTextAtSize(titlePrefix, 8.5);

      // Concisely summarize editions and years without lengthy sponsor text
      const seen = new Set();
      const compactItems = [];
      comp.editions.forEach((ed) => {
        const key = `${ed.name} (${ed.year})`;
        if (!seen.has(key)) {
          seen.add(key);
          compactItems.push(key);
        }
      });
      const editionsStr = `${compactItems.join(", ")} (Palestine, 2012-2015).`;

      drawText(titlePrefix, marginX + 10, y, fontBold, 8.5, colorPrimary);
      y = drawHangingWrappedText(
        editionsStr,
        marginX + 10 + pfxW,
        marginX + 10,
        y,
        contentWidth - 10 - pfxW,
        contentWidth - 10,
        fontRegular,
        8,
        colorText,
        10
      );
      y -= 1.5;
    } else {
      // University competitions (e.g. DurHack)
      drawBullet(marginX + 2, y);
      drawText(comp.title, marginX + 10, y, fontBold, 8.5, colorText);
      const ed = comp.editions[0];
      if (ed) {
        const edDate = `${getMonthName(ed.month)} ${ed.year}`;
        const loc = ed.location ? ` - ${ed.location}` : "";
        const titleW = fontBold.widthOfTextAtSize(comp.title, 8.5);
        drawText(loc, marginX + 10 + titleW, y, fontItalic, 8, colorPrimary);
        const dWidth = fontBoldItalic.widthOfTextAtSize(edDate, 8);
        drawText(edDate, pageWidth - marginX - dWidth, y, fontBoldItalic, 8, colorMuted);
      }
      y -= 10.5;
    }
  });

  if (cvData.certification_programs) {
    cvData.certification_programs.forEach((cp) => {
      checkPageBreak(16);
      drawBullet(marginX + 2, y);
      drawText(cp.title, marginX + 10, y, fontBold, 8, colorText);
      const ed = cp.editions?.[0];
      if (ed) {
        const dateRange = ed.start_year === ed.end_year ? `${ed.start_year}` : `${ed.start_year}-${ed.end_year}`;
        const loc = ed.location ? ` - ${ed.location}` : "";
        const titleW = fontBold.widthOfTextAtSize(cp.title, 8);
        drawText(loc, marginX + 10 + titleW, y, fontItalic, 7.8, colorPrimary);
        const dWidth = fontBoldItalic.widthOfTextAtSize(dateRange, 8);
        drawText(dateRange, pageWidth - marginX - dWidth, y, fontBoldItalic, 8, colorMuted);
      }
      y -= 10.5;
    });
  }
  y -= 2;

  // ── 11. TECHNICAL & SCIENTIFIC SKILLS ────────────────────────────────
  drawSectionHeading("Technical & Scientific Skills");

  cvData.skills.forEach((sk) => {
    checkPageBreak(15);
    drawBullet(marginX + 2, y);
    const catPrefix = `${sk.category}: `;
    drawText(catPrefix, marginX + 10, y, fontBold, 8, colorText);
    const catWidth = fontBold.widthOfTextAtSize(catPrefix, 8);
    const skillList = sk.skills.join(", ");
    y = drawHangingWrappedText(
      skillList,
      marginX + 10 + catWidth,
      marginX + 10,
      y,
      contentWidth - 10 - catWidth,
      contentWidth - 10,
      fontRegular,
      8,
      colorText,
      10
    );
    y -= 1;
  });
  y -= 3;

  // ── 12. DEVELOPED APPLICATIONS & SCIENTIFIC DATASETS ─────────────────
  // (Requirement 3: Removed descriptions, written next to each other by category)
  drawSectionHeading("Developed Applications & Scientific Datasets");

  // Portfolio Links line
  const appPortPrefix = "Apps: ";
  const appPortUrl = cvData.developed_applications.applications_link;
  const dsPortPrefix = "   |   Datasets: ";
  const dsPortUrl = cvData.generated_datasets.datasets_link;

  let portX = marginX;
  portX += drawText(appPortPrefix, portX, y, fontBoldItalic, 8.5, colorPrimary);
  portX += drawLink(appPortUrl, portX, y, fontRegular, 8.5, colorLink, appPortUrl);
  portX += drawText(dsPortPrefix, portX, y, fontBoldItalic, 8.5, colorPrimary);
  drawLink(dsPortUrl, portX, y, fontRegular, 8.5, colorLink, dsPortUrl);
  y -= 11.5;

  // Applications listed next to each other by category:
  cvData.developed_applications.applications.forEach((cat) => {
    checkPageBreak(16);
    drawBullet(marginX + 2, y);
    const catPrefix = `${cat.category}: `;
    const catW = fontBold.widthOfTextAtSize(catPrefix, 8);
    drawText(catPrefix, marginX + 10, y, fontBold, 8, colorText);
    const appNames = cat.apps.map((a) => a.name).join(", ");
    y = drawHangingWrappedText(
      appNames,
      marginX + 10 + catW,
      marginX + 10,
      y,
      contentWidth - 10 - catW,
      contentWidth - 10,
      fontRegular,
      7.8,
      colorText,
      9.8
    );
    y -= 1;
  });

  // Datasets listed next to each other:
  if (cvData.generated_datasets && cvData.generated_datasets.datasets) {
    checkPageBreak(16);
    drawBullet(marginX + 2, y);
    const dsPrefix = "Curated Datasets: ";
    const dsW = fontBold.widthOfTextAtSize(dsPrefix, 8);
    drawText(dsPrefix, marginX + 10, y, fontBold, 8, colorText);
    const dsNames = cvData.generated_datasets.datasets.map((d) => d.name).join(", ");
    y = drawHangingWrappedText(
      dsNames,
      marginX + 10 + dsW,
      marginX + 10,
      y,
      contentWidth - 10 - dsW,
      contentWidth - 10,
      fontRegular,
      7.8,
      colorText,
      9.8
    );
    y -= 2;
  }
  y -= 2;

  // ── 13. COURSE-BASED & TECHNICAL PROJECTS ────────────────────────────
  drawSectionHeading("Course-Based & Technical Projects");

  const projectsList = cvData.projects || [];
  projectsList.forEach((proj) => {
    checkPageBreak(16);
    drawBullet(marginX + 2, y);
    const pTitle = `"${proj.title}"`;
    drawText(pTitle, marginX + 10, y, fontBold, 8, colorText);
    const pMeta = `${proj.course} (${proj.semester} ${proj.year})`;
    const pMetaWidth = fontItalic.widthOfTextAtSize(pMeta, 7.5);
    drawText(pMeta, pageWidth - marginX - pMetaWidth, y, fontItalic, 7.5, colorMuted);
    y -= 9.5;
  });
  y -= 3;

  // ── 14. COMPREHENSIVE ACADEMIC COURSEWORK ────────────────────────────
  drawSectionHeading("Comprehensive Academic Coursework");

  const mscEdu = cvData.education.find((e) => e.degree.includes("MSc"));
  if (mscEdu && mscEdu.coursework) {
    checkPageBreak(22);
    drawText("Durham University - MSc in Particles, Strings and Cosmology:", marginX, y, fontBold, 8.5, colorPrimary);
    y -= 9.5;

    mscEdu.coursework.forEach((cw) => {
      checkPageBreak(15);
      drawBullet(marginX + 4, y);
      const catPrefix = `${cw.category}: `;
      drawText(catPrefix, marginX + 12, y, fontBold, 7.5, colorText);
      const catW = fontBold.widthOfTextAtSize(catPrefix, 7.5);
      const coursesStr = cw.courses.join(", ");
      y = drawHangingWrappedText(
        coursesStr,
        marginX + 12 + catW,
        marginX + 12,
        y,
        contentWidth - 12 - catW,
        contentWidth - 12,
        fontRegular,
        7.5,
        colorText,
        9.5
      );
      y -= 1;
    });
    y -= 3;
  }

  const bscEdu = cvData.education.find((e) => e.degree.includes("BSc"));
  if (bscEdu && bscEdu.coursework) {
    checkPageBreak(22);
    drawText("Birzeit University - BSc in Physics (Minor Mathematics):", marginX, y, fontBold, 8.5, colorPrimary);
    y -= 9.5;

    bscEdu.coursework.forEach((cw) => {
      checkPageBreak(15);
      drawBullet(marginX + 4, y);
      const catPrefix = `${cw.category}: `;
      drawText(catPrefix, marginX + 12, y, fontBold, 7.5, colorText);
      const catW = fontBold.widthOfTextAtSize(catPrefix, 7.5);
      const coursesStr = cw.courses.join(", ");
      y = drawHangingWrappedText(
        coursesStr,
        marginX + 12 + catW,
        marginX + 12,
        y,
        contentWidth - 12 - catW,
        contentWidth - 12,
        fontRegular,
        7.5,
        colorText,
        9.5
      );
      y -= 1;
    });
    y -= 3;
  }

  // ── 15. ACADEMIC REFEREES ────────────────────────────────────────────
  drawSectionHeading("Academic Referees");

  cvData.referees.forEach((ref) => {
    checkPageBreak(22);
    drawBullet(marginX + 2, y);
    drawText(ref.name, marginX + 10, y, fontBold, 8.5, colorText);

    const relStr = `(${ref.relationship})`;
    const relWidth = fontItalic.widthOfTextAtSize(relStr, 8);
    drawText(relStr, pageWidth - marginX - relWidth, y, fontItalic, 8, colorMuted);
    y -= 9.5;

    let refLineX = marginX + 10;
    refLineX += drawText(`${ref.affiliation}   |   Email: `, refLineX, y, fontRegular, 7.5, colorText);
    refLineX += drawLink(ref.email, refLineX, y, fontRegular, 7.5, colorLink, `mailto:${ref.email}`);

    if (ref.webpage) {
      refLineX += drawText("   |   Web: ", refLineX, y, fontRegular, 7.5, colorText);
      drawLink(ref.webpage, refLineX, y, fontRegular, 7.5, colorLink, ref.webpage);
    }
    y -= 10.5;
  });

  // ── FOOTERS ON ALL PAGES ─────────────────────────────────────────────
  const totalPages = doc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const page = doc.getPage(i);

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

  // Save to public/documents/cv-short.pdf and public/cv/cv-short.pdf
  const targetDir1 = path.join(rootDir, "public", "documents");
  const targetDir2 = path.join(rootDir, "public", "cv");

  if (!fs.existsSync(targetDir1)) fs.mkdirSync(targetDir1, { recursive: true });
  if (!fs.existsSync(targetDir2)) fs.mkdirSync(targetDir2, { recursive: true });

  const outPath1 = path.join(targetDir1, "cv-short.pdf");
  const outPath2 = path.join(targetDir2, "cv-short.pdf");

  fs.writeFileSync(outPath1, pdfBytes);
  fs.writeFileSync(outPath2, pdfBytes);

  console.log(`✅ Concise CV PDF successfully generated!`);
  console.log(`   Pages: ${totalPages}`);
  console.log(`   Size: ${(pdfBytes.length / 1024).toFixed(1)} KB`);
  console.log(`   Saved to: ${outPath1} and ${outPath2}`);
}

generateShortPDF().catch((err) => {
  console.error("❌ Failed to generate concise CV PDF:", err);
  process.exit(1);
});
