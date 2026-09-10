import React, { useState, useEffect } from 'react';
import { useTheme, hexToRgba } from '../contexts/ThemeContext';
import { Megaphone } from 'lucide-react';

const FUNNY_SPONSORS = [
  { slogan: 'De inverno ou de ver\u{00E3}o, gelados de alcatr\u{00E3}o!', sponsor: 'Geladaria Asfalto Doce' },
  { slogan: 'A sua sa\u{00FA}de est\u{00E1} primeiro, beba \u{00E1}gua do chuveiro!', sponsor: 'Termas da Canaliza\u{00E7}\u{00E3}o' },
  { slogan: 'Se a azia n\u{00E3}o passar, tente o \u{00E1}rbitro culpar!', sponsor: 'Cl\u{00ED}nica do Apito Amigo' },
  { slogan: 'Pneu furado na autoestrada? Encha com fita isolada!', sponsor: 'Oficina Desenrasca & Vai' },
  { slogan: 'Para a vit\u{00F3}ria festejar, tremo\u{00E7}os e jola sem parar!', sponsor: 'Caf\u{00E9} Central do Golo' }
];

export function SponsorBanner({ title = 'Patroc\u{00ED}nio da jornada:', isFooter = false }) {
  const { activeTheme } = useTheme();
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % FUNNY_SPONSORS.length);
        setFade(true);
      }, 300);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  const current = FUNNY_SPONSORS[index];

  return (
    <div className="w-full select-none">
      <div className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Megaphone size={11} className="text-amber-400" />
          {title}
        </span>
        <span className="text-[8px] font-mono tracking-wider" style={{ color: activeTheme?.primary || '#ffd700' }}>
          PATROCINADOR OFICIAL
        </span>
      </div>

      <div 
        className={`rounded-xl border border-dashed flex items-center justify-between px-3 transition-all duration-300 ${
          isFooter ? 'h-11' : 'h-10'
        }`}
        style={{ 
          borderColor: `${hexToRgba(activeTheme?.primary, 0.4)}`, 
          backgroundColor: `${hexToRgba(activeTheme?.primary, 0.06)}`,
          boxShadow: `0 0 12px ${hexToRgba(activeTheme?.primary, 0.1)}`
        }}
      >
        <div className={`transition-opacity duration-300 flex-1 truncate ${fade ? 'opacity-100' : 'opacity-0'}`}>
          <div className="text-xs font-bold text-white font-rajdhani tracking-wide truncate">
            &ldquo;{current.slogan}&rdquo;
          </div>
          <div className="text-[9px] text-slate-400 font-mono -mt-0.5 truncate">
            &mdash; {current.sponsor}
          </div>
        </div>

        <div className="shrink-0 pl-2">
          <span className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
            PROMO
          </span>
        </div>
      </div>
    </div>
  );
}