import React from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router';
import Splash from './pages/Splash';
import Home from './pages/Home';
import Game from './pages/Game';
import Scores from './pages/Scores';

setupIonicReact();

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route path="/splash" component={Splash} exact />
          <Route path="/home" component={Home} exact />
          <Route path="/game" component={Game} exact />
          <Route path="/scores" component={Scores} exact />
          <Redirect exact from="/" to="/splash" />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}