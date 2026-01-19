'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Toast from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import DatePicker from '@/components/DatePicker';
import { generatePeriodAnalyticsPDF } from '@/utils/analyticsPdfGenerator';

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

type PeriodType = 'weekly' | 'monthly' | 'yearly' | 'custom';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
    show: boolean;
    message: string;
    type: ToastType;
}

interface ConfirmState {
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
}

export default function Analytics() {
    // Period Analytics States
    const [analysisPeriod, setAnalysisPeriod] = useState<PeriodType>('weekly');
    const [customStartDate, setCustomStartDate] = useState(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    );
    const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().slice(0, 10));
    const [periodSummary, setPeriodSummary] = useState<AnalyticsSummary>({
        total_cameras: 0,
        total_online: 0,
        total_offline: 0,
        avg_uptime: 0,
        total_incidents: 0
    });
    const [periodCameras, setPeriodCameras] = useState<any[]>([]);

    // Daily Camera Data States
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [currentTime, setCurrentTime] = useState('');
    const [cameraData, setCameraData] = useState<CameraData[]>([]);
    const [dailySummary, setDailySummary] = useState<AnalyticsSummary>({
        total_cameras: 0,
        total_online: 0,
        total_offline: 0,
        avg_uptime: 0,
        total_incidents: 0
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Toast & Confirm States
    const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });
    const [confirm, setConfirm] = useState<ConfirmState>({
        show: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'warning'
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Update current time
    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString('id-ID'));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // Fetch period analytics
    useEffect(() => {
        fetchPeriodAnalytics();
    }, [analysisPeriod, customStartDate, customEndDate]);

    // Fetch daily camera data
    useEffect(() => {
        fetchDailyCameraData();
    }, [selectedDate]);

    // Fluent Design: Reveal Effect Cursor Tracking
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const revealElement = target.closest('.fluent-reveal');

            if (revealElement) {
                const rect = revealElement.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                (revealElement as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
                (revealElement as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, []);


    const fetchPeriodAnalytics = async () => {
        try {
            let startDate: string;
            let endDate: string;

            if (analysisPeriod === 'custom') {
                startDate = customStartDate;
                endDate = customEndDate;
            } else {
                const start = new Date();
                const end = new Date();

                if (analysisPeriod === 'weekly') {
                    start.setDate(start.getDate() - 7);
                } else if (analysisPeriod === 'monthly') {
                    start.setMonth(start.getMonth() - 1);
                } else {
                    start.setFullYear(start.getFullYear() - 1);
                }

                startDate = start.toISOString().slice(0, 10);
                endDate = end.toISOString().slice(0, 10);
            }

            const response = await fetch(`/api/analytics/period?start=${startDate}&end=${endDate}`);
            const data = await response.json();

            if (data.success) {
                setPeriodSummary(data.summary);
                setPeriodCameras(data.cameras || []);
            }
        } catch (error) {
            console.error('Error fetching period analytics:', error);
        }
    };

    const fetchDailyCameraData = async (showSuccessToast = false) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/analytics?date=${selectedDate}`);
            const data = await response.json();

            if (data.success) {
                setCameraData(data.cameras);
                setDailySummary(data.summary);
                if (showSuccessToast) {
                    setToast({ show: true, message: 'Data berhasil di-refresh!', type: 'success' });
                }
            } else {
                setToast({ show: true, message: 'Error loading data: ' + data.error, type: 'error' });
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setToast({ show: true, message: 'Failed to load analytics data', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleBulkSave = () => {
        setConfirm({
            show: true,
            title: 'Simpan Data',
            message: 'Apakah Anda yakin ingin menyimpan semua perubahan data?',
            type: 'info',
            onConfirm: async () => {
                setConfirm({ ...confirm, show: false });
                setSaving(true);
                try {
                    const updates = cameraData.map(camera => ({
                        camera_id: camera.camera_id,
                        is_online: camera.is_online,
                        playback_status: camera.playback_status,
                        usage: camera.usage,
                        note: camera.note
                    }));

                    const response = await fetch('/api/analytics', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            updates,
                            date: selectedDate
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        await fetchDailyCameraData();
                        setToast({ show: true, message: 'Semua data berhasil disimpan!', type: 'success' });
                    } else {
                        setToast({ show: true, message: 'Error: ' + data.error, type: 'error' });
                    }
                } catch (error) {
                    console.error('Error saving data:', error);
                    setToast({ show: true, message: 'Failed to save data', type: 'error' });
                } finally {
                    setSaving(false);
                }
            }
        });
    };

    const handleRefreshData = () => {
        setConfirm({
            show: true,
            title: 'Refresh Data',
            message: 'Apakah Anda yakin ingin me-refresh data? Perubahan yang belum disimpan akan hilang.',
            type: 'warning',
            onConfirm: async () => {
                setConfirm({ ...confirm, show: false });
                setRefreshing(true);
                await fetchDailyCameraData(true);
                setRefreshing(false);
            }
        });
    };

    const handleInitializeData = async () => {
        try {
            const response = await fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: selectedDate })
            });

            const data = await response.json();

            if (data.success) {
                await fetchDailyCameraData();
                setToast({ show: true, message: 'Data CCTV berhasil dimunculkan!', type: 'success' });
            } else {
                setToast({ show: true, message: 'Error: ' + data.error, type: 'error' });
            }
        } catch (error) {
            console.error('Error initializing data:', error);
            setToast({ show: true, message: 'Failed to initialize data', type: 'error' });
        }
    };

    const handleDeleteData = () => {
        setConfirm({
            show: true,
            title: 'Hapus Data',
            message: 'Apakah Anda yakin ingin menghapus semua data untuk tanggal ini?',
            type: 'danger',
            onConfirm: async () => {
                setConfirm({ ...confirm, show: false });
                try {
                    const response = await fetch(`/api/analytics?date=${selectedDate}`, {
                        method: 'DELETE'
                    });

                    const data = await response.json();

                    if (data.success) {
                        await fetchDailyCameraData();
                        setToast({ show: true, message: 'Data berhasil dihapus!', type: 'success' });
                    } else {
                        setToast({ show: true, message: 'Error: ' + data.error, type: 'error' });
                    }
                } catch (error) {
                    console.error('Error deleting data:', error);
                    setToast({ show: true, message: 'Failed to delete data', type: 'error' });
                }
            }
        });
    };

    const handleToggleStatus = (cameraId: number, isOnline: boolean) => {
        setCameraData(prev => prev.map(cam =>
            cam.camera_id === cameraId ? { ...cam, is_online: isOnline } : cam
        ));
    };

    const handleInputChange = (cameraId: number, field: 'usage' | 'note', value: string) => {
        setCameraData(prev => prev.map(cam =>
            cam.camera_id === cameraId ? { ...cam, [field]: value } : cam
        ));
    };

    const handleTogglePlaybackStatus = (cameraId: number, status: string) => {
        setCameraData(prev => prev.map(cam =>
            cam.camera_id === cameraId ? { ...cam, playback_status: status } : cam
        ));
    };

    const handleSetAllOnline = () => {
        setConfirm({
            show: true,
            title: 'Online Semua Kamera',
            message: 'Apakah Anda yakin ingin mengubah semua kamera menjadi ONLINE?',
            type: 'info',
            onConfirm: () => {
                setConfirm({ ...confirm, show: false });
                setCameraData(prev => prev.map(cam => ({ ...cam, is_online: true })));
                setToast({ show: true, message: 'Semua kamera diubah menjadi ONLINE. Jangan lupa Save All!', type: 'info' });
            }
        });
    };

    const handleSetAllOffline = () => {
        setConfirm({
            show: true,
            title: 'Offline Semua Kamera',
            message: 'Apakah Anda yakin ingin mengubah semua kamera menjadi OFFLINE?',
            type: 'warning',
            onConfirm: () => {
                setConfirm({ ...confirm, show: false });
                setCameraData(prev => prev.map(cam => ({ ...cam, is_online: false })));
                setToast({ show: true, message: 'Semua kamera diubah menjadi OFFLINE. Jangan lupa Save All!', type: 'warning' });
            }
        });
    };

    const getPeriodLabel = () => {
        if (analysisPeriod === 'weekly') return '7 Hari Terakhir';
        if (analysisPeriod === 'monthly') return '30 Hari Terakhir';
        if (analysisPeriod === 'yearly') return '1 Tahun Terakhir';
        return `${new Date(customStartDate).toLocaleDateString('id-ID')} - ${new Date(customEndDate).toLocaleDateString('id-ID')}`;
    };

    const handleGenerateAnalyticsPDF = async () => {
        try {
            let startDate: string;
            let endDate: string;

            if (analysisPeriod === 'custom') {
                startDate = customStartDate;
                endDate = customEndDate;
            } else {
                const start = new Date();
                const end = new Date();

                if (analysisPeriod === 'weekly') {
                    start.setDate(start.getDate() - 7);
                } else if (analysisPeriod === 'monthly') {
                    start.setMonth(start.getMonth() - 1);
                } else {
                    start.setFullYear(start.getFullYear() - 1);
                }

                startDate = start.toISOString().slice(0, 10);
                endDate = end.toISOString().slice(0, 10);
            }

            await generatePeriodAnalyticsPDF({
                periodLabel: getPeriodLabel(),
                startDate,
                endDate,
                summary: periodSummary,
                cameras: periodCameras
            });

            setToast({ show: true, message: 'PDF Analytics berhasil di-generate!', type: 'success' });
        } catch (error) {
            console.error('Error generating analytics PDF:', error);
            setToast({ show: true, message: 'Gagal generate PDF Analytics', type: 'error' });
        }
    };

    // Pagination
    const totalPages = Math.ceil(cameraData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = cameraData.slice(indexOfFirstItem, indexOfLastItem);

    const goToPage = (page: number) => setCurrentPage(page);
    const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
    const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
            {/* Header with Fluent Design */}
            <div className="bg-white fluent-shadow-16 border-b-2 border-blue-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 animate-fade-in">
                            <div className="fluent-card-interactive p-2 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100">
                                <img
                                    src="/betriclogoblue.png"
                                    alt="Betric Logo"
                                    className="h-12 w-auto fluent-transition"
                                />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Dashboard Monitoring CCTV Betric</h1>
                                <p className="text-slate-600 text-sm mt-1">Monitoring & Laporan Harian</p>
                            </div>
                        </div>
                        <div className="text-right animate-fade-in">
                            <div className="inline-flex items-center gap-3 bg-gradient-to-br from-blue-50 to-blue-100 px-5 py-3 rounded-xl border border-blue-200/50 fluent-shadow-4">
                                <div>
                                    <div className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Current Time</div>
                                    <div className="text-xl font-bold text-blue-900 tabular-nums">{currentTime || '--:--:--'}</div>
                                </div>
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center fluent-shadow-4">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* SECTION 1: PERIOD ANALYTICS */}
                <div className="fluent-card fluent-reveal p-8 mb-8 animate-scale-in">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl fluent-shadow-8 mr-3">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Analytics Summary - {getPeriodLabel()}</h2>
                        </div>
                    </div>

                    {/* Period Selector */}
                    <div className="mb-6">
                        <div className="flex gap-3 mb-4">
                            <button
                                onClick={() => setAnalysisPeriod('weekly')}
                                className={`px-6 py-3 rounded-lg font-semibold fluent-transition relative overflow-hidden ${analysisPeriod === 'weekly'
                                    ? 'bg-blue-600 text-white fluent-shadow-8'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 fluent-shadow-4'
                                    }`}
                            >
                                Mingguan
                            </button>
                            <button
                                onClick={() => setAnalysisPeriod('monthly')}
                                className={`px-6 py-3 rounded-lg font-semibold fluent-transition relative overflow-hidden ${analysisPeriod === 'monthly'
                                    ? 'bg-blue-600 text-white fluent-shadow-8'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 fluent-shadow-4'
                                    }`}
                            >
                                Bulanan
                            </button>
                            <button
                                onClick={() => setAnalysisPeriod('yearly')}
                                className={`px-6 py-3 rounded-lg font-semibold fluent-transition relative overflow-hidden ${analysisPeriod === 'yearly'
                                    ? 'bg-blue-600 text-white fluent-shadow-8'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 fluent-shadow-4'
                                    }`}
                            >
                                Tahunan
                            </button>
                            <button
                                onClick={() => setAnalysisPeriod('custom')}
                                className={`px-6 py-3 rounded-lg font-semibold fluent-transition relative overflow-hidden ${analysisPeriod === 'custom'
                                    ? 'bg-blue-600 text-white fluent-shadow-8'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 fluent-shadow-4'
                                    }`}
                            >
                                Custom Range
                            </button>
                        </div>

                        {/* Custom Date Range Picker */}
                        {analysisPeriod === 'custom' && (
                            <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DatePicker
                                        label="Dari:"
                                        value={customStartDate}
                                        onChange={setCustomStartDate}
                                    />
                                    <DatePicker
                                        label="Sampai:"
                                        value={customEndDate}
                                        onChange={setCustomEndDate}
                                    />
                                </div>
                                <button
                                    onClick={fetchPeriodAnalytics}
                                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-6 py-3 transition-all"
                                >
                                    Terapkan
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Period Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="fluent-card-interactive bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200/50 fluent-shadow-8">
                            <div className="flex items-center justify-between">
                                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl fluent-shadow-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-blue-700 font-medium">Total Kamera</div>
                                    <div className="text-3xl font-bold text-blue-900">{periodSummary.total_cameras}</div>
                                </div>
                            </div>
                        </div>

                        <div className="fluent-card-interactive bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200/50 fluent-shadow-8">
                            <div className="flex items-center justify-between">
                                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-3 rounded-xl fluent-shadow-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-emerald-700 font-medium">Avg Online</div>
                                    <div className="text-3xl font-bold text-emerald-900">{periodSummary.total_online}</div>
                                </div>
                            </div>
                        </div>

                        <div className="fluent-card-interactive bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-6 border border-rose-200/50 fluent-shadow-8">
                            <div className="flex items-center justify-between">
                                <div className="bg-gradient-to-br from-rose-600 to-rose-700 p-3 rounded-xl fluent-shadow-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-rose-700 font-medium">Avg Offline</div>
                                    <div className="text-3xl font-bold text-rose-900">{periodSummary.total_offline}</div>
                                </div>
                            </div>
                        </div>

                        <div className="fluent-card-interactive bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200/50 fluent-shadow-8">
                            <div className="flex items-center justify-between">
                                <div className="bg-gradient-to-br from-amber-600 to-amber-700 p-3 rounded-xl fluent-shadow-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-amber-700 font-medium">Avg Uptime</div>
                                    <div className="text-3xl font-bold text-amber-900">{periodSummary.avg_uptime.toFixed(1)}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: DAILY CAMERA DATA */}
                <div className="fluent-card fluent-reveal p-8 mb-8 animate-scale-in">
                    <div className="flex items-center justify-between mb-6">
                        <DatePicker
                            label="Pilih Tanggal:"
                            value={selectedDate}
                            onChange={(date) => {
                                setSelectedDate(date);
                                setCurrentPage(1);
                            }}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={handleRefreshData}
                                disabled={refreshing || loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-6 py-2 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {refreshing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Refreshing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Refresh Data
                                    </>
                                )}
                            </button>
                            {cameraData.length > 0 && (
                                <>
                                    <button
                                        onClick={handleBulkSave}
                                        disabled={saving || loading}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-6 py-2 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                                </svg>
                                                Save All
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleDeleteData}
                                        disabled={loading}
                                        className="bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl px-6 py-2 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Hapus Data
                                    </button>
                                </>
                            )}
                            <Link
                                href="/reports"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-6 py-2 transition-all flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                Generate PDF
                            </Link>
                        </div>
                    </div>

                    {/* Daily Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl p-6 border-t-4 border-blue-600 shadow-md">
                            <div className="flex items-center justify-between">
                                <div className="bg-blue-50 p-3 rounded-xl">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500 font-medium">Total Kamera</div>
                                    <div className="text-2xl font-bold text-blue-700">{dailySummary.total_cameras}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border-t-4 border-emerald-500 shadow-md">
                            <div className="flex items-center justify-between">
                                <div className="bg-emerald-50 p-3 rounded-xl">
                                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500 font-medium">Online</div>
                                    <div className="text-2xl font-bold text-emerald-600">{dailySummary.total_online}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border-t-4 border-rose-500 shadow-md">
                            <div className="flex items-center justify-between">
                                <div className="bg-rose-50 p-3 rounded-xl">
                                    <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500 font-medium">Offline</div>
                                    <div className="text-2xl font-bold text-rose-600">{dailySummary.total_offline}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border-t-4 border-amber-500 shadow-md">
                            <div className="flex items-center justify-between">
                                <div className="bg-amber-50 p-3 rounded-xl">
                                    <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500 font-medium">Avg Uptime</div>
                                    <div className="text-2xl font-bold text-amber-600">{dailySummary.avg_uptime.toFixed(1)}%</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border-t-4 border-blue-500 shadow-md">
                            <div className="flex items-center justify-between">
                                <div className="bg-blue-50 p-3 rounded-xl">
                                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500 font-medium">Playback OK</div>
                                    <div className="text-2xl font-bold text-blue-600">{cameraData.filter(cam => cam.playback_status === 'OK').length}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border-t-4 border-orange-500 shadow-md">
                            <div className="flex items-center justify-between">
                                <div className="bg-orange-50 p-3 rounded-xl">
                                    <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500 font-medium">Playback Error</div>
                                    <div className="text-2xl font-bold text-orange-600">{cameraData.filter(cam => cam.playback_status === 'Error').length}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Camera Table */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="bg-blue-900 p-2 rounded-lg mr-3">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Data Kamera - {new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                                    <p className="text-sm text-slate-500">Menampilkan {currentItems.length} dari {cameraData.length} kamera</p>
                                </div>
                            </div>

                            {/* Bulk Action Buttons */}
                            {cameraData.length > 0 && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSetAllOnline}
                                        disabled={loading || saving}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Online Semua
                                    </button>
                                    <button
                                        onClick={handleSetAllOffline}
                                        disabled={loading || saving}
                                        className="bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Offline Semua
                                    </button>
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
                                <p className="mt-4 text-slate-600">Loading data...</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-slate-900 to-blue-900 text-white">
                                                <th className="px-6 py-4 text-left text-sm font-bold rounded-tl-xl">No</th>
                                                <th className="px-6 py-4 text-left text-sm font-bold">Kamera</th>
                                                <th className="px-6 py-4 text-center text-sm font-bold">Status</th>
                                                <th className="px-6 py-4 text-center text-sm font-bold">Playback Status</th>
                                                <th className="px-6 py-4 text-left text-sm font-bold">Usage</th>
                                                <th className="px-6 py-4 text-left text-sm font-bold rounded-tr-xl">Keterangan</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.length > 0 ? (
                                                currentItems.map((camera, idx) => (
                                                    <tr
                                                        key={camera.id}
                                                        className={`fluent-table-row border-b border-slate-200 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
                                                    >
                                                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{indexOfFirstItem + idx + 1}</td>
                                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{camera.cameras.code}</td>
                                                        <td className="px-6 py-4 text-sm text-center">
                                                            <div className="flex gap-2 justify-center">
                                                                <button
                                                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${camera.is_online
                                                                        ? 'bg-emerald-500 text-white shadow-md'
                                                                        : 'bg-white text-emerald-600 border-2 border-emerald-500 hover:bg-emerald-50'
                                                                        }`}
                                                                    onClick={() => handleToggleStatus(camera.camera_id, true)}
                                                                >
                                                                    Online
                                                                </button>
                                                                <button
                                                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${!camera.is_online
                                                                        ? 'bg-rose-500 text-white shadow-md'
                                                                        : 'bg-white text-rose-600 border-2 border-rose-500 hover:bg-rose-50'
                                                                        }`}
                                                                    onClick={() => handleToggleStatus(camera.camera_id, false)}
                                                                >
                                                                    Offline
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-center">
                                                            <div className="flex gap-2 justify-center">
                                                                <button
                                                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${camera.playback_status === 'OK'
                                                                        ? 'bg-blue-500 text-white shadow-md'
                                                                        : 'bg-white text-blue-600 border-2 border-blue-500 hover:bg-blue-50'
                                                                        }`}
                                                                    onClick={() => handleTogglePlaybackStatus(camera.camera_id, 'OK')}
                                                                >
                                                                    OK
                                                                </button>
                                                                <button
                                                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${camera.playback_status === 'Error'
                                                                        ? 'bg-orange-500 text-white shadow-md'
                                                                        : 'bg-white text-orange-600 border-2 border-orange-500 hover:bg-orange-50'
                                                                        }`}
                                                                    onClick={() => handleTogglePlaybackStatus(camera.camera_id, 'Error')}
                                                                >
                                                                    Error
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    className="fluent-input w-28 text-sm text-blue-900"
                                                                    placeholder="0"
                                                                    value={camera.usage?.replace(/[^0-9.]/g, '') || ''}
                                                                    onChange={e => handleInputChange(camera.camera_id, 'usage', e.target.value ? `${e.target.value} GB` : '')}
                                                                />
                                                                <span className="text-sm font-semibold text-slate-600">GB</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="text"
                                                                className="fluent-input w-full text-sm text-blue-900"
                                                                placeholder="Keterangan"
                                                                value={camera.note || ''}
                                                                onChange={e => handleInputChange(camera.camera_id, 'note', e.target.value)}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                            <p className="text-slate-500 text-lg">Tidak ada data kamera untuk tanggal ini</p>
                                                            <button
                                                                onClick={handleInitializeData}
                                                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-8 py-3 transition-all flex items-center gap-2 shadow-lg"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                </svg>
                                                                Munculkan CCTV
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                                        <div className="text-sm text-slate-600">
                                            Halaman {currentPage} dari {totalPages}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={goToPrevPage}
                                                disabled={currentPage === 1}
                                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${currentPage === 1
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                                    }`}
                                            >
                                                ← Prev
                                            </button>

                                            <div className="flex gap-1">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                    <button
                                                        key={page}
                                                        onClick={() => goToPage(page)}
                                                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${currentPage === page
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                            </div>

                                            <button
                                                onClick={goToNextPage}
                                                disabled={currentPage === totalPages}
                                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${currentPage === totalPages
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                                    }`}
                                            >
                                                Next →
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* SECTION 3: GENERATE ANALYTICS PDF */}
                <div className="fluent-card fluent-reveal p-8 mb-8 animate-scale-in">
                    {/* Header */}
                    <div className="border-b border-slate-200 pb-6 mb-6">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Generate PDF Analytics Summary</h2>
                                <p className="text-sm text-slate-600 mt-1">Laporan analytics periode dengan detail 48 CCTV</p>
                            </div>
                        </div>
                    </div>

                    {/* Info Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Periode */}
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-semibold text-slate-600 uppercase">Periode</span>
                            </div>
                            <p className="text-base font-bold text-slate-900">{getPeriodLabel()}</p>
                        </div>

                        {/* Total Kamera */}
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-semibold text-slate-600 uppercase">Total CCTV</span>
                            </div>
                            <p className="text-base font-bold text-slate-900">{periodSummary.total_cameras} Kamera</p>
                        </div>

                        {/* Avg Uptime */}
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <span className="text-xs font-semibold text-slate-600 uppercase">Avg Uptime</span>
                            </div>
                            <p className="text-base font-bold text-slate-900">{periodSummary.avg_uptime.toFixed(1)}%</p>
                        </div>
                    </div>

                    {/* PDF Content Info */}
                    <div className="bg-blue-50 rounded-lg p-5 mb-6 border border-blue-200">
                        <h3 className="text-sm font-bold text-slate-700 mb-3">Isi Laporan PDF:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Ringkasan Statistik Periode</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Detail Status 48 CCTV</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Persentase Online per Kamera</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Average Uptime & Color Coding</span>
                            </div>
                        </div>
                    </div>

                    {/* Download Button */}
                    <button
                        onClick={handleGenerateAnalyticsPDF}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-6 py-4 transition-colors flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Download PDF Analytics Summary</span>
                    </button>

                    {/* Footer Note */}
                    <p className="text-xs text-slate-500 text-center mt-4">
                        PDF akan berisi ringkasan statistik dan detail lengkap untuk periode yang dipilih
                    </p>
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

            {/* Confirm Dialog */}
            {confirm.show && (
                <ConfirmDialog
                    title={confirm.title}
                    message={confirm.message}
                    type={confirm.type}
                    onConfirm={confirm.onConfirm}
                    onCancel={() => setConfirm({ ...confirm, show: false })}
                />
            )}
        </div>
    );
}
