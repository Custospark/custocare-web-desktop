import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { axiosInstance } from '../../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../../app/store/contexts/toast/useToast';

interface ImportResult {
  imported: number;
  errors: { row: number; errors: Record<string, string[]> }[];
  total_rows: number;
}

interface InventoryImportModalProps {
  theme: 'light' | 'dark';
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export const InventoryImportModal: React.FC<InventoryImportModalProps> = ({
  theme,
  open,
  onClose,
  onImported,
}) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const overlay = isDark ? 'bg-black/60' : 'bg-black/40';
  const panel = isDark
    ? 'bg-slate-900 border-slate-700 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';
  const muted = isDark ? 'text-slate-400' : 'text-slate-600';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await axiosInstance.post<ImportResult>('/inventory-items/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600_000,
        onUploadProgress: (event) => {
          if (!event.total) return;
          if (event.loaded >= event.total) {
            setUploadProgress(100);
            return;
          }
          setUploadProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
        },
      });
      setUploadProgress(100);
      setResult(data);
      if (data.imported > 0) {
        showToast('success', `${data.imported} inventory items imported successfully`);
        onImported();
      }
    } catch (err: unknown) {
      const axiosErr = err as { code?: string; response?: { data?: { message?: string } } };
      const message = axiosErr.code === 'ECONNABORTED'
        ? 'Import timed out — try a smaller file or split into multiple uploads'
        : axiosErr.response?.data?.message || 'Import failed';
      showToast('error', message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const { data } = await axiosInstance.get('/inventory-items/import-template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory-item-import-template.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      showToast('error', 'Failed to download template');
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setUploadProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  if (!open) return null;

  return (
    <div
      className={cn('fixed inset-0 z-50 flex items-center justify-center p-4', overlay)}
      onClick={(e) => { if (e.target === e.currentTarget) { reset(); onClose(); } }}
    >
      <div className={cn('w-full max-w-lg rounded-2xl border shadow-2xl', panel)}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl', isDark ? 'bg-blue-500/20' : 'bg-blue-100')}>
              <Upload className={cn('w-5 h-5', isDark ? 'text-blue-400' : 'text-blue-600')} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Import Inventory Items</h2>
              <p className={cn('text-xs', muted)}>Bulk upload from spreadsheet</p>
            </div>
          </div>
          <button
            onClick={() => { reset(); onClose(); }}
            className={cn('p-2 rounded-lg transition-colors cursor-pointer', isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {!result ? (
            <>
              <p className={cn('text-sm', muted)}>
                Upload an Excel file (.xlsx, .xls, or .csv) with your inventory data.
                <br />Max 20MB. Large imports (1,000+ rows) may take a few minutes — keep this window open.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadTemplate}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 cursor-pointer',
                    isDark
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </button>
              </div>

              <div className={cn(
                'border-2 border-dashed rounded-xl p-6 text-center transition-colors',
                isDark ? 'border-slate-700 hover:border-blue-500' : 'border-gray-300 hover:border-blue-400'
              )}>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileSpreadsheet className={cn('w-10 h-10 mx-auto mb-2', isDark ? 'text-slate-500' : 'text-gray-400')} />
                  <p className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-gray-700')}>
                    {file ? file.name : 'Click to select file'}
                  </p>
                  {file && <p className={cn('text-xs mt-1', muted)}>{(file.size / 1024).toFixed(1)} KB</p>}
                </label>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{uploadProgress < 100 ? 'Uploading file…' : 'Processing on server…'}</span>
                    {uploadProgress > 0 && uploadProgress < 100 && <span>{uploadProgress}%</span>}
                  </div>
                  <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-slate-800' : 'bg-gray-100')}>
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: uploadProgress < 100 ? `${uploadProgress}%` : '100%' }}
                    />
                  </div>
                  {uploadProgress >= 100 && (
                    <p className={cn('text-xs', muted)}>Importing items — this can take a few minutes for large files.</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { reset(); onClose(); }}
                  disabled={uploading}
                  className={cn(
                    'px-4 py-3 rounded-xl font-semibold text-sm transition-all border-2 cursor-pointer',
                    isDark
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className={cn(
                    'px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer',
                    file && !uploading
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  )}
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Upload & Import</>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={cn(
                'p-4 rounded-xl flex items-start gap-3',
                result.errors.length > 0
                  ? isDark ? 'bg-amber-900/20 border border-amber-800' : 'bg-amber-50'
                  : isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50'
              )}>
                {result.errors.length > 0 ? (
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className={cn('font-medium', isDark ? 'text-slate-200' : 'text-gray-900')}>
                    {result.imported} of {result.total_rows} imported
                  </p>
                  {result.errors.length > 0 && (
                    <p className="text-sm text-amber-700 mt-1">{result.errors.length} row(s) had errors</p>
                  )}
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {result.errors.map((e) => (
                    <div key={e.row} className={cn('p-3 rounded-xl text-sm', isDark ? 'bg-red-900/20' : 'bg-red-50')}>
                      <p className="font-medium text-red-800 mb-1">Row {e.row}</p>
                      <ul className="list-disc list-inside text-red-600 text-xs space-y-0.5">
                        {Object.values(e.errors).flat().map((msg, i) => <li key={i}>{msg}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => { reset(); onClose(); }}
                  className="px-4 py-3 rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryImportModal;
