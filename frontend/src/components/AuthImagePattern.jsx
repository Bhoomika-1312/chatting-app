const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-base-200 p-12">
      <div className="max-w-md rounded-3xl border border-base-300 bg-base-100 p-8 shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
        <p className="text-base-content/70 leading-relaxed">{subtitle}</p>
        <div className="mt-6 space-y-3 text-sm text-base-content/70">
          <p>• Fast login experience</p>
          <p>• Simple responsive layout</p>
          <p>• Easy access on every device</p>
        </div>
      </div>
    </div>
  );
};

export default AuthImagePattern;
