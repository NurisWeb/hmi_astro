// ============================================
// PruefplaenePanel - Haupt-Container mit State-Management
// Enthält Condition-Popup und Schritt-Fortschritt-Simulation
// Mit StatusBar-Integration
// ============================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Pruefplan, PruefplanAnsicht, PruefschrittStatus } from '../../types/menu.types';
import type { StatusTyp } from '../StatusLog';
import { pruefplanService } from '../../services/PruefplanService';
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
  });

  // Timeout-Ref für Cleanup
  const simulationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const zeigeCondition = useCallback((nachricht: string) => {
    setConditionPopup({ sichtbar: true, nachricht });
  }, []);

  const schliesseCondition = useCallback(() => {
    setConditionPopup({ sichtbar: false, nachricht: '' });
    
    // Nächsten Schritt starten (wenn vorhanden)
    setAusgewaehlterPlan((prevPlan) => {
      if (!prevPlan) return null;
      
      const naechsterIndex = aktiverSchrittIndex + 1;
      
      if (naechsterIndex < prevPlan.schritte.length) {
        // Nächsten Schritt aktivieren
        setAktiverSchrittIndex(naechsterIndex);
        
        // Simulation für nächsten Schritt fortsetzen
        simuliereNaechstenSchritt(naechsterIndex, prevPlan);
      } else {
        // Alle Schritte abgeschlossen
        setSimulationLaeuft(false);
        updateStatus(`${prevPlan.name} abgeschlossen`, 'erfolg');
      }
      
      return prevPlan;
    });
  }, [aktiverSchrittIndex, updateStatus]);

  // ============================================
  // Simulation: Nächster Schritt
  // ============================================
  const simuliereNaechstenSchritt = useCallback((schrittIndex: number, plan: Pruefplan) => {
    // Aktuellen Schritt auf aktiv setzen
    updateSchrittStatus(schrittIndex, 'aktiv');
    
    // Status in der StatusBar aktualisieren
    const schritt = plan.schritte[schrittIndex];
    updateStatus(`Schritt ${schrittIndex + 1}: ${schritt.bezeichnung}...`, 'info');

    // Simulierte Dauer (2-4 Sekunden zufällig)
    const dauer = 2000 + Math.random() * 2000;

    simulationTimeoutRef.current = setTimeout(() => {
      // Schritt abgeschlossen
      updateSchrittStatus(schrittIndex, 'abgeschlossen');

      // Condition-Nachricht für diesen Schritt
      const conditionNachrichten: Record<string, string> = {
        's1': 'Getriebeöl wurde befüllt. Bitte Füllstand visuell prüfen und bestätigen.',
        's2': 'Öltemperatur hat Betriebstemperatur erreicht. Temperaturanzeige prüfen.',
        's3': 'Druckaufbau abgeschlossen. Keine Leckagen festgestellt.',
        's4': 'Gangwechsel-Test erfolgreich. Alle Gänge funktionieren.',
        's5': 'Drehmoment gemessen: 450 Nm. Wert im Toleranzbereich.',
        's6': 'Vibrationsprüfung abgeschlossen. Keine Auffälligkeiten.',
        's7': 'Abkühlung eingeleitet. System kühlt kontrolliert ab.',
        's8': 'Prüfprotokoll wurde erstellt und gespeichert.',
        'b1': 'Motor erfolgreich angeschlossen. Anschlüsse prüfen.',
        'b2': 'Bremse wurde gelöst. Freie Rotation bestätigt.',
        'b3': 'Drehzahl: 1500 U/min erreicht.',
        'b4': 'Bremskraft gemessen: 850 N. Wert korrekt.',
        'b5': 'Protokoll erstellt.',
        'o1': 'System befüllt. Keine Luftblasen sichtbar.',
        'o2': 'Betriebsdruck: 12 bar erreicht.',
        'o3': 'Keine Leckage festgestellt. System dicht.',
      };

      const nachricht = conditionNachrichten[schritt.id] || 
        `Schritt "${schritt.bezeichnung}" wurde abgeschlossen.`;

      zeigeCondition(nachricht);
    }, dauer);
  }, [updateSchrittStatus, zeigeCondition, updateStatus]);

  // ============================================
  // Test-Simulation starten
  // ============================================
  const simulierePruefablauf = useCallback(() => {
    if (!ausgewaehlterPlan || simulationLaeuft) return;

    setSimulationLaeuft(true);
    updateStatus(`${ausgewaehlterPlan.name} gestartet...`, 'info');
    
    // Alle Schritte zurücksetzen
    setAusgewaehlterPlan((prevPlan) => {
      if (!prevPlan) return null;
      
      const resetSchritte = prevPlan.schritte.map((schritt) => ({
        ...schritt,
        status: 'wartend' as PruefschrittStatus,
      }));

      return {
        ...prevPlan,
        schritte: resetSchritte,
      };
    });

    // Ersten Schritt starten
    setAktiverSchrittIndex(0);
    
    // Kurze Verzögerung damit Reset angewendet wird
    setTimeout(() => {
      if (ausgewaehlterPlan) {
        updateSchrittStatus(0, 'aktiv');
        simuliereNaechstenSchritt(0, ausgewaehlterPlan);
      }
    }, 100);
  }, [ausgewaehlterPlan, simulationLaeuft, updateSchrittStatus, simuliereNaechstenSchritt, updateStatus]);

  // ============================================
  // Plan auswählen
  // ============================================
  const handlePlanAuswaehlen = useCallback((plan: Pruefplan) => {
    // Vorherige Simulation abbrechen
    if (simulationTimeoutRef.current) {
      clearTimeout(simulationTimeoutRef.current);
    }
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
    // Simulation abbrechen
    if (simulationTimeoutRef.current) {
      clearTimeout(simulationTimeoutRef.current);
    }
    setSimulationLaeuft(false);
    setConditionPopup({ sichtbar: false, nachricht: '' });
    
    setAnsicht('liste');
    setAusgewaehlterPlan(null);
    setAktiverSchrittIndex(0);
    
    updateStatus('Prüfplan auswählen', 'info');
  }, [updateStatus]);

  // ============================================
  // Schritt anklicken
  // ============================================
  const handleSchrittKlick = useCallback((schrittIndex: number) => {
    // Nur erlauben wenn keine Simulation läuft
    if (!simulationLaeuft) {
      setAktiverSchrittIndex(schrittIndex);
    }
  }, [simulationLaeuft]);

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
          onSimulationStarten={simulierePruefablauf}
        />
        
        <ConditionPopup
          sichtbar={conditionPopup.sichtbar}
          nachricht={conditionPopup.nachricht}
          onBestaetigen={schliesseCondition}
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
