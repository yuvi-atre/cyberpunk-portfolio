import { useState } from 'react';
import { Modal } from './Modal';
import type { Skill } from '../services/PortfolioService';

const TIER_COLOR: Record<string, string> = {
  advanced: 'var(--text-accent)',
  intermediate: 'var(--info)',
  familiar: 'var(--text-secondary)',
};

const BLOCK_SWATCH: Record<string, string> = {
  data_amber: '#ffb020',
  data_cyan: '#00f0ff',
  data_magenta: '#ff2d95',
  data_green: '#3dff8c',
  power_cell: '#7df9ff',
};

interface Props {
  skills: Skill[];
  collected: Record<string, number>;
  onClose: () => void;
}

/** The gamified skills matrix: mined ores appear here; the rest stay undiscovered. */
export function InventoryModal({ skills, collected, onClose }: Props) {
  const [selected, setSelected] = useState<Skill | null>(null);
  const discovered = Object.keys(collected).length;

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <h2 className="font-display text-sm" style={{ color: 'var(--text-accent)' }}>
        SKILL INVENTORY
      </h2>
      <p className="font-body mt-1 text-lg" style={{ color: 'var(--text-secondary)' }}>
        {discovered}/{skills.length} decrypted — break glowing data nodes in the undercity to fill this in.
      </p>

      {/* progress bar */}
      <div className="mt-3 h-3 w-full border-2" style={{ borderColor: 'var(--border-panel)', borderRadius: 2 }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${(discovered / skills.length) * 100}%`, background: 'var(--success)' }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {skills.map((skill) => {
          const count = collected[skill.id] ?? 0;
          const found = count > 0;
          return (
            <button
              key={skill.id}
              className="pixel-panel-raised cursor-pointer p-3 text-left transition-transform hover:-translate-y-0.5"
              style={{ opacity: found ? 1 : 0.45 }}
              onClick={() => found && setSelected(skill)}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-4 w-4 border"
                  style={{
                    background: found ? BLOCK_SWATCH[skill.blockType] ?? '#888' : '#333',
                    borderColor: 'var(--border-panel)',
                  }}
                />
                <span className="font-display text-[9px] leading-tight">
                  {found ? skill.displayName : '???'}
                </span>
              </div>
              <div className="font-body mt-2 text-base" style={{ color: found ? TIER_COLOR[skill.tier] : 'var(--text-secondary)' }}>
                {found ? `${skill.tier} ×${count}` : 'encrypted'}
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="pixel-panel-raised mt-4 p-4" style={{ borderColor: 'var(--text-accent)' }}>
          <div className="font-display text-[10px]" style={{ color: 'var(--text-accent)' }}>
            {selected.displayName}
          </div>
          <p className="font-body mt-2 text-lg leading-snug">{selected.description}</p>
        </div>
      )}
    </Modal>
  );
}
