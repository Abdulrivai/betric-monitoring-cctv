import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const monitoringName = url.searchParams.get('monitoring');
    const companyName = url.searchParams.get('company');
    const finalNotes = url.searchParams.get('notes') || '';
    const usagesParam = url.searchParams.get('usages');
    
    if (!from || !to || !monitoringName || !companyName) {
      return NextResponse.json(
        { error: 'Query parameter from, to, monitoring, dan company wajib diisi' },
        { status: 400 }
      );
    }
    
    const cameraUsages: Array<{ camera_id: number; usage: string }> = usagesParam ? JSON.parse(usagesParam) : [];
    
    const origin = url.origin;
    const reportRes = await fetch(
      `${origin}/api/report?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    
    if (!reportRes.ok) {
      return NextResponse.json(
        { error: 'Gagal mengambil data report' },
        { status: 500 }
      );
    }
    
    const report = await reportRes.json();
    
    if (report?.error) {
      return NextResponse.json(report, { status: 400 });
    }
    
    if (!Array.isArray(report.cameras)) {
      return NextResponse.json(
        { error: 'Format data report tidak sesuai' },
        { status: 500 }
      );
    }
    
    // Buat PDF
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    
    let page = pdf.addPage([595, 842]);
    let y = 800;
    
    // Header
    page.drawText('LAPORAN HARIAN MONITORING CCTV', { x: 50, y, size: 18, font });
    y -= 24;

    page.drawText(`Perusahaan: ${decodeURIComponent(companyName)}`, { x: 50, y, size: 12, font });
    y -= 18;

    page.drawText(`Monitoring: ${decodeURIComponent(monitoringName)}`, { x: 50, y, size: 12, font });
    y -= 18;

    page.drawText(`Periode: ${from} s/d ${to}`, { x: 50, y, size: 12, font });
    y -= 24;

    // Summary Status
    const onlineCount = report.cameras.filter((cam: any) => cam.uptime_pct >= 95).length;
    const offlineCount = report.cameras.length - onlineCount;
    
    page.drawText(`STATUS: ${onlineCount} Kamera NYALA | ${offlineCount} Kamera MATI`, { 
      x: 50, y, size: 11, font 
    });
    y -= 20;
    
    // Camera List with Usage Data
    for (const cam of report.cameras) {
      const status = cam.uptime_pct >= 95 ? 'NYALA' : 'MATI';
      const usage = cameraUsages.find(u => u.camera_id === cam.camera_id)?.usage || '-';
      
      page.drawText(`${cam.code} - ${status} (${cam.uptime_pct.toFixed(1)}%)`, { 
        x: 50, y, size: 10, font, 
        color: cam.uptime_pct >= 95 ? rgb(0, 0.5, 0) : rgb(0.8, 0, 0)
      });
      y -= 12;
      
      page.drawText(`  Offline: ${(cam.offline_ms / 3600000).toFixed(2)} jam | Usage: ${usage}`, {
        x: 50, y, size: 9, font, color: rgb(0.3, 0.3, 0.3)
      });
      y -= 16;

      if (y < 100) {
        page = pdf.addPage([595, 842]);
        y = 800;
      }
    }
    
    // Final Notes
    if (finalNotes) {
      y -= 20;
      page.drawText('KETERANGAN AKHIR:', { x: 50, y, size: 12, font, color: rgb(0, 0, 0.8) });
      y -= 16;
      
      const notes = decodeURIComponent(finalNotes);
      const words = notes.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length * 3 <= 500) { // Approximate width check
          currentLine = testLine;
        } else {
          page.drawText(currentLine, { x: 50, y, size: 10, font });
          y -= 12;
          currentLine = word;
          
          if (y < 50) {
            page = pdf.addPage([595, 842]);
            y = 800;
          }
        }
      }
      
      if (currentLine) {
        page.drawText(currentLine, { x: 50, y, size: 10, font });
        y -= 12;
      }
    }
    
    // Ambil maksimal 6 screenshot evidence (prioritaskan kamera mati)
    const offlineCameras = report.cameras.filter((cam: any) => cam.uptime_pct < 95 && cam.evidence_url);
    const onlineCameras = report.cameras.filter((cam: any) => cam.uptime_pct >= 95 && cam.evidence_url);
    
    const evidenceCameras = [
      ...offlineCameras.slice(0, 6),
      ...onlineCameras.slice(0, 6 - offlineCameras.length)
    ].slice(0, 6);
    
    for (const cam of evidenceCameras) {
      if (!cam.evidence_url) continue;
      
      try {
        const imgRes = await fetch(cam.evidence_url);
        if (!imgRes.ok) {
          console.warn(`Failed to fetch image for ${cam.code}: ${imgRes.status}`);
          continue;
        }

        const contentType = imgRes.headers.get('content-type') || '';
        const imgBytes = await imgRes.arrayBuffer();

        let img;
        if (contentType.includes('image/png')) {
          img = await pdf.embedPng(imgBytes);
        } else if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) {
          img = await pdf.embedJpg(imgBytes);
        } else {
          console.warn(`Unsupported image type for ${cam.code}: ${contentType}`);
          continue;
        }

        // Buat halaman baru untuk setiap evidence
        const p = pdf.addPage([595, 842]);
        
        // Header evidence
        p.drawText('BUKTI SCREENSHOT CCTV', { x: 50, y: 810, size: 16, font });
        p.drawText(`Kamera: ${cam.code}`, { x: 50, y: 790, size: 12, font });
        p.drawText(`Status: ${cam.uptime_pct >= 95 ? 'ONLINE' : 'OFFLINE'} (${cam.uptime_pct.toFixed(1)}%)`, 
                  { x: 50, y: 775, size: 10, font });

        // Gambar evidence
        const maxW = 495;
        const ratio = maxW / img.width;
        const w = maxW;
        const h = img.height * ratio;

        p.drawImage(img, { x: 50, y: 750 - h, width: w, height: h });
        
        // Footer
        p.drawText(`Generated by KAI CCTV Monitoring System - ${new Date().toLocaleDateString('id-ID')}`, 
                  { x: 50, y: 30, size: 8, font });
      } catch (imgError) {
        // Log error tapi lanjutkan ke kamera berikutnya
        console.error(`Error processing image for ${cam.code}:`, imgError);
      }
    }

    const pdfBytes = await pdf.save();

    // Konversi ke base64 dulu, lebih reliable di Next.js
    const base64 = Buffer.from(pdfBytes).toString('base64');
    const buffer = Buffer.from(base64, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="laporan_${from}_${to}.pdf"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      {
        error: 'Gagal membuat PDF',
        detail: error?.message ?? String(error)
      },
      { status: 500 }
    );
  }
}