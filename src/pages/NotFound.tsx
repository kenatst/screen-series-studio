const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20" />

      <div className="text-center relative z-10 border border-border bg-card/90 backdrop-blur-xl p-16 rounded-3xl shadow-elevated">
        <h1 className="mb-2 text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-orange-400 drop-shadow-md tracking-tighter">404</h1>
        <p className="mb-8 text-xl text-muted-foreground font-medium tracking-tight">This page does not exist.</p>
        <a href="/" className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
          Back to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
