'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { generateAnalyticsPDF } from '@/utils/analyticsPdfGenerator';
import Toast from '@/components/Toast';
import DatePicker from '@/components/DatePicker';

type CameraData = {
    id: number;
    camera_id: number;
    date: string;
    is_online: boolean;
    playback_status: string;
    uptime_pct: number;
    usage: string;
    note: string;
    incidents: number;
    cameras: {
        id: number;
        code: string;
        name: string;
        location: string;
    };
};

type AnalyticsSummary = {
    total_cameras: number;
    total_online: number;
    total_offline: number;
    avg_uptime: number;
    total_incidents: number;
};

export default function Reports() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [currentTime, setCurrentTime] = useState('');
    const [cameraData, setCameraData] = useState<CameraData[]>([]);
    const [summary, setSummary] = useState<AnalyticsSummary>({
        total_cameras: 0,
        total_online: 0,
        total_offline: 0,
        avg_uptime: 0,
        total_incidents: 0
    });
    const [loading, setLoading] = useState(false);

    // Form states
    const [companyName, setCompanyName] = useState('');
    const [monitoringPerson, setMonitoringPerson] = useState('');
    const [screenshots, setScreenshots] = useState<string[]>([]);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Toast state
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({
        show: false,
        message: '',
        type: 'info'
    });

    // Dropdown states
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
    const [showPersonDropdown, setShowPersonDropdown] = useState(false);

    // Update current time
    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString('id-ID'));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // Fetch data when date changes
    useEffect(() => {
        fetchReportData();
    }, [selectedDate]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/analytics?date=${selectedDate}`);
            const data = await response.json();

            if (data.success) {
                setCameraData(data.cameras);
                setSummary(data.summary);
            } else {
                setToast({ show: true, message: 'Error loading data: ' + data.error, type: 'error' });
            }
        } catch (error) {
            console.error('Error fetching report data:', error);
            setToast({ show: true, message: 'Failed to load report data', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const fileArray = Array.from(files);

        // Validate file size (max 10MB per file)
        const invalidFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024);
        if (invalidFiles.length > 0) {
            setToast({ show: true, message: 'Beberapa file melebihi 10MB. Silakan pilih file yang lebih kecil.', type: 'warning' });
            return;
        }

        const promises = fileArray.map(file => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        Promise.all(promises).then(base64Images => {
            setScreenshots(prev => [...prev, ...base64Images]);
            setToast({ show: true, message: `${base64Images.length} gambar berhasil diupload!`, type: 'success' });
        }).catch(error => {
            console.error('Error uploading images:', error);
            setToast({ show: true, message: 'Gagal upload gambar. Silakan coba lagi.', type: 'error' });
        });
    };

    const handleRemoveImage = (index: number) => {
        setScreenshots(prev => prev.filter((_, i) => i !== index));
    };

    const handleGeneratePDF = async () => {
        // Validation
        if (!companyName.trim()) {
            setToast({ show: true, message: 'Nama PT harus diisi!', type: 'warning' });
            return;
        }
        if (!monitoringPerson.trim()) {
            setToast({ show: true, message: 'Nama petugas monitoring harus diisi!', type: 'warning' });
            return;
        }
        if (cameraData.length === 0) {
            setToast({ show: true, message: 'Tidak ada data kamera untuk di-export!', type: 'warning' });
            return;
        }

        setIsGeneratingPdf(true);
        try {
            await generateAnalyticsPDF({
                companyName: companyName.trim(),
                monitoringPerson: monitoringPerson.trim(),
                date: selectedDate,
                summary: {
                    total_cameras: summary.total_cameras,
                    total_online: summary.total_online,
                    total_offline: summary.total_offline,
                    avg_uptime: summary.avg_uptime
                },
                cameras: cameraData,
                screenshots: screenshots
            });

            setToast({ show: true, message: 'PDF berhasil di-generate dan ter-download!', type: 'success' });

            // Optional: Reset form after successful generation
            // setCompanyName('');
            // setMonitoringPerson('');
            // setScreenshots([]);
        } catch (error) {
            console.error('Error generating PDF:', error);
            setToast({ show: true, message: 'Gagal generate PDF. Silakan coba lagi.', type: 'error' });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <div className="bg-white shadow-xl border-b-2 border-blue-100">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img
                                src="/betriclogoblue.png"
                                alt="Betric Logo"
                                className="h-16 w-auto"
                            />
                            <div>
                                <h1 className="text-3xl font-bold mb-2 text-slate-900">Generate PDF Report</h1>
                                <p className="text-slate-600 text-sm">Laporan Monitoring CCTV Harian</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-600">Current Time</div>
                            <div className="text-xl font-semibold text-slate-900">{currentTime || '--:--:--'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Navigation */}
                <div className="mb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center text-blue-900 hover:text-blue-700 font-semibold transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali ke Dashboard Monitoring
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Form Input */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Date Selector */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Pilih Tanggal Laporan
                            </h2>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <DatePicker
                                        value={selectedDate}
                                        onChange={setSelectedDate}
                                    />
                                </div>
                                <button
                                    onClick={fetchReportData}
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-6 py-3 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Load Data
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Company & Person Info */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Informasi Perusahaan & Petugas
                            </h2>
                            <div className="space-y-4">
                                {/* Company Name with Custom Dropdown */}
                                <div className="relative">
                                    <label className="block text-sm font-bold text-slate-900 mb-2">
                                        Nama PT yang Dimonitoring <span className="text-rose-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full border-2 border-slate-300 rounded-xl px-4 py-3 pr-10 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                            placeholder="Ketik atau pilih nama PT"
                                            value={companyName}
                                            onChange={e => setCompanyName(e.target.value)}
                                            onFocus={() => setShowCompanyDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                                        >
                                            <svg className={`w-5 h-5 transition-transform ${showCompanyDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {showCompanyDropdown && (
                                            <div className="absolute z-10 w-full mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-2xl overflow-hidden animate-scale-in">
                                                <div
                                                    className="px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 cursor-pointer transition-all flex items-center gap-3 group"
                                                    onClick={() => {
                                                        setCompanyName('CCTV KAI PHASE III');
                                                        setShowCompanyDropdown(false);
                                                    }}
                                                >
                                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                                        <svg className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900 group-hover:text-blue-900">CCTV KAI PHASE III</div>
                                                        <div className="text-xs text-slate-500">PT Kereta Api Indonesia</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Person Name with Custom Dropdown */}
                                <div className="relative">
                                    <label className="block text-sm font-bold text-slate-900 mb-2">
                                        Nama Petugas Monitoring <span className="text-rose-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full border-2 border-slate-300 rounded-xl px-4 py-3 pr-10 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                            placeholder="Ketik atau pilih nama petugas"
                                            value={monitoringPerson}
                                            onChange={e => setMonitoringPerson(e.target.value)}
                                            onFocus={() => setShowPersonDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowPersonDropdown(false), 200)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPersonDropdown(!showPersonDropdown)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                                        >
                                            <svg className={`w-5 h-5 transition-transform ${showPersonDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {showPersonDropdown && (
                                            <div className="absolute z-10 w-full mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-2xl overflow-hidden animate-scale-in">
                                                <div
                                                    className="px-4 py-3 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 cursor-pointer transition-all flex items-center gap-3 group border-b border-slate-100"
                                                    onClick={() => {
                                                        setMonitoringPerson('Abdul Rivai');
                                                        setShowPersonDropdown(false);
                                                    }}
                                                >
                                                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                                                        <svg className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900 group-hover:text-emerald-900">Abdul Rivai</div>
                                                        <div className="text-xs text-slate-500">Petugas Monitoring</div>
                                                    </div>
                                                </div>
                                                <div
                                                    className="px-4 py-3 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 cursor-pointer transition-all flex items-center gap-3 group border-b border-slate-100"
                                                    onClick={() => {
                                                        setMonitoringPerson('Restu Hendra');
                                                        setShowPersonDropdown(false);
                                                    }}
                                                >
                                                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                                                        <svg className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900 group-hover:text-emerald-900">Restu Hendra</div>
                                                        <div className="text-xs text-slate-500">Petugas Monitoring</div>
                                                    </div>
                                                </div>
                                                <div
                                                    className="px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 cursor-pointer transition-all flex items-center gap-3 group"
                                                    onClick={() => {
                                                        setMonitoringPerson('Nadzar Lutfi');
                                                        setShowPersonDropdown(false);
                                                    }}
                                                >
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                                        <svg className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900 group-hover:text-blue-900">Nadzar Lutfi</div>
                                                        <div className="text-xs text-slate-500">Petugas Monitoring</div>
                                                    </div>
                                                </div>
                                                <div
                                                    className="px-4 py-3 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 cursor-pointer transition-all flex items-center gap-3 group border-b border-slate-100"
                                                    onClick={() => {
                                                        setMonitoringPerson('Toby Averous');
                                                        setShowPersonDropdown(false);
                                                    }}
                                                >
                                                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                                                        <svg className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900 group-hover:text-emerald-900">Toby Averous</div>
                                                        <div className="text-xs text-slate-500">Petugas Monitoring</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Screenshot Upload */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Upload Bukti Screenshot
                                <span className="text-sm font-normal text-slate-500">(Opsional, 6+ gambar)</span>
                            </h2>

                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-600 transition-all bg-slate-50">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="screenshot-upload"
                                />
                                <label htmlFor="screenshot-upload" className="cursor-pointer">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="bg-blue-100 p-6 rounded-full">
                                            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-slate-900">Klik atau drag & drop untuk upload</p>
                                            <p className="text-sm text-slate-500 mt-2">PNG, JPG, JPEG (Max 10MB per file)</p>
                                            <p className="text-xs text-slate-400 mt-1">Upload minimal 6 gambar untuk laporan yang lengkap</p>
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {/* Image Preview Grid */}
                            {screenshots.length > 0 && (
                                <div className="mt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {screenshots.length} gambar ter-upload
                                        </p>
                                        <button
                                            onClick={() => setScreenshots([])}
                                            className="text-sm text-rose-600 hover:text-rose-700 font-semibold"
                                        >
                                            Hapus Semua
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {screenshots.map((img, idx) => (
                                            <div key={idx} className="relative group">
                                                <img
                                                    src={img}
                                                    alt={`Screenshot ${idx + 1}`}
                                                    className="w-full h-40 object-cover rounded-xl border-2 border-slate-200 shadow-sm"
                                                />
                                                <button
                                                    onClick={() => handleRemoveImage(idx)}
                                                    className="absolute top-2 right-2 bg-rose-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-rose-700"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full font-semibold">
                                                    #{idx + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Summary & Generate Button */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Summary Preview */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Preview Laporan
                            </h2>

                            <div className="space-y-4">
                                <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                                    <h3 className="text-sm font-bold text-blue-900 mb-3">Informasi:</h3>
                                    <div className="space-y-2 text-sm text-blue-800">
                                        <div className="flex justify-between">
                                            <span>Tanggal:</span>
                                            <span className="font-semibold">{new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>PT:</span>
                                            <span className="font-semibold">{companyName || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Petugas:</span>
                                            <span className="font-semibold">{monitoringPerson || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
                                    <h3 className="text-sm font-bold text-slate-900 mb-3">Statistik:</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">Total Kamera</span>
                                            <span className="text-lg font-bold text-blue-600">{summary.total_cameras}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">Online</span>
                                            <span className="text-lg font-bold text-emerald-600">{summary.total_online}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">Offline</span>
                                            <span className="text-lg font-bold text-rose-600">{summary.total_offline}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">Avg Uptime</span>
                                            <span className="text-lg font-bold text-amber-600">{summary.avg_uptime.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">Screenshot</span>
                                            <span className="text-lg font-bold text-purple-600">{screenshots.length}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={handleGeneratePDF}
                                    disabled={isGeneratingPdf || !companyName || !monitoringPerson || cameraData.length === 0}
                                    className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold rounded-xl px-6 py-4 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                >
                                    {isGeneratingPdf ? (
                                        <>
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                            <span>Generating PDF...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span>Generate PDF Report</span>
                                        </>
                                    )}
                                </button>

                                {/* Help Text */}
                                <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
                                    <div className="flex gap-2">
                                        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="text-xs text-amber-800">
                                            <p className="font-semibold mb-1">Tips:</p>
                                            <ul className="space-y-1 list-disc list-inside">
                                                <li>Pastikan semua Form sudah terisi</li>
                                                <li>Upload Screenshot untuk laporan lengkap</li>
                                                <li>PDF akan otomatis ter-download setelah generate</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
}
