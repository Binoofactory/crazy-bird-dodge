import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, IonList, IonItem, IonLabel, IonButton } from '@ionic/react';

export default function Scores() {
  const [hist, setHist] = useState<any[]>([]);
  useEffect(() => {
    const raw = localStorage.getItem('score_history');
    setHist(raw ? JSON.parse(raw) : []);
  }, []);

  return (
    <IonPage>
      <IonContent>
        <div style={{ padding:16 }}>
          <h2>점수 이력</h2>
          <IonList>
            {hist.map((h, idx) => (
              <IonItem key={idx}>
                <IonLabel>
                  <h3>스테이지 {h.stage}</h3>
                  <p>점수 {h.score} / 새 잡음 {h.killedBirds} / 시간 {new Date(h.ts).toLocaleString()}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
          <IonButton expand="block" onClick={() => (window.location.href = '/home')}>메인으로</IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
}
