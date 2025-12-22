import jsPDF from 'jspdf';

export function generateMonitoringPdf({
  monitoringName,
  companyName,
  filteredCameras,
  manualStatuses,
  getCameraUsage,
  getCameraKeterangan,
  evidenceImages,
  finalNotes,
}: {
  monitoringName: string;
  companyName: string;
  filteredCameras: any[];
  manualStatuses: Record<number, boolean | null>;
  getCameraUsage: (id: number) => string;
  getCameraKeterangan: (id: number) => string;
  evidenceImages: string[];
  finalNotes: string;
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Premium Color Palette - Navy & Gold Accent
  const navyPrimary: [number, number, number] = [20, 33, 61];      // Deep Navy
  const navySecondary: [number, number, number] = [37, 56, 88];    // Medium Navy
  const goldAccent: [number, number, number] = [212, 175, 55];     // Gold
  const white: [number, number, number] = [255, 255, 255];         // Pure White
  const grayBg: [number, number, number] = [249, 250, 251];        // Background Gray
  const grayBorder: [number, number, number] = [229, 231, 235];    // Border Gray
  const grayText: [number, number, number] = [107, 114, 128];      // Text Gray
  const successGreen: [number, number, number] = [16, 185, 129];   // Success Green
  const errorRed: [number, number, number] = [239, 68, 68];        // Error Red

  // Helper function to add footer to every page
  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 12;

    // Decorative top line with gradient effect (simulated with multiple lines)
    doc.setDrawColor(...goldAccent);
    doc.setLineWidth(0.8);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setDrawColor(...navyPrimary);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    // Footer background
    doc.setFillColor(...grayBg);
    doc.rect(0, footerY - 3, pageWidth, 15, 'F');

    // Footer content
    doc.setFontSize(6.5);
    doc.setTextColor(...grayText);
    doc.setFont('helvetica', 'normal');

    const timestamp = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.text(`Generated: ${timestamp}`, margin, footerY + 2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navyPrimary);
    doc.text('PT Kereta Api Indonesia (Persero)', pageWidth / 2, footerY + 2, { align: 'center' });

    // Page number with styling
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navySecondary);
    doc.text(`Halaman ${pageNum} dari ${totalPages}`, pageWidth - margin, footerY + 2, { align: 'right' });
  };

  // Helper function to add header to pages
  const addHeader = (isFirstPage: boolean = false) => {
    // Gradient header background (simulated with layered rectangles)
    doc.setFillColor(...navyPrimary);
    doc.rect(0, 0, pageWidth, 15, 'F');

    doc.setFillColor(...navySecondary);
    doc.rect(0, 0, pageWidth, 10, 'F');

    // Gold accent line
    doc.setDrawColor(...goldAccent);
    doc.setLineWidth(1.2);
    doc.line(0, 15, pageWidth, 15);

    if (isFirstPage) {
      // Premium logo design
      doc.setFillColor(...white);
      doc.circle(margin + 12, 26, 11, 'F');

      doc.setFillColor(...navyPrimary);
      doc.circle(margin + 12, 26, 10, 'F');

      doc.setFillColor(...goldAccent);
      doc.circle(margin + 12, 26, 8.5, 'F');

      doc.setFillColor(...navyPrimary);
      doc.circle(margin + 12, 26, 7.5, 'F');

      doc.setTextColor(...goldAccent);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('KAI', margin + 12, 28, { align: 'center' });

      // Main title with shadow effect
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('DAILY REPORT', margin + 32, 24.5);

      doc.setTextColor(...navyPrimary);
      doc.text('DAILY REPORT', margin + 32, 24);

      // Subtitle
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...grayText);
      doc.text('Sistem Keamanan dan Pemantauan Terintegrasi', margin + 32, 30);

      // Premium date badge
      const today = new Date();
      const dateStr = today.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      const badgeWidth = 48;
      const badgeX = pageWidth - margin - badgeWidth;

      // Badge shadow
      doc.setFillColor(180, 180, 180);
      doc.roundedRect(badgeX + 0.5, 19.5, badgeWidth, 14, 3, 3, 'F');

      // Badge background with gradient effect
      doc.setFillColor(...goldAccent);
      doc.roundedRect(badgeX, 19, badgeWidth, 14, 3, 3, 'F');

      doc.setFillColor(...navyPrimary);
      doc.roundedRect(badgeX + 1, 20, badgeWidth - 2, 12, 2, 2, 'F');

      doc.setFontSize(6.5);
      doc.setTextColor(...goldAccent);
      doc.setFont('helvetica', 'bold');
      doc.text('TANGGAL LAPORAN', badgeX + badgeWidth / 2, 24, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setTextColor(...white);
      doc.setFont('helvetica', 'bold');
      doc.text(dateStr, badgeX + badgeWidth / 2, 29, { align: 'center' });
    }
  };

  // Track total pages (we'll update this at the end)
  let currentPage = 1;

  // Add first page header
  addHeader(true);

  // Decorative separator
  let y = 42;
  doc.setDrawColor(...grayBorder);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  doc.setDrawColor(...goldAccent);
  doc.setLineWidth(1.5);
  doc.line(margin, y + 1, margin + 40, y + 1);

  // ==================== INFO SECTION WITH CARDS ====================
  y += 10;

  const labelWidth = 48;
  const colonX = margin + labelWidth;
  const valueX = colonX + 5;

  // Info items with enhanced styling
  const infoItems = [
    { label: 'Nama Monitoring', value: monitoringName },
    { label: 'Perusahaan', value: companyName },
    {
      label: 'Waktu Pembuatan',
      value: `${new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
    },
  ];

  infoItems.forEach((item) => {
    doc.setFontSize(9);
    doc.setTextColor(...grayText);
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, margin, y);

    doc.setTextColor(...navyPrimary);
    doc.text(':', colonX, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...navySecondary);
    doc.text(item.value, valueX, y);

    y += 7;
  });

  // Statistics Cards
  const totalCameras = filteredCameras.length;
  const onlineCameras = filteredCameras.filter(cam => manualStatuses[cam.camera_id]).length;
  const offlineCameras = totalCameras - onlineCameras;
  const uptimePercentage = totalCameras > 0 ? ((onlineCameras / totalCameras) * 100).toFixed(1) : '0';

  y += 5;

  // Statistics header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyPrimary);
  doc.text('RINGKASAN STATISTIK', margin, y);

  y += 8;

  const cardWidth = (pageWidth - 2 * margin - 9) / 4;
  const cardHeight = 22;
  const cardSpacing = 3;

  const stats = [
    { label: 'Total Kamera', value: totalCameras.toString(), color: navyPrimary },
    { label: 'Online', value: onlineCameras.toString(), color: successGreen },
    { label: 'Offline', value: offlineCameras.toString(), color: errorRed },
    { label: 'Uptime', value: `${uptimePercentage}%`, color: goldAccent },
  ];

  stats.forEach((stat, idx) => {
    const cardX = margin + idx * (cardWidth + cardSpacing);

    // Card shadow
    doc.setFillColor(220, 220, 220);
    doc.roundedRect(cardX + 0.5, y + 0.5, cardWidth, cardHeight, 2, 2, 'F');

    // Card background
    doc.setFillColor(...white);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 2, 2, 'F');

    // Card border
    doc.setDrawColor(...stat.color);
    doc.setLineWidth(0.8);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 2, 2, 'D');

    // Colored top accent
    doc.setFillColor(...stat.color);
    doc.roundedRect(cardX, y, cardWidth, 3, 2, 2, 'F');

    // Value
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...stat.color);
    doc.text(stat.value, cardX + cardWidth / 2, y + 12, { align: 'center' });

    // Label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayText);
    doc.text(stat.label, cardX + cardWidth / 2, y + 17, { align: 'center' });
  });

  y += cardHeight + 12;

  // Separator
  doc.setDrawColor(...grayBorder);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // ==================== EVIDENCE IMAGES ====================
  if (evidenceImages && evidenceImages.length > 0) {
    y += 12;

    // Check if we need a new page
    if (y > pageHeight - 60) {
      addFooter(currentPage, 999); // Temporary total
      doc.addPage();
      currentPage++;
      addHeader(false);
      y = 25;
    }

    // Section header with icon
    doc.setFillColor(...navyPrimary);
    doc.roundedRect(margin, y - 3, pageWidth - 2 * margin, 10, 2, 2, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...white);
    doc.text(`📸 BUKTI SCREENSHOT MONITORING (${evidenceImages.length} Gambar)`, margin + 3, y + 3);

    y += 12;

    // Loop through each image
    evidenceImages.forEach((evidenceImage, index) => {
      // Check if need new page
      if (y > pageHeight - 100) {
        addFooter(currentPage, 999);
        doc.addPage();
        currentPage++;
        addHeader(false);
        y = 25;
      }

      // Image number badge
      doc.setFillColor(...goldAccent);
      doc.roundedRect(margin, y, 25, 6, 2, 2, 'F');

      doc.setFontSize(7.5);
      doc.setTextColor(...navyPrimary);
      doc.setFont('helvetica', 'bold');
      doc.text(`Gambar ${index + 1}`, margin + 12.5, y + 4, { align: 'center' });

      y += 9;

      // Calculate image dimensions to fit in page
      const maxImageWidth = pageWidth - 2 * margin - 4;
      const maxImageHeight = 75;

      try {
        const imgProps = doc.getImageProperties(evidenceImage);
        const imgRatio = imgProps.width / imgProps.height;

        let imgWidth = maxImageWidth;
        let imgHeight = imgWidth / imgRatio;

        if (imgHeight > maxImageHeight) {
          imgHeight = maxImageHeight;
          imgWidth = imgHeight * imgRatio;
        }

        const imgX = (pageWidth - imgWidth) / 2;

        // Image shadow
        doc.setFillColor(200, 200, 200);
        doc.roundedRect(imgX + 1, y + 1, imgWidth, imgHeight, 3, 3, 'F');

        // Image border
        doc.setDrawColor(...navyPrimary);
        doc.setLineWidth(1.5);
        doc.roundedRect(imgX, y, imgWidth, imgHeight, 3, 3, 'D');

        // Add image
        doc.addImage(evidenceImage, 'JPEG', imgX, y, imgWidth, imgHeight);

        y += imgHeight + 10;
      } catch (error) {
        doc.setFillColor(255, 240, 240);
        doc.roundedRect(margin, y, pageWidth - 2 * margin, 15, 2, 2, 'F');

        doc.setFontSize(8);
        doc.setTextColor(...errorRed);
        doc.setFont('helvetica', 'italic');
        doc.text(`⚠ Gambar ${index + 1} tidak dapat ditampilkan`, margin + 5, y + 9);
        y += 18;
      }
    });

    // Separator after images
    doc.setDrawColor(...grayBorder);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;
  }

  // ==================== PREMIUM TABLE ====================
  // Check if we need a new page for table
  if (y > pageHeight - 80) {
    addFooter(currentPage, 999);
    doc.addPage();
    currentPage++;
    addHeader(false);
    y = 25;
  }

  // Table section header
  doc.setFillColor(...navyPrimary);
  doc.roundedRect(margin, y - 3, pageWidth - 2 * margin, 10, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...white);
  doc.text('📋 DETAIL STATUS KAMERA', margin + 3, y + 3);

  y += 12;

  // Table Header with premium styling
  doc.setFillColor(...navySecondary);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, 'F');

  // Gold accent line on top of header
  doc.setDrawColor(...goldAccent);
  doc.setLineWidth(2);
  doc.line(margin, y, pageWidth - margin, y);

  doc.setTextColor(...white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  const colNo = margin + 4;
  const colCode = margin + 15;
  const colStatus = margin + 45;
  const colUsage = margin + 70;
  const colKeterangan = margin + 120;

  doc.text('NO', colNo, y + 6.5);
  doc.text('KODE KAMERA', colCode, y + 6.5);
  doc.text('STATUS', colStatus, y + 6.5);
  doc.text('PENGGUNAAN', colUsage, y + 6.5);
  doc.text('KETERANGAN', colKeterangan, y + 6.5);

  y += 10;

  // Table Rows with enhanced design
  const rowHeight = 11;

  filteredCameras.forEach((cam, idx) => {
    // Pagination
    if (y > pageHeight - 35) {
      addFooter(currentPage, 999);
      doc.addPage();
      currentPage++;
      addHeader(false);
      y = 25;

      // Repeat header
      doc.setFillColor(...navySecondary);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, 'F');

      doc.setDrawColor(...goldAccent);
      doc.setLineWidth(2);
      doc.line(margin, y, pageWidth - margin, y);

      doc.setTextColor(...white);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('NO', colNo, y + 6.5);
      doc.text('KODE KAMERA', colCode, y + 6.5);
      doc.text('STATUS', colStatus, y + 6.5);
      doc.text('PENGGUNAAN', colUsage, y + 6.5);
      doc.text('KETERANGAN', colKeterangan, y + 6.5);
      y += 10;
    }

    // Alternating row background
    if (idx % 2 === 0) {
      doc.setFillColor(...grayBg);
      doc.rect(margin, y, pageWidth - 2 * margin, rowHeight, 'F');
    }

    // Row border
    doc.setDrawColor(...grayBorder);
    doc.setLineWidth(0.3);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

    // Row Number with circle
    doc.setFillColor(...navyPrimary);
    doc.circle(colNo + 2, y + rowHeight / 2, 2.5, 'F');

    doc.setFontSize(7);
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.text(String(idx + 1), colNo + 2, y + rowHeight / 2 + 0.8, { align: 'center' });

    // Camera Code
    doc.setTextColor(...navyPrimary);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(cam.code, colCode, y + 7);

    // Status Badge - Premium design
    const isOnline = manualStatuses[cam.camera_id];
    if (isOnline) {
      // Online badge - Green
      doc.setFillColor(...successGreen);
      doc.roundedRect(colStatus, y + 3, 20, 6, 3, 3, 'F');
      doc.setTextColor(...white);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.text('● ONLINE', colStatus + 10, y + 6.8, { align: 'center' });
    } else {
      // Offline badge - Red
      doc.setFillColor(...errorRed);
      doc.roundedRect(colStatus, y + 3, 20, 6, 3, 3, 'F');
      doc.setTextColor(...white);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.text('● OFFLINE', colStatus + 10, y + 6.8, { align: 'center' });
    }

    // Usage and Keterangan
    doc.setTextColor(...navySecondary);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');

    const usage = getCameraUsage(cam.camera_id) || '-';
    const keterangan = getCameraKeterangan(cam.camera_id) || '-';

    const usageText = doc.splitTextToSize(usage, 45);
    const keteranganText = doc.splitTextToSize(keterangan, 70);

    doc.text(usageText[0], colUsage, y + 7);
    doc.text(keteranganText[0], colKeterangan, y + 7);

    y += rowHeight;
  });

  // Table bottom border with gold accent
  doc.setDrawColor(...goldAccent);
  doc.setLineWidth(2);
  doc.line(margin, y, pageWidth - margin, y);

  // ==================== NOTES SECTION ====================
  y += 15;

  if (y > pageHeight - 50) {
    addFooter(currentPage, 999);
    doc.addPage();
    currentPage++;
    addHeader(false);
    y = 25;
  }

  // Notes header
  doc.setFillColor(...navyPrimary);
  doc.roundedRect(margin, y - 3, pageWidth - 2 * margin, 10, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...white);
  doc.text('📝 CATATAN TAMBAHAN', margin + 3, y + 3);

  y += 12;

  const notesHeight = Math.max(25, Math.min(45, finalNotes.length / 3.5));

  // Notes box with shadow
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(margin + 1, y + 1, pageWidth - 2 * margin, notesHeight, 3, 3, 'F');

  doc.setFillColor(...grayBg);
  doc.setDrawColor(...navySecondary);
  doc.setLineWidth(1);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, notesHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...navySecondary);
  const splitNotes = doc.splitTextToSize(
    finalNotes || 'Tidak ada catatan tambahan.',
    pageWidth - 2 * margin - 12
  );
  doc.text(splitNotes, margin + 6, y + 8);

  // ==================== SIGNATURE SECTION ====================
  y += notesHeight + 18;

  if (y > pageHeight - 40) {
    addFooter(currentPage, 999);
    doc.addPage();
    currentPage++;
    addHeader(false);
    y = 25;
  }

  const sigWidth = 60;
  const sigX1 = margin + 20;
  const sigX2 = pageWidth - margin - sigWidth - 20;

  // Signature boxes with premium design
  // Left Signature
  doc.setDrawColor(...grayBorder);
  doc.setLineWidth(0.5);
  doc.setFillColor(...white);
  doc.roundedRect(sigX1 - 5, y - 5, sigWidth + 10, 30, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayText);
  doc.text('Dibuat Oleh,', sigX1, y);

  y += 15;
  doc.setDrawColor(...navyPrimary);
  doc.setLineWidth(0.8);
  doc.line(sigX1, y, sigX1 + sigWidth, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyPrimary);
  doc.setFontSize(8.5);
  doc.text('Petugas Monitoring', sigX1 + sigWidth / 2, y, { align: 'center' });

  // Right Signature
  y -= 20;
  doc.setDrawColor(...grayBorder);
  doc.setLineWidth(0.5);
  doc.setFillColor(...white);
  doc.roundedRect(sigX2 - 5, y - 5, sigWidth + 10, 30, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayText);
  doc.setFontSize(8);
  doc.text('Disetujui Oleh,', sigX2, y);

  y += 15;
  doc.setDrawColor(...navyPrimary);
  doc.setLineWidth(0.8);
  doc.line(sigX2, y, sigX2 + sigWidth, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyPrimary);
  doc.setFontSize(8.5);
  doc.text('Manager Keamanan', sigX2 + sigWidth / 2, y, { align: 'center' });

  // ==================== ADD FOOTERS TO ALL PAGES ====================
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Save PDF
  const fileName = `Laporan-CCTV-${monitoringName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}