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

    // Helper function to add clean footer to every page
    const addFooter = (pageNum: number, totalPages: number) => {
        const footerY = pageHeight - 10;

        // Simple top line
        doc.setDrawColor(...grayBorder);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

        // Footer content
        doc.setFontSize(7);
        doc.setTextColor(...grayText);
        doc.setFont('helvetica', 'normal');

        const timestamp = new Date().toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        doc.text(`Generated: ${timestamp}`, margin, footerY);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...navyPrimary);
        doc.text(data.companyName, pageWidth / 2, footerY, { align: 'center' });

        // Page number
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayText);
        doc.text(`Halaman ${pageNum} dari ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
    };

    // Helper function to add header with letterhead
    const addHeader = async (isFirstPage: boolean = false) => {
        if (isFirstPage) {
            // Try to load letterhead
            try {
                const letterheadImg = await loadImage('/kopsurat.jpeg');
                const letterheadHeight = 35;
                doc.addImage(letterheadImg, 'JPEG', 0, 0, pageWidth, letterheadHeight);
                return letterheadHeight + 5;
            } catch (e) {
                console.log('Letterhead not found, using simple header');

                // Simple header bar
                doc.setFillColor(...navyPrimary);
                doc.rect(0, 0, pageWidth, 8, 'F');

                doc.setTextColor(...white);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('DAILY REPORT', pageWidth / 2, 6, { align: 'center' });

                return 15;
            }
        } else {
            // Simple header for continuation pages
            doc.setDrawColor(...grayBorder);
            doc.setLineWidth(0.5);
            doc.line(margin, 10, pageWidth - margin, 10);
            return 15;
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
        head: [['No', 'Kode Kamera', 'Status', 'Playback Status', 'Penggungunaan Data', 'Keterangan']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: navyPrimary,
            textColor: white,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'left', cellWidth: 25 },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'center', cellWidth: 22 },
            4: { halign: 'left', cellWidth: 45 },
            5: { halign: 'left', cellWidth: 58 }
        },
        bodyStyles: {
            fontSize: 8,
            cellPadding: 3
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
