type LandingProps = {
    onStart: () => void;
};

export function Landing({ onStart }: LandingProps) {
    return (
        <div
            className="flex min-h-screen text-gray-100 relative scanlines"
        >
            <div className="absolute inset-0 pointer-events-none noise-overlay opacity-[0.15]" />

            <nav className="absolute top-0 w-full pl-6 pr-6 pt-4 flex justify-end items-center font-mono z-50">
                <a
                    href="https://centrai.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-green-400 transition-colors flex items-center gap-2"
                >
                    <img
                        src="/favicon.png"
                        alt="centrai.co favicon"
                        className="w-4 h-4"
                    />
                    centrai.co
                </a>
            </nav>

            <div className="flex-1 flex flex-col items-center justify-center p-6 relative mt-24">
                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
                    <div className="flex items-center justify-center gap-2 text-sm font-mono text-gray-500 mb-12">
                        <span className="w-2 h-2 bg-green-500/50 rounded-full status-pulse" />
                        <span className="tracking-wider">System Online</span>
                    </div>

                    <div className="flex flex-col items-center">
                        <h1 className="text-4xl md:text-6xl font-mono font-bold mb-6 tracking-tight bg-gradient-to-r from-gray-100 to-gray-300 text-transparent bg-clip-text">
                            Deep Research Chat
                        </h1>
                        <p className="text-lg md:text-xl text-gray-400 font-mono mb-12 max-w-2xl mx-auto leading-relaxed typing-text">
                            <span className="typing-cursor"></span>
                        </p>
                        <img
                            src="/favicon.png"
                            alt="Deep Research favicon"
                            className="w-16 h-16 mb-6"
                        />

                    </div>

                    <div className="animate-fade-in-up animation-delay-200 flex flex-col space-y-4 max-w-md mx-auto">
                        <button
                            onClick={onStart}
                            className="w-full group relative px-16 py-6 text-base font-mono bg-transparent text-green-400 border-2 border-green-500/30 hover:border-green-400/50 transition-all duration-300 overflow-hidden transform hover:scale-105"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-green-900/5 to-black/0" />
                            <span className="relative z-10 group-hover:text-green-300 tracking-wider font-bold">
                                START_RESEARCH
                            </span>
                            <div className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute inset-0 rotate-180 bg-gradient-to-r from-transparent via-green-500/10 to-transparent blur-sm" />
                            </div>
                        </button>
                    </div>

                    <div className="pt-16 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 font-mono text-sm max-w-4xl mx-auto px-4 md:px-6">
                        <div className="relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative border border-gray-800/30 bg-gray-900/20 backdrop-blur-sm p-4 md:p-6 hover:border-green-500/30 transition-colors duration-300">
                                <div className="text-green-400/80 mb-2 md:mb-3 flex items-center justify-center gap-2 text-xs md:text-sm">
                                    <div className="w-1.5 h-1.5 bg-green-500/50 rounded-full animate-pulse" />
                                    Latest Update
                                </div>
                                <div className="text-gray-500 font-light tracking-wide text-xs md:text-sm leading-relaxed text-center">
                                    Advanced Search Capabilities
                                </div>
                            </div>
                        </div>

                        <div className="relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative border border-gray-800/30 bg-gray-900/20 backdrop-blur-sm p-4 md:p-6 hover:border-green-500/30 transition-colors duration-300">
                                <div className="text-green-400/80 mb-2 md:mb-3 flex items-center justify-center gap-2 text-xs md:text-sm">
                                    <div className="w-1.5 h-1.5 bg-green-500/50 rounded-full animate-pulse" />
                                    New Features
                                </div>
                                <div className="text-gray-500 font-light tracking-wide text-xs md:text-sm leading-relaxed text-center">
                                    Enhanced Document Analysis
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 text-[10px] text-gray-600/50 font-mono tracking-widest">
                        Centr Your Search
                    </div>
                </div>
            </div>
        </div>
    );
} 