// Firebase 웹 앱 설정값 (로그인에 사용)
//
// 값 찾는 곳: Firebase 콘솔 → 프로젝트 설정(톱니바퀴) → 일반 → 내 앱 → 웹 앱 → "SDK 설정 및 구성" → 구성(Config)
//   웹 앱이 없으면 같은 화면에서 "앱 추가" → 웹(</>)으로 먼저 등록하세요.
//
// - 이 값들은 비밀번호가 아니라서 저장소에 올려도 괜찮아요 (Firebase 공식 안내).
//   실제 보안은 Firebase 콘솔의 "승인된 도메인"과 보안 규칙이 담당해요.
// - apiKey가 비어 있으면, Firebase Hosting에 배포된 사이트에서는 설정을 자동으로 불러와요(/__/firebase/init.json).
//   그래서 로컬(npm start)에서 로그인을 시험하려면 여기에 값을 채워야 해요.

export const firebaseConfig = {
  apiKey: "AIzaSyAJAeL4H-zCDdzIqGgae9oH1POXbKTouvY",
  authDomain: "caffe-onebottle.firebaseapp.com",
  projectId: "caffe-onebottle",
  appId: "1:804289953010:web:af407e4872e72a0a1f246b",
};
