import React, { useState, useEffect } from 'react';
import { useTheme, hexToRgba } from '../contexts/ThemeContext';
import { Megaphone } from 'lucide-react';

const FUNNY_SPONSORS = [
  { slogan: 'Não pergunte o bicho, que o sabor é a sério!', sponsor: 'Salsichas Mistério' },
  { slogan: 'Lava a caspa e o cabelo fica na tigela!', sponsor: 'Champô Calvice Bela' },
  { slogan: 'Tapa a humidade e a parede da vizinha!', sponsor: 'Tintas Maravilha' },
  { slogan: 'Entra a cantar e sai ao murro!', sponsor: 'Cerveja Mija-Burro' },
  { slogan: 'Arde que se farta, mas alivia o tormento grotesco!', sponsor: 'Pomada Rabo Fresco' },
  { slogan: 'Se não vê ao perto, com a armação se safa!', sponsor: 'Óculos Fundo de Garrafa' },
  { slogan: 'Carne tenrinha e dedo fatiado!', sponsor: 'Talho O Amputado' },
  { slogan: 'Tome à noite e acorde reformado!', sponsor: 'Pílulas Sono Pesado' },
  { slogan: 'Mata a sede e arranca as amígdalas inchadas!', sponsor: 'Água das Pedras Roladas' },
  { slogan: 'Se não brilha a mesa, escorrega o pudim!', sponsor: 'Cera para Madeiras Cupim' },
  { slogan: 'Cheira a alfazema como se pinho não fosse!', sponsor: 'Colónia Sovaco Doce' },
  { slogan: 'O carro não anda, mas a pintura não mancha!', sponsor: 'Oficina Mecânica Desmancha' },
  { slogan: 'Se não lava os dentes, pelo menos come pelas berças!', sponsor: 'Dentífrico Moelas' },
  { slogan: 'Frita o peixe, o bife e a toalha de agulha!', sponsor: 'Azeite Fagulha' },
  { slogan: 'Mastigue devagar, senão perde o molar!', sponsor: 'Pastilhas Cimento Forte' },
  { slogan: 'Mata o cheiro e quem tiver ao lado do fogão!', sponsor: 'Desodorizante Furacão' },
  { slogan: 'Apertam à frente, mas a sola não se gasta na valeta!', sponsor: 'Calçados Maneta' },
  { slogan: 'Para a tosse passar e a garganta arranhar!', sponsor: 'Chá de Ortiga Brava' },
  { slogan: 'Cá o esperamos, de pernas estendidas!', sponsor: 'Agência Funerária Boas-Vindas' },
  { slogan: 'Limpa à primeira e o resto aguenta!', sponsor: 'Papel Higiénico Lixa 80' },
  { slogan: 'Estalam no dente como se fossem um tiro!', sponsor: 'Biscoitos Tio Belmiro' },
  { slogan: 'Engula à força e desmaie três dias!', sponsor: 'Xarope Limpa-Vias' },
  { slogan: 'Se não for de porco, é de cabra careca!', sponsor: 'Presunto Perna Seca' },
  { slogan: 'Durma direito ou arrisque um ataque de lombrigue!', sponsor: 'Colchões Tabique' },
  { slogan: 'Se a sua equipa estiver a perder, beba para esquecer!', sponsor: 'Vinho Afoga-Mágoas' },
  { slogan: 'É só empurrar com o dedo!', sponsor: 'Supositórios Alfredo' },
  { slogan: 'De inverno ou de verão, gelados de alcatrão!', sponsor: 'Geladaria Asfalto Doce' },
  { slogan: 'A sua saúde está primeiro, beba água do chuveiro!', sponsor: 'Termas da Canalização' },
  { slogan: 'Se a azia não passar, tente o árbitro culpar!', sponsor: 'Clínica do Apito Amigo' },
  { slogan: 'Pneu furado na autoestrada? Encha com fita isolada!', sponsor: 'Oficina Desenrasca & Vai' },
  { slogan: 'Para a vitória festejar, tremoços e cerveja sem parar!', sponsor: 'Café Central do Golo' }
];

export function SponsorBanner({ title = 'Patrocínio da jornada:', isFooter = false }) {
  const { activeTheme } = useTheme();
  const [index, setIndex] = useState(() => Math.floor(Math.random() * FUNNY_SPONSORS.length));
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % FUNNY_SPONSORS.length);
        setFade(true);
      }, 300);
    }, 5000);

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
          borderColor: `${hexToRgba(activeTheme?.primary, 0.45)}`, 
          backgroundColor: `${hexToRgba(activeTheme?.primary, 0.07)}`,
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
