// ============================================
// PruefplaenePanel - Haupt-Container mit State-Management
// Verwendet jetzt echte API-Calls nach Main_Doku.json
// ============================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Pruefplan, PruefplanAnsicht, PruefschrittStatus } from '../../types/menu.types';
import type { StatusTyp } from '../StatusLog';
import { pruefplanService } from '../../services/PruefplanService';
import { executeStep } from '../../services/commands';
import PruefplanListe from './PruefplanListe';
import PruefplanAktiv from './PruefplanAktiv';
import ConditionPopup from './ConditionPopup';
import './menu.css';

// ============================================
// Props Interface
// ============================================
interface PruefplaenePanelProps {
  setzeStatus?: (nachricht: string, typ?: StatusTyp) => void;
}

// ============================================
// Condition-Popup State Interface
// ============================================
interface ConditionPopupState {
  sichtbar: boolean;
  nachricht: string;
  wartAufBestaetigung: boolean;
}

const PruefplaenePanel: React.FC<PruefplaenePanelProps> = ({ setzeStatus }) => {
  // ============================================
  // State
  // ============================================
  const [ansicht, setAnsicht] = useState<PruefplanAnsicht>('liste');
  const [ausgewaehlterPlan, setAusgewaehlterPlan] = useState<Pruefplan | null>(null);
  const [aktiverSchrittIndex, setAktiverSchrittIndex] = useState<number>(0);
  const [simulationLaeuft, setSimulationLaeuft] = useState<boolean>(false);
  
  // Condition-Popup State
  const [conditionPopup, setConditionPopup] = useState<ConditionPopupState>({
    sichtbar: false,
    nachricht: '',
    wartAufBestaetigung: false,
  });

  // Abbruch-Flag
  const abbruchRef = useRef<boolean>(false);

  // Prüfpläne aus Service laden
  const pruefplaene = pruefplanService.getPruefplaene();

  // ============================================
  // Status-Hilfsfunktion
  // ============================================
  const updateStatus = useCallback((nachricht: string, typ: StatusTyp = 'info') => {
    if (setzeStatus) {
      setzeStatus(nachricht, typ);
    }
  }, [setzeStatus]);

  // Initial-Status setzen
  useEffect(() => {
    if (ansicht === 'liste') {
      updateStatus('Prüfplan auswählen', 'info');
    }
  }, [ansicht, updateStatus]);

  // ============================================
  // Schritt-Status Update (immutable)
  // ============================================
  const updateSchrittStatus = useCallback((index: number, neuerStatus: PruefschrittStatus) => {
    setAusgewaehlterPlan((prevPlan) => {
      if (!prevPlan) return null;
      
      const neueSchritte = prevPlan.schritte.map((schritt, i) => {
        if (i === index) {
          return { ...schritt, status: neuerStatus };
        }
        return schritt;
      });

      return {
        ...prevPlan,
        schritte: neueSchritte,
      };
    });
  }, []);

  // ============================================
  // Condition-Popup Funktionen
  // ============================================
  const zeigeCondition = useCallback((nachricht: string, wartAufBestaetigung: boolean = false) => {
    setConditionPopup({ sichtbar: true, nachricht, wartAufBestaetigung });
  }, []);

  const schliesseCondition = useCallback(() => {
    setConditionPopup({ sichtbar: false, nachricht: '', wartAufBestaetigung: false });
  }, []);

  // ============================================
  // Einzelnen Schritt ausführen (echter API-Call!)
  // ============================================
  const fuehreSchrittAus = useCallback(async (schrittIndex: number, plan: Pruefplan): Promise<boolean> => {
    const schritt = plan.schritte[schrittIndex];
    
    // Status auf aktiv setzen
    updateSchrittStatus(schrittIndex, 'aktiv');
    updateStatus(`Schritt ${schritt.nummer}: ${schritt.bezeichnung}...`, 'info');
    
    // Hat dieser Schritt eine Condition? → Zuerst anzeigen
    if (schritt.condition) {
      zeigeCondition(schritt.condition, true);
      
      // Warten auf Benutzer-Bestätigung
      return new Promise((resolve) => {
        const checkPopup = setInterval(() => {
          // Prüfen ob Popup geschlossen wurde
          setConditionPopup((current) => {
            if (!current.sichtbar && current.wartAufBestaetigung === false) {
              clearInterval(checkPopup);
              
              // Jetzt API-Call machen
              executeStep(schritt.endpointUrl).then((result) => {
                if (result.ok && result.result === 'iO') {
                  updateSchrittStatus(schrittIndex, 'abgeschlossen');
                  updateStatus(`Schritt ${schritt.nummer}: Erfolgreich ✓`, 'erfolg');
                  resolve(true);
                } else {
                  updateSchrittStatus(schrittIndex, 'fehler');
                  updateStatus(`Schritt ${schritt.nummer}: Fehlgeschlagen ✗`, 'fehler');
                  resolve(false);
                }
              });
            }
            return current;
          });
        }, 100);
      });
    }
    
    // Kein Condition → Direkt API-Call
    const result = await executeStep(schritt.endpointUrl);
    
    if (result.ok && result.result === 'iO') {
      updateSchrittStatus(schrittIndex, 'abgeschlossen');
      updateStatus(`Schritt ${schritt.nummer}: Erfolgreich ✓`, 'erfolg');
      return true;
    } else {
      updateSchrittStatus(schrittIndex, 'fehler');
      updateStatus(`Schritt ${schritt.nummer}: Fehlgeschlagen (${result.result})`, 'fehler');
      return false;
    }
  }, [updateSchrittStatus, updateStatus, zeigeCondition]);

  // ============================================
  // Prüfablauf starten
  // ============================================
  const startePruefablauf = useCallback(async () => {
    if (!ausgewaehlterPlan || simulationLaeuft) return;

    setSimulationLaeuft(true);
    abbruchRef.current = false;
    updateStatus(`${ausgewaehlterPlan.name} gestartet...`, 'info');
    
    // Alle Schritte zurücksetzen
    setAusgewaehlterPlan((prevPlan) => {
      if (!prevPlan) return null;
      return {
        ...prevPlan,
        schritte: prevPlan.schritte.map(s => ({ ...s, status: 'wartend' as PruefschrittStatus })),
      };
    });

    // Schritte nacheinander ausführen
    for (let i = 0; i < ausgewaehlterPlan.schritte.length; i++) {
      if (abbruchRef.current) {
        updateStatus('Prüfablauf abgebrochen', 'warnung');
        break;
      }
      
      setAktiverSchrittIndex(i);
      
      const erfolg = await fuehreSchrittAus(i, ausgewaehlterPlan);
      
      if (!erfolg) {
        updateStatus(`${ausgewaehlterPlan.name} fehlgeschlagen bei Schritt ${i + 1}`, 'fehler');
        setSimulationLaeuft(false);
        return;
      }
      
      // Kurze Pause zwischen Schritten
      await new Promise(r => setTimeout(r, 500));
    }

    if (!abbruchRef.current) {
      updateStatus(`${ausgewaehlterPlan.name} erfolgreich abgeschlossen ✓`, 'erfolg');
    }
    
    setSimulationLaeuft(false);
  }, [ausgewaehlterPlan, simulationLaeuft, updateStatus, fuehreSchrittAus]);

  // ============================================
  // Plan auswählen
  // ============================================
  const handlePlanAuswaehlen = useCallback((plan: Pruefplan) => {
    abbruchRef.current = true;
    setSimulationLaeuft(false);
    
    // Plan mit zurückgesetzten Status kopieren
    const planMitResetStatus: Pruefplan = {
      ...plan,
      schritte: plan.schritte.map((s) => ({ ...s, status: 'wartend' as PruefschrittStatus })),
    };
    
    setAusgewaehlterPlan(planMitResetStatus);
    setAktiverSchrittIndex(0);
    setAnsicht('aktiv');
    
    updateStatus(`${plan.name} ausgewählt`, 'erfolg');
  }, [updateStatus]);

  // ============================================
  // Zurück zur Liste
  // ============================================
  const handleZurueck = useCallback(() => {
    abbruchRef.current = true;
    setSimulationLaeuft(false);
    setConditionPopup({ sichtbar: false, nachricht: '', wartAufBestaetigung: false });
    
    setAnsicht('liste');
    setAusgewaehlterPlan(null);
    setAktiverSchrittIndex(0);
    
    updateStatus('Prüfplan auswählen', 'info');
  }, [updateStatus]);

  // ============================================
  // Schritt anklicken
  // ============================================
  const handleSchrittKlick = useCallback((schrittIndex: number) => {
    if (!simulationLaeuft) {
      setAktiverSchrittIndex(schrittIndex);
    }
  }, [simulationLaeuft]);

  // ============================================
  // Condition bestätigen
  // ============================================
  const handleConditionBestaetigen = useCallback(() => {
    setConditionPopup({ sichtbar: false, nachricht: '', wartAufBestaetigung: false });
  }, []);

  // ============================================
  // Render
  // ============================================
  if (ansicht === 'aktiv' && ausgewaehlterPlan) {
    return (
      <>
        <PruefplanAktiv
          pruefplan={ausgewaehlterPlan}
          aktiverSchrittIndex={aktiverSchrittIndex}
          onZurueck={handleZurueck}
          onSchrittKlick={handleSchrittKlick}
          simulationLaeuft={simulationLaeuft}
          onSimulationStarten={startePruefablauf}
        />
        
        <ConditionPopup
          sichtbar={conditionPopup.sichtbar}
          nachricht={conditionPopup.nachricht}
          onBestaetigen={handleConditionBestaetigen}
        />
      </>
    );
  }

  return (
    <PruefplanListe
      pruefplaene={pruefplaene}
      onPlanAuswaehlen={handlePlanAuswaehlen}
    />
  );
};

export default PruefplaenePanel;
