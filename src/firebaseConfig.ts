// ★ 問題投稿の既存の firebase.js の値を、機械的に写したもの（手で書き換えない）。
//   apiKey などは、ログイン共有のため、全サイトで同じ値。**appId だけは、サイトごとに違う**（保存キーには影響しない）。
export const firebaseConfig = {
	apiKey: "AIzaSyAqIiNj0N4WruPSOkWbeo5gxzsNyeMkuLo",
	authDomain: "appsforschool-study.firebaseapp.com",
	projectId: "appsforschool-study",
	storageBucket: "appsforschool-study.firebasestorage.app",
	messagingSenderId: "740735293440",
	appId: "1:740735293440:web:a1363adbab57f1ceec60e5",
} as const
