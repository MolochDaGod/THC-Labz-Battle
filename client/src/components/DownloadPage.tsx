import React from 'react';
import { Download, FileArchive, Upload, ExternalLink } from 'lucide-react';

export default function DownloadPage() {
  const handleDownload = async () => {
    try {
      const response = await fetch('/api/download/final');
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'thc-dope-budz-final.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black text-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'ThumbsDown, sans-serif' }}>
            THC DOPE BUDZ
          </h1>
          <p className="text-xl text-green-400" style={{ fontFamily: 'LemonMilk, sans-serif' }}>
            Download & Deploy
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-8 mb-8 border border-green-400">
            <div className="text-center mb-8">
              <FileArchive className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Ready for Deployment</h2>
              <p className="text-gray-300">
                Download the complete THC Dope Budz game package ready for Puter deployment
              </p>
            </div>

            {/* Download Instructions */}
            <div className="text-center mb-8">
              <div className="bg-yellow-600 text-black px-6 py-3 rounded-lg mb-4 text-sm font-semibold">
                ⚠️ Manual Download Required
              </div>
              <p className="text-gray-300 mb-4">
                Due to system limitations, please download the files manually from the Replit workspace
              </p>
              <div className="bg-gray-900 p-4 rounded-lg text-left">
                <p className="text-green-400 font-semibold mb-2">Files to Download:</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Copy the entire <code className="bg-gray-700 px-1 rounded">Final/</code> directory</li>
                  <li>• All files are ready for immediate Puter deployment</li>
                  <li>• Main entry point: <code className="bg-gray-700 px-1 rounded">index.html</code></li>
                </ul>
              </div>
            </div>

            {/* Features List */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="text-green-400 font-semibold mb-2">✓ Complete Game Package</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Full Web3 cannabis trading game</li>
                  <li>• Solana wallet integration</li>
                  <li>• 50 achievements system</li>
                  <li>• AI assistant with NFT gating</li>
                </ul>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="text-green-400 font-semibold mb-2">✓ Production Ready</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Working intro video</li>
                  <li>• Mobile responsive design</li>
                  <li>• Real token balances</li>
                  <li>• 45-day gameplay cycles</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Deployment Instructions */}
          <div className="bg-gray-800 rounded-lg p-8 border border-green-400">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Upload className="w-6 h-6 text-green-400" />
              Puter Deployment Instructions
            </h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Copy Files from Replit</h3>
                  <p className="text-gray-300">
                    Copy the entire <code className="bg-gray-700 px-1 rounded">Final/</code> directory from this Replit workspace to your local machine.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Open Puter</h3>
                  <p className="text-gray-300">
                    Go to <a href="https://puter.com" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">puter.com</a> and log into your account.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Upload & Deploy</h3>
                  <p className="text-gray-300">
                    Upload all files from the Final/ directory to Puter. Set <code className="bg-gray-700 px-1 rounded">index.html</code> as your main file when prompted.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Access Your Game</h3>
                  <p className="text-gray-300">
                    Once deployed, Puter will provide you with a live URL. Your THC Dope Budz game will be accessible to players worldwide!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-green-900 bg-opacity-30 rounded-lg border border-green-400">
              <div className="flex items-center gap-3 mb-2">
                <ExternalLink className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-green-400">Note</span>
              </div>
              <p className="text-sm text-gray-300">
                The package includes all necessary files, configurations, and assets. No additional setup required - just drag, drop, and play!
              </p>
            </div>
          </div>

          {/* Back to Game */}
          <div className="text-center mt-8">
            <a
              href="/"
              className="text-green-400 hover:text-green-300 underline text-lg"
            >
              ← Back to Game
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}