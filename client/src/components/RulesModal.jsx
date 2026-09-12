import { X, HelpCircle, Sparkles } from 'lucide-react';
import { useTheme, hexToRgba } from '../contexts/ThemeContext';

const RULES = [
  {
    num: '1',
    title: 'Junta o Grupo',
    text: 'Cria a tua liga ou entra por código e junta os amigos que juram que percebem de bola.'
  },
  {
    num: '2',
    title: 'Palpites 1 X 2 Gratuitos',
    text: 'Colocar palpites NÃO retira pontos. Escolhe Vitória Casa (1), Empate (X) ou Vitória Fora (2) em todos os jogos da jornada.'
  },
  {
    num: '3',
    title: 'Pontuação dos Jogos',
    points: [
      { label: 'Acerto', value: '+3 pts', color: 'text-emerald-400' },
      { label: 'Erro', value: '-1 pt', color: 'text-rose-400' },
      { label: 'Não apostou', value: '-2 pts', color: 'text-rose-500' },
    ],
    text: 'Todos começam com 0 pontos — o saldo pode ficar positivo ou negativo ao longo da época.'
  },
  {
    num: '4',
    title: 'Bónus Campeão da Jornada',
    text: 'Quando todos os jogos da jornada terminarem, quem fizer mais pontos na jornada recebe +3 pontos extra! Em caso de empate no 1º lugar, todos os empatados recebem os +3 pontos.'
  },
  {
    num: '5',
    title: 'Fecho e Transparência',
    text: 'O palpite tranca ao apito inicial de cada jogo. Assim que a bola rola, os palpites de todos os membros da liga ficam visíveis. As pontuações são creditadas logo após o apito final.'
  },
  {
    num: '6',
    title: 'Campeão da Época',
    text: 'Quem tiver mais pontos acumulados no final das 34 jornadas sagra-se o grande campeão STRIKER da época!'
  }
];

export function RulesModal({ isOpen, onClose }) {
  const { activeTheme } = useTheme();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-[#0b0e17] border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-orbitron">
            <HelpCircle size={16} style={{ color: activeTheme?.primary }} />
            Regras Oficiais do STRIKER
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Rules list */}
        <div className="space-y-4">
          {RULES.map(rule => (
            <div key={rule.num} className="flex gap-3">
              {/* Number bubble */}
              <div
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black font-orbitron text-black mt-0.5"
                style={{ backgroundColor: activeTheme?.primary || '#ffd700' }}
              >
                {rule.num}
              </div>
              <div>
                <div className="text-xs font-bold text-white font-orbitron mb-1">{rule.title}</div>
                {rule.points && (
                  <div className="flex gap-3 mb-1.5">
                    {rule.points.map(p => (
                      <div key={p.label} className="text-center">
                        <div className={`text-xs font-black font-orbitron ${p.color}`}>{p.value}</div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">{p.label}</div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 leading-relaxed">{rule.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="mt-5 p-3 rounded-xl text-center text-[10px] font-bold font-orbitron flex items-center justify-center gap-1.5"
          style={{
            backgroundColor: hexToRgba(activeTheme?.primary, 0.08),
            borderColor: hexToRgba(activeTheme?.primary, 0.25),
            color: activeTheme?.primary,
            border: '1px solid'
          }}
        >
          <Sparkles size={14} />
          <span>Boa sorte a todos! Que vença o melhor STRIKER! ⚽</span>
        </div>
      </div>
    </div>
  );
}
