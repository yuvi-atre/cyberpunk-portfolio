import { useCallback, useEffect, useMemo, useState } from 'react';
import { PhaserGame } from './PhaserGame';
import { EventBus, GameEvents } from './game/EventBus';
import { PortfolioService, type Experience, type Project, type Sign, type Skill } from './services/PortfolioService';
import { LoadingScreen } from './components/LoadingScreen';
import { HUD } from './components/HUD';
import { DialogueModal } from './components/DialogueModal';
import { ProjectModal } from './components/ProjectModal';
import { InventoryModal } from './components/InventoryModal';
import { AboutModal } from './components/AboutModal';
import { ChestModal } from './components/ChestModal';
import { SignToast } from './components/SignToast';
import { SkillToast } from './components/SkillToast';
import { MobileControls } from './components/MobileControls';

/**
 * Application shell. Owns all UI state and the z-index stack:
 * game canvas (z-0) < HUD (z-10) < modals (z-20) < loading screen (z-50).
 * All game communication flows through the EventBus only.
 */
export default function App() {
  const [loading, setLoading] = useState(true);
  const [dialogue, setDialogue] = useState<Experience | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [sign, setSign] = useState<Sign | null>(null);
  const [chestOpen, setChestOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [collected, setCollected] = useState<Record<string, number>>({});
  const [skillToast, setSkillToast] = useState<Skill | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [depth, setDepth] = useState(0);

  const isTouch = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    []
  );

  const anyModalOpen = !!dialogue || !!project || chestOpen || aboutOpen || inventoryOpen;

  // Tell the game to freeze player input while a modal is up.
  useEffect(() => {
    EventBus.emit(GameEvents.UI_MODAL_STATE, anyModalOpen);
  }, [anyModalOpen]);

  useEffect(() => {
    const onDialogue = (e: Experience) => setDialogue(e);
    const onProject = (p: Project) => setProject(p);
    const onSign = (s: Sign) => setSign(s);
    const onChest = () => setChestOpen(true);
    const onSkill = (s: Skill) => {
      setCollected((prev) => ({ ...prev, [s.id]: (prev[s.id] ?? 0) + 1 }));
      setSkillToast(s);
    };
    const onHint = (label: string | null) => setHint(label);
    const onDepth = (d: number) => setDepth(d);

    EventBus.on(GameEvents.DIALOGUE_OPEN, onDialogue);
    EventBus.on(GameEvents.PROJECT_OPEN, onProject);
    EventBus.on(GameEvents.SIGN_OPEN, onSign);
    EventBus.on(GameEvents.CHEST_OPEN, onChest);
    EventBus.on(GameEvents.SKILL_COLLECTED, onSkill);
    EventBus.on(GameEvents.INTERACT_HINT, onHint);
    EventBus.on(GameEvents.PLAYER_DEPTH, onDepth);
    return () => {
      EventBus.off(GameEvents.DIALOGUE_OPEN, onDialogue);
      EventBus.off(GameEvents.PROJECT_OPEN, onProject);
      EventBus.off(GameEvents.SIGN_OPEN, onSign);
      EventBus.off(GameEvents.CHEST_OPEN, onChest);
      EventBus.off(GameEvents.SKILL_COLLECTED, onSkill);
      EventBus.off(GameEvents.INTERACT_HINT, onHint);
      EventBus.off(GameEvents.PLAYER_DEPTH, onDepth);
    };
  }, []);

  const closeAll = useCallback(() => {
    setDialogue(null);
    setProject(null);
    setChestOpen(false);
    setAboutOpen(false);
    setInventoryOpen(false);
  }, []);

  // Global keys: I toggles inventory, Escape closes everything.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll();
      if ((e.key === 'i' || e.key === 'I') && !dialogue && !project && !chestOpen && !aboutOpen) {
        setInventoryOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeAll, dialogue, project, chestOpen, aboutOpen]);

  const totalSkills = PortfolioService.skills.length;
  const discovered = Object.keys(collected).length;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <PhaserGame />

      {!loading && (
        <HUD
          personal={PortfolioService.personal}
          hint={hint}
          depth={depth}
          discovered={discovered}
          totalSkills={totalSkills}
          isTouch={isTouch}
          onOpenAbout={() => setAboutOpen(true)}
          onOpenInventory={() => setInventoryOpen(true)}
        />
      )}

      {!loading && isTouch && !anyModalOpen && <MobileControls />}

      {dialogue && <DialogueModal experience={dialogue} onClose={() => setDialogue(null)} />}
      {project && <ProjectModal project={project} onClose={() => setProject(null)} />}
      {inventoryOpen && (
        <InventoryModal
          skills={PortfolioService.skills}
          collected={collected}
          onClose={() => setInventoryOpen(false)}
        />
      )}
      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
      {chestOpen && <ChestModal onClose={() => setChestOpen(false)} />}

      {sign && <SignToast sign={sign} onDone={() => setSign(null)} />}
      {skillToast && <SkillToast skill={skillToast} onDone={() => setSkillToast(null)} />}

      {loading && <LoadingScreen onEnter={() => setLoading(false)} />}
    </div>
  );
}
