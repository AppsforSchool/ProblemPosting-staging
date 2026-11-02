import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { PageShell } from '../components/PageShell'

// ★ 仮の画面（3aの途中だけ）。ログイン → 画面の移動 → ログアウトの流れを確かめるためのもの。
//   本物のホーム（既存の app.html + appScript.js）に、次の段階で置き換える。
export default function HomePlaceholderPage() {
	const { userId, logout } = useAuth()
	const navigate = useNavigate()
	return (
		<PageShell name="login">
			<header id="app-header">
				<p id="header-title">問題投稿</p>
			</header>
			<main>
				<div id="login-container">
					<p id="login-title">ログインできました</p>
					<p className="login-subtitle">ホーム画面は、次の段階で移植します。（仮の画面）</p>
					<p className="login-subtitle">ユーザーID：{userId}</p>
					<div id="login-input">
						<button
							type="button"
							id="login-button"
							onClick={async () => {
								await logout()
								navigate('/login', { replace: true })
							}}
						>
							ログアウト
						</button>
					</div>
				</div>
			</main>
		</PageShell>
	)
}
