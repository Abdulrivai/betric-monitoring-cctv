'use client';
import { useState, useRef, useEffect } from 'react';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    label?: string;
}

export default function DatePicker({ value, onChange, label }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date(value || new Date()));
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (number | null)[] = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const handleDateClick = (day: number) => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const newDate = new Date(year, month, day);
        setSelectedDate(newDate);

        // Format date as YYYY-MM-DD without timezone conversion
        const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onChange(formattedDate);
        setIsOpen(false);
    };

    const handleMonthChange = (increment: number) => {
        const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + increment, 1);
        setSelectedDate(newDate);
    };

    const handleYearChange = (increment: number) => {
        const newDate = new Date(selectedDate.getFullYear() + increment, selectedDate.getMonth(), 1);
        setSelectedDate(newDate);
    };

    const formatDisplayDate = (date: Date) => {
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() &&
            selectedDate.getMonth() === today.getMonth() &&
            selectedDate.getFullYear() === today.getFullYear();
    };

    const isSelected = (day: number) => {
        // Parse the date string properly to avoid timezone issues
        const [year, month, dayOfMonth] = value.split('-').map(Number);
        return day === dayOfMonth &&
            selectedDate.getMonth() === month - 1 &&
            selectedDate.getFullYear() === year;
    };

    const days = getDaysInMonth(selectedDate);

    return (
        <div className="relative" ref={containerRef}>
            {label && <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-left text-slate-900 font-medium hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all flex items-center justify-between group"
            >
                <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDisplayDate(new Date(value))}</span>
                </div>
                <svg className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 left-0 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-scale-in min-w-[320px]">
                    {/* Month/Year Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => handleYearChange(-1)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => handleMonthChange(-1)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="text-center">
                            <div className="font-bold text-slate-900">{months[selectedDate.getMonth()]}</div>
                            <div className="text-sm text-slate-600">{selectedDate.getFullYear()}</div>
                        </div>

                        <button
                            onClick={() => handleMonthChange(1)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => handleYearChange(1)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Days of Week */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {daysOfWeek.map(day => (
                            <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => (
                            <div key={index}>
                                {day ? (
                                    <button
                                        onClick={() => handleDateClick(day)}
                                        className={`w-full aspect-square rounded-lg text-sm font-medium transition-all ${isSelected(day)
                                            ? 'bg-blue-600 text-white shadow-lg scale-105'
                                            : isToday(day)
                                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                : 'text-slate-700 hover:bg-slate-100'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ) : (
                                    <div className="w-full aspect-square"></div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Today Button */}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <button
                            onClick={() => {
                                const today = new Date();
                                setSelectedDate(today);
                                onChange(today.toISOString().slice(0, 10));
                                setIsOpen(false);
                            }}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-all"
                        >
                            Hari Ini
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
