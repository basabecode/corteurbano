'use client';

import { useState } from 'react';
import { Archive, TrendingUp, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

type MonthlyReport = {
    month: string;
    completed: number;
    cancelled: number;
    revenue: number;
    total: number;
};

export function AdminActions() {
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [showReportsModal, setShowReportsModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reports, setReports] = useState<MonthlyReport[]>([]);
    const { showToast, ToastComponent } = useToast();
    const router = useRouter();

    async function handleArchive() {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/archive-appointments', {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Error al archivar');

            const data = await response.json();
            showToast(data.message, 'success');
            setShowArchiveModal(false);
            router.refresh();
        } catch (error) {
            showToast('Error al archivar citas', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function loadReports() {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/reports?months=12');
            if (!response.ok) throw new Error('Error al cargar reportes');

            const data = await response.json();
            setReports(data.reports);
            setShowReportsModal(true);
        } catch (error) {
            showToast('Error al cargar reportes', 'error');
        } finally {
            setLoading(false);
        }
    }

    function formatMonth(monthStr: string) {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }

    return (
        <>
            {ToastComponent}
            <div className="flex gap-3">
                <Button
                    onClick={loadReports}
                    disabled={loading}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ver Reportes
                </Button>
                <Button
                    onClick={() => setShowArchiveModal(true)}
                    disabled={loading}
                    variant="outline"
                    className="border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                    <Archive className="h-4 w-4 mr-2" />
                    Archivar Completadas
                </Button>
            </div>

            {/* Archive Modal */}
            <Modal
                isOpen={showArchiveModal}
                onClose={() => !loading && setShowArchiveModal(false)}
                title="Archivar Citas"
                size="sm"
                footer={
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowArchiveModal(false)}
                            disabled={loading}
                            className="flex-1 border-slate-700 text-slate-200 hover:bg-slate-800"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleArchive}
                            disabled={loading}
                            className="flex-1 bg-amber-500 text-slate-950 hover:bg-amber-400"
                        >
                            {loading ? 'Archivando...' : 'Sí, archivar'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-slate-300">
                        ¿Deseas archivar todas las citas completadas y canceladas?
                    </p>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                        <p className="text-sm text-slate-400">
                            Las citas archivadas se moverán al historial y se usarán para generar reportes mensuales.
                            Esta acción limpiará el dashboard pero mantendrá los datos para estadísticas.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Reports Modal */}
            <Modal
                isOpen={showReportsModal}
                onClose={() => setShowReportsModal(false)}
                title="Reportes Mensuales"
                size="lg"
            >
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {reports.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            No hay datos en el historial aún
                        </div>
                    ) : (
                        reports.map((report) => (
                            <div
                                key={report.month}
                                className="rounded-xl border border-slate-800 bg-slate-900/40 p-5"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-amber-500/10 p-2">
                                            <Calendar className="h-5 w-5 text-amber-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-100 capitalize">
                                            {formatMonth(report.month)}
                                        </h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-amber-400">
                                            ${report.revenue.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-slate-500">Ingresos</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="rounded-lg bg-slate-800/50 p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                                            <span className="text-xs text-slate-400">Completadas</span>
                                        </div>
                                        <div className="text-xl font-bold text-slate-100">
                                            {report.completed}
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-slate-800/50 p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <XCircle className="h-4 w-4 text-rose-400" />
                                            <span className="text-xs text-slate-400">Canceladas</span>
                                        </div>
                                        <div className="text-xl font-bold text-slate-100">
                                            {report.cancelled}
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-slate-800/50 p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar className="h-4 w-4 text-blue-400" />
                                            <span className="text-xs text-slate-400">Total</span>
                                        </div>
                                        <div className="text-xl font-bold text-slate-100">
                                            {report.total}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-800">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Tasa de éxito:</span>
                                        <span className="font-medium text-emerald-400">
                                            {((report.completed / report.total) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Modal>
        </>
    );
}
