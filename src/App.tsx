import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import { PerfRouteWatcher } from './components/PerfRouteWatcher'
import HomePlaceholderPage from './pages/HomePlaceholderPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'

// ★ ルート（合意済み）。旧URLとの対応：
//   index.html → #/login（ログインしていれば #/ へ）  /  app.html → #/（→ #/books）  /  app.html#books・#cards → #/books・#/cards
//   app.html#<ID> → #/open/<ID>（問題集か暗記カードかを調べて、#/books/<ID> か #/cards/<ID> へ）
//   make.html・makeCard.html → #/books/new・#/cards/new  /  edit.html?id= → #/books/<ID>/edit  ほか
//   旧URLは、public/ の小さなリダイレクト用ファイルが、新しいルートに変換する。
//   ★ 3aの途中：ホーム（#/books・#/cards）は、仮の画面。以降の段階で、順に、本物に置き換える。
export default function App() {
	return (
		<>
			<PerfRouteWatcher />
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/" element={<Navigate to="/books" replace />} />
				<Route
					path="/books"
					element={
						<RequireAuth page="login">
							<HomePlaceholderPage />
						</RequireAuth>
					}
				/>
				<Route
					path="/cards"
					element={
						<RequireAuth page="login">
							<HomePlaceholderPage />
						</RequireAuth>
					}
				/>
				<Route path="*" element={<NotFoundPage />} />
			</Routes>
		</>
	)
}
