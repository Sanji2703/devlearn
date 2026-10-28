import React, { useState } from 'react';
import { Download, Smartphone, Check, HelpCircle, X, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'banner' | 'modal';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      setShowInstructions(true);
    }
  };

  if (isInstalled) {
    if (variant === 'navbar') {
      return (
        <div
          className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#D9E8F4]/80 border border-[#B7C9D6] text-[11px] font-medium text-[#1E2538] ${className}`}
          title="Application installée en PWA"
        >
          <Check className="w-3.5 h-3.5 text-[#1E2538]" />
          <span>App installée</span>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {variant === 'navbar' && (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white shadow-sm transition-all cursor-pointer border border-[#1E2538] ${className}`}
          title="Installer l'application sur Android ou PC"
        >
          <Download className="w-3.5 h-3.5 text-[#C5D9E9]" />
          <span>Installer</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className={`p-4 rounded-2xl bg-[#D9E8F4] border border-[#B7C9D6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E2538] text-white flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-[#D9E8F4]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#1E2538]">
                Installer DevLearn sur votre téléphone Android
              </div>
              <div className="text-xs text-[#1E2538]/80 mt-0.5">
                Accédez rapidement à vos cours, exercices et planning en plein écran hors ligne.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setShowInstructions(true)}
              className="px-3 py-1.5 text-xs font-medium text-[#1E2538] hover:bg-[#C5D9E9] rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Comment faire ?</span>
            </button>
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#C5D9E9]" />
              <span>{isInstallable ? 'Installer maintenant' : 'Installer sur Android'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Installation Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#F4F7F9] border border-[#B7C9D6] rounded-2xl max-w-md w-full p-6 shadow-xl text-[#1E2538] relative">
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#9BA7B8] hover:text-[#1E2538] hover:bg-[#C5D9E9] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#1E2538] text-white flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-[#D9E8F4]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1E2538]">Installer l'application PWA</h3>
                <p className="text-xs text-[#9BA7B8]">Compatible Android (Chrome) & PC</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl bg-[#D9E8F4] border border-[#B7C9D6]">
                <div className="font-semibold text-sm mb-1 text-[#1E2538] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1E2538] text-white text-[11px] flex items-center justify-center font-mono">1</span>
                  Sur Android (Google Chrome)
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[#1E2538]/90 pl-1 mt-1.5">
                  <li>Ouvrez l'application dans <strong>Google Chrome</strong>.</li>
                  <li>Touchez le menu à trois points <strong>(⋮)</strong> en haut à droite.</li>
                  <li>Sélectionnez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</li>
                  <li>L'icône DevLearn apparaît directement avec vos applications Android !</li>
                </ol>
              </div>

              {isIOS ? (
                <div className="p-3.5 rounded-xl bg-[#C5D9E9] border border-[#B7C9D6]">
                  <div className="font-semibold text-sm mb-1 text-[#1E2538] flex items-center gap-2">
                    <Share className="w-4 h-4 text-[#1E2538]" />
                    Sur iPhone / iPad (Safari)
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[#1E2538]/90 pl-1 mt-1.5">
                    <li>Touchez le bouton <strong>Partager</strong> en bas de Safari.</li>
                    <li>Faites défiler et appuyez sur <strong>« Sur l'écran d'accueil »</strong>.</li>
                  </ol>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#C5D9E9]/60 border border-[#B7C9D6]">
                  <div className="font-semibold text-sm mb-1 text-[#1E2538] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#1E2538] text-white text-[11px] flex items-center justify-center font-mono">2</span>
                    Sur Ordinateur (Chrome / Edge)
                  </div>
                  <p className="text-[#1E2538]/90 pl-1 mt-1">
                    Cliquez sur l'icône d'installation dans la barre d'adresse du navigateur à droite pour installer la fenêtre autonome.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowInstructions(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#1E2538] text-white hover:bg-[#2C3652] transition-colors cursor-pointer"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
