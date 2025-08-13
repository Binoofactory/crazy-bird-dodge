import React from 'react';
import { IonPage, IonContent, IonButton } from '@ionic/react';
import './home.css';

export default function Home() {
  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="home" style={{ backgroundImage: 'url(/src/assets/main_bg.jpg)' }}>
          <div className="title">미친새 피하기 🐦💩</div>
          <div className="btns">
            <IonButton expand="block" onClick={() => (window.location.href = '/game')}>새로하기</IonButton>
            <IonButton expand="block" onClick={() => (window.location.href = '/scores')}>점수보기</IonButton>
            <IonButton expand="block" color="medium" onClick={() => window.close()}>종료</IonButton>
          </div>
          <div className="corner-exit" onClick={() => window.close()}>✖</div>
        </div>
      </IonContent>
    </IonPage>
  );
}