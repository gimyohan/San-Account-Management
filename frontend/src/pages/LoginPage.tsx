import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../api/authService';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import type { ErrorResponse } from '../api/client';

interface LoginPageProps {
  onLoginSuccess: (role: string) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: (code: string) => authService.login('admin', code),
    onSuccess: (res) => {
      setError('');
      onLoginSuccess(res.data.role);
    },
    onError: (err: ErrorResponse) => {
      setError(err.detail || '로그인에 실패했습니다.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('코드를 입력해주세요.');
      return;
    }
    loginMutation.mutate(code.trim());
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* 배경 효과 */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/15 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* 로고 영역 */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Lock size={28} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">SAM Admin</h1>
          <p className="text-slate-400 text-sm mt-2">관리자 코드를 입력하여 접속하세요</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="password"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(''); }}
              placeholder="Access Code"
              autoFocus
              disabled={loginMutation.isPending}
              className="w-full bg-slate-900 border border-slate-800 text-white px-5 py-4 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-slate-600 transition-all text-center text-lg tracking-widest font-mono disabled:opacity-50"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-3 rounded-xl">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending || !code.trim()}
            className="w-full bg-primary text-white dark:bg-white dark:text-slate-900 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 dark:shadow-white/10"
          >
            {loginMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                접속하기
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-8">
          SAM Account Manager &copy; 2024
        </p>
      </div>
    </div>
  );
}
