import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type CameraData = {
    id: number;
    camera_id: number;
    date: string;
    is_online: boolean;
    playback_status: string;
    uptime_pct: number;
    usage: string;
    note: string;
    cameras: {
        code: string;
        name: string;
        location: string;
    };
};

type Summary = {
    total_cameras: number;
    total_online: number;
    total_offline: number;
    avg_uptime: number;
};

type PDFData = {
    companyName: string;
    monitoringPerson: string;
    date: string;
    summary: Summary;
    cameras: CameraData[];
    screenshots: string[]; // Base64 images
};

export const generateAnalyticsPDF = async (data: PDFData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Professional Color Palette - Navy & Gray (Subtle)
    const navyPrimary: [number, number, number] = [30, 41, 59];      // Slate 800
    const navyLight: [number, number, number] = [51, 65, 85];        // Slate 700
    const white: [number, number, number] = [255, 255, 255];         // Pure White
    const grayBg: [number, number, number] = [248, 250, 252];        // Slate 50
    const grayBorder: [number, number, number] = [226, 232, 240];    // Slate 200
    const grayText: [number, number, number] = [100, 116, 139];      // Slate 500
    const grayDark: [number, number, number] = [71, 85, 105];        // Slate 600
    const successGreen: [number, number, number] = [22, 163, 74];    // Green 600
    const errorRed: [number, number, number] = [220, 38, 38];        // Red 600
    const blueStatus: [number, number, number] = [37, 99, 235];      // Blue 600
    const orangeStatus: [number, number, number] = [234, 88, 12];    // Orange 600

    // Helper function to add professional footer to every page
    const addFooter = (pageNum: number, totalPages: number) => {
        const footerY = pageHeight - 18;

        // Gradient footer background
        doc.setFillColor(...navyPrimary);
        doc.rect(0, footerY - 8, pageWidth, 26, 'F');

        // Top accent line
        doc.setDrawColor(0, 120, 212); // Blue accent
        doc.setLineWidth(1);
        doc.line(0, footerY - 8, pageWidth, footerY - 8);

        // Footer content
        doc.setFontSize(7);
        doc.setTextColor(...white);
        doc.setFont('helvetica', 'normal');

        const timestamp = new Date().toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Left: Generated timestamp
        doc.text(`Generated: ${timestamp}`, margin, footerY);

        // Center: Company name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(data.companyName, pageWidth / 2, footerY, { align: 'center' });

        // Right: Page number
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(`Halaman ${pageNum} dari ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });

        // Bottom tagline
        doc.setFontSize(6);
        doc.setTextColor(...grayBorder);
        doc.setFont('helvetica', 'italic');
        doc.text('Dokumen ini dibuat secara otomatis oleh sistem monitoring CCTV', pageWidth / 2, footerY + 5, { align: 'center' });
    };

    // Helper function to add professional header with letterhead
    const addHeader = async (isFirstPage: boolean = false) => {
        if (isFirstPage) {
            // Try to load letterhead
            try {
                const letterheadImg = await loadImage('/kopsurat.jpeg');
                const letterheadHeight = 35;
                doc.addImage(letterheadImg, 'JPEG', 0, 0, pageWidth, letterheadHeight);

                // Add subtle shadow below letterhead
                doc.setFillColor(0, 0, 0, 0.05);
                doc.rect(0, letterheadHeight, pageWidth, 2, 'F');

                return letterheadHeight + 8;
            } catch (e) {
                console.log('Letterhead not found, using professional header');

                // Professional gradient header
                doc.setFillColor(...navyPrimary);
                doc.rect(0, 0, pageWidth, 25, 'F');

                // Accent stripe
                doc.setFillColor(0, 120, 212); // Blue accent
                doc.rect(0, 0, pageWidth, 3, 'F');

                // Title
                doc.setTextColor(...white);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('DAILY REPORT', pageWidth / 2, 12, { align: 'center' });

                // Subtitle
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text('Monitoring CCTV - PT Kereta Api Indonesia', pageWidth / 2, 19, { align: 'center' });

                return 30;
            }
        } else {
            // Professional header for continuation pages
            doc.setFillColor(...navyPrimary);
            doc.rect(0, 0, pageWidth, 12, 'F');

            doc.setFillColor(0, 120, 212);
            doc.rect(0, 0, pageWidth, 2, 'F');

            doc.setTextColor(...white);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('DAILY REPORT - Lanjutan', pageWidth / 2, 8, { align: 'center' });

            return 18;
        }
    };

    // Track current page
    let currentPage = 1;

    // Add first page header and get starting Y position
    let yPos = await addHeader(true);
    yPos += 5;

    // ============================================
    // TITLE SECTION
    // ============================================
    doc.setTextColor(...navyPrimary);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DAILY REPORT', pageWidth / 2, yPos, { align: 'center' });

    yPos += 8;

    // Simple separator line
    doc.setDrawColor(...navyPrimary);
    doc.setLineWidth(1);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 10;

    // ============================================
    // INFORMASI LAPORAN
    // ============================================
    const infoItems = [
        {
            label: 'Tanggal Monitoring',
            value: new Date(data.date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })
        },
        { label: 'Petugas Monitoring', value: data.monitoringPerson },
        { label: 'Perusahaan', value: data.companyName },
        { label: 'Waktu Generate', value: new Date().toLocaleString('id-ID') }
    ];

    infoItems.forEach((item) => {
        doc.setFontSize(9);
        doc.setTextColor(...grayDark);
        doc.setFont('helvetica', 'bold');
        doc.text(item.label, margin, yPos);

        doc.setTextColor(...navyPrimary);
        doc.text(':', margin + 50, yPos);

        doc.setFont('helvetica', 'normal');
        doc.text(item.value, margin + 55, yPos);

        yPos += 6;
    });

    yPos += 10;

    // ============================================
    // STATISTICS SECTION - TABLE FORMAT
    // ============================================
    // Section header - simple and clean
    doc.setFillColor(...navyPrimary);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...white);
    doc.text('RINGKASAN REPORT', pageWidth / 2, yPos + 5.5, { align: 'center' });

    yPos += 12;

    // Statistics table data
    const summaryTableData = [
        ['Total Kamera', data.summary.total_cameras.toString()],
        ['Online', data.summary.total_online.toString()],
        ['Offline', data.summary.total_offline.toString()],
        ['Average Uptime', `${data.summary.avg_uptime.toFixed(1)}%`]
    ];

    autoTable(doc, {
        startY: yPos,
        head: [['Keterangan', 'Jumlah']],
        body: summaryTableData,
        theme: 'grid',
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
        headStyles: {
            fillColor: navyPrimary,
            textColor: white,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 130, fontStyle: 'bold' },
            1: { halign: 'center', cellWidth: 50, fontStyle: 'bold', fontSize: 10 }
        },
        bodyStyles: {
            fontSize: 9,
            cellPadding: 3
        },
        didParseCell: (cellData) => {
            // Color the values based on type
            if (cellData.column.index === 1 && cellData.section === 'body') {
                const rowIndex = cellData.row.index;
                if (rowIndex === 0) {
                    // Total Kamera - Navy
                    cellData.cell.styles.textColor = navyPrimary;
                } else if (rowIndex === 1) {
                    // Online - Green
                    cellData.cell.styles.textColor = successGreen;
                } else if (rowIndex === 2) {
                    // Offline - Red
                    cellData.cell.styles.textColor = errorRed;
                } else if (rowIndex === 3) {
                    // Uptime - Gray
                    cellData.cell.styles.textColor = grayDark;
                }
            }
        }
    });

    // Get position after summary table
    yPos = (doc as any).lastAutoTable.finalY + 12;

    // ============================================
    // TABLE - DATA DETAIL KAMERA
    // ============================================
    // Check if need new page
    if (yPos > pageHeight - 100) {
        addFooter(currentPage, 999);
        doc.addPage();
        currentPage++;
        yPos = await addHeader(false);
    }

    // Table section header
    doc.setFillColor(...navyPrimary);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...white);
    doc.text('STATUS CCTV', pageWidth / 2, yPos + 5.5, { align: 'center' });

    yPos += 12;

    // Prepare table data
    const tableData = data.cameras.map((cam, idx) => [
        (idx + 1).toString(),
        cam.cameras.code,
        cam.is_online ? 'ONLINE' : 'OFFLINE',
        cam.playback_status || 'OK',
        cam.usage || '-',
        cam.note || '-'
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['No', 'Kode Kamera', 'Status', 'Playback', 'Usage Data', 'Keterangan']],
        body: tableData,
        theme: 'grid',
        margin: { left: margin, right: margin, bottom: 30 },
        tableWidth: 'auto',
        headStyles: {
            fillColor: navyPrimary,
            textColor: white,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 8,
            cellPadding: 2.5,
            lineWidth: 0.1,
            lineColor: white
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },      // No
            1: { halign: 'left', cellWidth: 30 },       // Kode Kamera
            2: { halign: 'center', cellWidth: 18 },     // Status
            3: { halign: 'center', cellWidth: 18 },     // Playback
            4: { halign: 'left', cellWidth: 25 },       // Usage Data
            5: { halign: 'left', cellWidth: 'auto' }    // Keterangan (auto-width)
        },
        bodyStyles: {
            fontSize: 7,
            cellPadding: 2,
            lineWidth: 0.1,
            lineColor: grayBorder
        },
        alternateRowStyles: {
            fillColor: grayBg
        },
        didParseCell: (cellData) => {
            // Color status column (Online/Offline)
            if (cellData.column.index === 2 && cellData.section === 'body') {
                const status = cellData.cell.raw as string;
                if (status === 'ONLINE') {
                    cellData.cell.styles.textColor = successGreen;
                    cellData.cell.styles.fontStyle = 'bold';
                } else {
                    cellData.cell.styles.textColor = errorRed;
                    cellData.cell.styles.fontStyle = 'bold';
                }
            }

            // Color playback status column (OK/Error)
            if (cellData.column.index === 3 && cellData.section === 'body') {
                const playbackStatus = cellData.cell.raw as string;
                if (playbackStatus === 'OK') {
                    cellData.cell.styles.textColor = blueStatus;
                    cellData.cell.styles.fontStyle = 'bold';
                } else if (playbackStatus === 'Error') {
                    cellData.cell.styles.textColor = orangeStatus;
                    cellData.cell.styles.fontStyle = 'bold';
                }
            }

            // Style row numbers
            if (cellData.column.index === 0 && cellData.section === 'body') {
                cellData.cell.styles.fillColor = navyLight;
                cellData.cell.styles.textColor = white;
                cellData.cell.styles.fontStyle = 'bold';
            }
        },
        didDrawPage: (hookData) => {
            // Track page changes during table rendering
            const currentTablePage = doc.getCurrentPageInfo().pageNumber;
            if (currentTablePage > currentPage) {
                currentPage = currentTablePage;
            }
        }
    });

    // Get position after table
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // ============================================
    // BUKTI SCREENSHOT
    // ============================================
    if (data.screenshots && data.screenshots.length > 0) {
        // Check if need new page
        if (yPos > pageHeight - 80) {
            addFooter(currentPage, 999);
            doc.addPage();
            currentPage++;
            yPos = await addHeader(false);
        }

        // Section header
        doc.setFillColor(...navyPrimary);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...white);
        doc.text(`BUKTI SCREENSHOT MONITORING (${data.screenshots.length} Gambar)`, pageWidth / 2, yPos + 5.5, { align: 'center' });

        yPos += 12;

        // Display screenshots in single column (vertical layout)
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = imgWidth * 0.6; // 16:10 ratio for better fit

        for (let i = 0; i < data.screenshots.length; i++) {
            // Check if need new page
            if (yPos + imgHeight + 15 > pageHeight - 25) {
                addFooter(currentPage, 999);
                doc.addPage();
                currentPage++;
                yPos = await addHeader(false);
            }

            try {
                // Simple image label
                doc.setFontSize(8);
                doc.setTextColor(...grayDark);
                doc.setFont('helvetica', 'bold');
                doc.text(`Gambar ${i + 1}`, margin, yPos);

                yPos += 5;

                // Simple border
                doc.setDrawColor(...grayBorder);
                doc.setLineWidth(1);
                doc.rect(margin, yPos, imgWidth, imgHeight, 'D');

                // Compress image before adding to PDF
                const compressedImage = await compressImage(data.screenshots[i], 1200, 0.7);

                // Add compressed image
                doc.addImage(
                    compressedImage,
                    'JPEG',
                    margin,
                    yPos,
                    imgWidth,
                    imgHeight
                );

                yPos += imgHeight + 10;
            } catch (e) {
                console.error('Error adding image:', e);

                doc.setFillColor(...grayBg);
                doc.rect(margin, yPos, imgWidth, imgHeight, 'F');

                doc.setFontSize(8);
                doc.setTextColor(...errorRed);
                doc.setFont('helvetica', 'italic');
                doc.text(`Gambar ${i + 1} tidak dapat ditampilkan`, pageWidth / 2, yPos + imgHeight / 2, { align: 'center' });

                yPos += imgHeight + 10;
            }
        }

        yPos += 5;
    }

    // ============================================
    // ADD FOOTERS TO ALL PAGES
    // ============================================
    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i, totalPages);
    }

    // Save PDF
    const fileName = `Laporan_CCTV_${data.companyName.replace(/\s+/g, '_')}_${data.date}.pdf`;
    doc.save(fileName);
};

// Helper function to compress image
const compressImage = (base64Image: string, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');

            // Calculate new dimensions
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            // Draw image with compression
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to JPEG with quality compression
            const compressedImage = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedImage);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = base64Image;
    });
};

// Helper function to load image
const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = url;
    });
};

// ============================================
// PERIOD ANALYTICS PDF GENERATOR
// ============================================

type CameraStats = {
    camera_id: number;
    code: string;
    name: string;
    location: string;
    avg_uptime: number;
    online_percentage: number;
    online_days: number;
    total_days: number;
};

type PeriodAnalyticsPDFData = {
    periodLabel: string;
    startDate: string;
    endDate: string;
    summary: {
        total_cameras: number;
        total_online: number;
        total_offline: number;
        avg_uptime: number;
        total_incidents?: number;
    };
    cameras?: CameraStats[];
};

export const generatePeriodAnalyticsPDF = async (data: PeriodAnalyticsPDFData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Professional Color Palette - Navy & Gray (Subtle)
    const navyPrimary: [number, number, number] = [30, 41, 59];      // Slate 800
    const navyLight: [number, number, number] = [51, 65, 85];        // Slate 700
    const white: [number, number, number] = [255, 255, 255];         // Pure White
    const grayBg: [number, number, number] = [248, 250, 252];        // Slate 50
    const grayBorder: [number, number, number] = [226, 232, 240];    // Slate 200
    const grayText: [number, number, number] = [100, 116, 139];      // Slate 500
    const grayDark: [number, number, number] = [71, 85, 105];        // Slate 600
    const successGreen: [number, number, number] = [22, 163, 74];    // Green 600
    const errorRed: [number, number, number] = [220, 38, 38];        // Red 600
    const blueStatus: [number, number, number] = [37, 99, 235];      // Blue 600
    const amberStatus: [number, number, number] = [245, 158, 11];    // Amber 500

    // Helper function to add professional footer
    const addFooter = (pageNum: number, totalPages: number) => {
        const footerY = pageHeight - 18;

        // Gradient footer background
        doc.setFillColor(...navyPrimary);
        doc.rect(0, footerY - 8, pageWidth, 26, 'F');

        // Top accent line
        doc.setDrawColor(0, 120, 212); // Blue accent
        doc.setLineWidth(1);
        doc.line(0, footerY - 8, pageWidth, footerY - 8);

        // Footer content
        doc.setFontSize(7);
        doc.setTextColor(...white);
        doc.setFont('helvetica', 'normal');

        const timestamp = new Date().toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Left: Generated timestamp
        doc.text(`Generated: ${timestamp}`, margin, footerY);

        // Center: Company name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('PT Kereta Api Indonesia (Persero)', pageWidth / 2, footerY, { align: 'center' });

        // Right: Page number
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(`Halaman ${pageNum} dari ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });

        // Bottom tagline
        doc.setFontSize(6);
        doc.setTextColor(...grayBorder);
        doc.setFont('helvetica', 'italic');
        doc.text('Dokumen ini dibuat secara otomatis oleh sistem monitoring CCTV', pageWidth / 2, footerY + 5, { align: 'center' });
    };

    // Helper function to add professional header with letterhead
    const addHeader = async (isFirstPage: boolean = false) => {
        if (isFirstPage) {
            // Try to load letterhead
            try {
                const letterheadImg = await loadImage('/kopsurat.jpeg');
                const letterheadHeight = 35;
                doc.addImage(letterheadImg, 'JPEG', 0, 0, pageWidth, letterheadHeight);

                // Add subtle shadow below letterhead
                doc.setFillColor(0, 0, 0, 0.05);
                doc.rect(0, letterheadHeight, pageWidth, 2, 'F');

                return letterheadHeight + 8;
            } catch (e) {
                console.log('Letterhead not found, using professional header');

                // Professional gradient header
                doc.setFillColor(...navyPrimary);
                doc.rect(0, 0, pageWidth, 25, 'F');

                // Accent stripe
                doc.setFillColor(0, 120, 212); // Blue accent
                doc.rect(0, 0, pageWidth, 3, 'F');

                // Title
                doc.setTextColor(...white);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('ANALYTICS REPORT', pageWidth / 2, 12, { align: 'center' });

                // Subtitle
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text('Monitoring CCTV - PT Kereta Api Indonesia', pageWidth / 2, 19, { align: 'center' });

                return 30;
            }
        } else {
            // Professional header for continuation pages
            doc.setFillColor(...navyPrimary);
            doc.rect(0, 0, pageWidth, 12, 'F');

            doc.setFillColor(0, 120, 212);
            doc.rect(0, 0, pageWidth, 2, 'F');

            doc.setTextColor(...white);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('ANALYTICS REPORT - Lanjutan', pageWidth / 2, 8, { align: 'center' });

            return 18;
        }
    };

    // Track current page
    let currentPage = 1;

    // Add first page header and get starting Y position
    let yPos = await addHeader(true);
    yPos += 5;

    // ============================================
    // TITLE SECTION
    // ============================================
    doc.setTextColor(...navyPrimary);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ANALYTICS SUMMARY REPORT', pageWidth / 2, yPos, { align: 'center' });

    yPos += 8;

    // Simple separator line
    doc.setDrawColor(...navyPrimary);
    doc.setLineWidth(1);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 10;

    // ============================================
    // INFORMASI PERIODE
    // ============================================
    const infoItems = [
        { label: 'Periode', value: data.periodLabel },
        {
            label: 'Tanggal Mulai',
            value: new Date(data.startDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })
        },
        {
            label: 'Tanggal Akhir',
            value: new Date(data.endDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })
        },
        { label: 'Waktu Generate', value: new Date().toLocaleString('id-ID') }
    ];

    infoItems.forEach((item) => {
        doc.setFontSize(9);
        doc.setTextColor(...grayDark);
        doc.setFont('helvetica', 'bold');
        doc.text(item.label, margin, yPos);

        doc.setTextColor(...navyPrimary);
        doc.text(':', margin + 50, yPos);

        doc.setFont('helvetica', 'normal');
        doc.text(item.value, margin + 55, yPos);

        yPos += 6;
    });

    yPos += 10;

    // ============================================
    // STATISTICS SECTION - TABLE FORMAT
    // ============================================
    // Section header - simple and clean
    doc.setFillColor(...navyPrimary);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...white);
    doc.text('RINGKASAN STATISTIK CCTV', pageWidth / 2, yPos + 5.5, { align: 'center' });

    yPos += 12;

    // Statistics table data
    const summaryTableData = [
        ['Total Kamera', data.summary.total_cameras.toString()],
        ['Rata-rata Online', data.summary.total_online.toString()],
        ['Rata-rata Offline', data.summary.total_offline.toString()],
        ['Average Uptime', `${data.summary.avg_uptime.toFixed(1)}%`]
    ];

    // Add total incidents if available
    if (data.summary.total_incidents !== undefined) {
        summaryTableData.push(['Total Incidents', data.summary.total_incidents.toString()]);
    }

    autoTable(doc, {
        startY: yPos,
        head: [['Keterangan', 'Nilai']],
        body: summaryTableData,
        theme: 'grid',
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
        headStyles: {
            fillColor: navyPrimary,
            textColor: white,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 130, fontStyle: 'bold' },
            1: { halign: 'center', cellWidth: 50, fontStyle: 'bold', fontSize: 10 }
        },
        bodyStyles: {
            fontSize: 9,
            cellPadding: 3
        },
        didParseCell: (cellData) => {
            // Color the values based on type
            if (cellData.column.index === 1 && cellData.section === 'body') {
                const rowIndex = cellData.row.index;
                if (rowIndex === 0) {
                    // Total Kamera - Navy
                    cellData.cell.styles.textColor = navyPrimary;
                } else if (rowIndex === 1) {
                    // Online - Green
                    cellData.cell.styles.textColor = successGreen;
                } else if (rowIndex === 2) {
                    // Offline - Red
                    cellData.cell.styles.textColor = errorRed;
                } else if (rowIndex === 3) {
                    // Uptime - Gray
                    cellData.cell.styles.textColor = grayDark;
                }
            }
        }
    });

    // Get position after summary table
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // ============================================
    // DETAIL KAMERA TABLE
    // ============================================
    if (data.cameras && data.cameras.length > 0) {
        // Check if need new page
        if (yPos > pageHeight - 100) {
            addFooter(currentPage, 999);
            doc.addPage();
            currentPage++;
            yPos = await addHeader(false);
        }

        // Table section header
        doc.setFillColor(...navyPrimary);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...white);
        doc.text(`DETAIL STATUS KAMERA (${data.cameras.length} Kamera)`, pageWidth / 2, yPos + 5.5, { align: 'center' });

        yPos += 12;

        // Prepare table data
        const cameraTableData = data.cameras.map((cam, idx) => [
            (idx + 1).toString(),
            cam.code,
            `${cam.online_percentage.toFixed(1)}%`,
            `${cam.avg_uptime.toFixed(1)}%`,
            `${cam.online_days}/${cam.total_days}`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['No', 'Kode Kamera', 'Online %', 'Avg Uptime', 'Hari Online']],
            body: cameraTableData,
            theme: 'grid',
            margin: { left: margin, right: margin, bottom: 30 },
            tableWidth: 'auto',
            headStyles: {
                fillColor: navyPrimary,
                textColor: white,
                fontStyle: 'bold',
                halign: 'center',
                fontSize: 8,
                cellPadding: 2.5,
                lineWidth: 0.1,
                lineColor: white
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },     // No
                1: { halign: 'left', cellWidth: 'auto' },   // Kode Kamera (auto)
                2: { halign: 'center', cellWidth: 25 },     // Online %
                3: { halign: 'center', cellWidth: 25 },     // Avg Uptime
                4: { halign: 'center', cellWidth: 28 }      // Hari Online
            },
            bodyStyles: {
                fontSize: 7,
                cellPadding: 2,
                lineWidth: 0.1,
                lineColor: grayBorder
            },
            alternateRowStyles: {
                fillColor: grayBg
            },
            didParseCell: (cellData) => {
                // Color online percentage column
                if (cellData.column.index === 2 && cellData.section === 'body') {
                    const percentage = parseFloat(cellData.cell.raw as string);
                    if (percentage >= 80) {
                        cellData.cell.styles.textColor = successGreen;
                        cellData.cell.styles.fontStyle = 'bold';
                    } else if (percentage >= 50) {
                        cellData.cell.styles.textColor = amberStatus;
                        cellData.cell.styles.fontStyle = 'bold';
                    } else {
                        cellData.cell.styles.textColor = errorRed;
                        cellData.cell.styles.fontStyle = 'bold';
                    }
                }

                // Color avg uptime column
                if (cellData.column.index === 3 && cellData.section === 'body') {
                    const uptime = parseFloat(cellData.cell.raw as string);
                    if (uptime >= 80) {
                        cellData.cell.styles.textColor = blueStatus;
                        cellData.cell.styles.fontStyle = 'bold';
                    } else if (uptime >= 50) {
                        cellData.cell.styles.textColor = amberStatus;
                        cellData.cell.styles.fontStyle = 'bold';
                    } else {
                        cellData.cell.styles.textColor = errorRed;
                        cellData.cell.styles.fontStyle = 'bold';
                    }
                }

                // Style row numbers
                if (cellData.column.index === 0 && cellData.section === 'body') {
                    cellData.cell.styles.fillColor = navyLight;
                    cellData.cell.styles.textColor = white;
                    cellData.cell.styles.fontStyle = 'bold';
                }
            },
            didDrawPage: (hookData) => {
                // Track page changes during table rendering
                const currentTablePage = doc.getCurrentPageInfo().pageNumber;
                if (currentTablePage > currentPage) {
                    currentPage = currentTablePage;
                }
            }
        });

        // Get position after camera table
        yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ============================================
    // INFORMASI TAMBAHAN - PROFESSIONAL CARD
    // ============================================
    // Check if need new page
    if (yPos > pageHeight - 60) {
        addFooter(currentPage, 999);
        doc.addPage();
        currentPage++;
        yPos = await addHeader(false);
    }

    // Professional card header
    doc.setFillColor(...navyPrimary);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...white);
    doc.text('CATATAN PENTING', margin + 3, yPos + 4.5);

    yPos += 7;

    // Card body with border
    doc.setFillColor(...grayBg);
    doc.setDrawColor(...grayBorder);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 38, 'FD');

    yPos += 5;

    doc.setFontSize(7);
    doc.setTextColor(...grayDark);
    doc.setFont('helvetica', 'normal');

    const noteText = [
        '• Data ini merupakan ringkasan analytics untuk periode yang dipilih',
        '• Nilai "Rata-rata Online" dan "Rata-rata Offline" dihitung berdasarkan rata-rata harian',
        '• Average Uptime menunjukkan persentase waktu kamera dalam kondisi online',
        '• Online % menunjukkan persentase hari kamera dalam kondisi online selama periode',
        '• Hari Online menunjukkan jumlah hari kamera online dari total hari dalam periode',
        '',
        'Hijau (>=80%) | Kuning (50-79%) | Merah (<50%)'
    ];

    noteText.forEach((line) => {
        doc.text(line, margin + 3, yPos);
        yPos += 5;
    });

    // ============================================
    // ADD FOOTERS TO ALL PAGES
    // ============================================
    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i, totalPages);
    }

    // Save PDF
    const fileName = `Analytics_Summary_${data.periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
