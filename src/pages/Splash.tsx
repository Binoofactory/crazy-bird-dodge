import React, { useEffect } from 'react';
import { IonPage } from '@ionic/react';
import './splash.css';

// 스플래시 이미지는 교체 가능한 변수(경로)
const SPLASH_SRC = '/src/assets/splash_background.svg';

export default function Splash() {
  useEffect(() => {
    const t = setTimeout(() => (window.location.href = '/home'), 2500);
    return () => clearTimeout(t);
  }, []);
  return (
    <IonPage>
      <div className="splash" style={{ backgroundImage: `url(${SPLASH_SRC})` }} />
    </IonPage>
  );
}
