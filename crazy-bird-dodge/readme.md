
sudo npm install -g @ionic/cli native-run cordova-res
sudo ionic start crazy-bird-dodge tabs --type=react --capacitor
cd crazy-bird-dodge
npm install @capacitor/preferences @capacitor/filesystem
npm install @ionic/pwa-elements

캔버스의 src/ 코드와 assets/ 파일 경로대로 복사

npm i @capacitor/preferences (원하면 localStorage 대신 Preferences로 교체 가능)

웹: npm run dev
네이티브: npx cap add ios/android && npx cap copy && npx cap open ios/android
