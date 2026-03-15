import { useAuth } from "@/contexts/AuthContext";

export const LoginPage = () => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black tracking-tight text-foreground font-display mb-2">
            bubble<span className="text-productive">.</span>
          </h1>
          <p className="text-muted-foreground font-medium text-sm">Your life, visualized</p>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: '4px solid #000000',
            boxShadow: '8px 8px 0px #000000',
            borderRadius: 20,
            padding: 32,
          }}
        >
          <h2 className="text-xl font-black text-foreground mb-2">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Sign in to access your life bubble map, track time, and get personalized insights.
          </p>

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 font-black text-sm transition-all active:translate-y-0.5 disabled:opacity-50"
            style={{
              background: '#FFFFFF',
              border: '3px solid #000000',
              boxShadow: '4px 4px 0px #000000',
              borderRadius: 12,
            }}
          >
            {/* Google "G" icon via SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-[11px] text-muted-foreground mt-6 leading-relaxed">
            By signing in, your data is stored securely in your personal Firebase account.
          </p>
        </div>

        {/* Footer hints */}
        <div className="flex justify-center gap-6 mt-8">
          {['Life Map', 'Time Tracking', 'AI Insights'].map(f => (
            <div key={f} className="text-center">
              <div
                className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center"
                style={{ background: '#F5F5F5', border: '2px solid #000000', boxShadow: '2px 2px 0px #000000' }}
              />
              <p className="text-[10px] font-bold text-muted-foreground">{f}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
