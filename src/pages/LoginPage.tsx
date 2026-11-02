import { useCallback, useEffect, useRef, useState } from 'react'
import type { Html5Qrcode } from 'html5-qrcode'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { LoadingOverlay } from '../components/LoadingOverlay'
import { PageShell } from '../components/PageShell'
import { useLoadingStage } from '../lib/loadingStage'

// ★ ログイン画面。既存の index.html + script.js と同じHTML構造・同じ挙動。
//   ・ログイン済みなら、ログイン画面を出さずに、元の画面（なければホーム）へ進む。
//   ・ID + パスワード、または QRコード（「ID パスワード」の形式）で入力できる。
//   ・読み込み画面には、進捗バーが出る（Firebaseに接続 → ログイン状態を確認 → ページを移動）。
//   ・問題投稿には、高校見学のような「アカウント情報」のドロワー（新UI/旧UIのトグル）はない。

const QR_READER_ID = 'login-qr-reader'

export default function LoginPage() {
	const { user, loading, login } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()

	const [id, setId] = useState('')
	const [password, setPassword] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')

	const [qrOpen, setQrOpen] = useState(false)
	const [qrFailed, setQrFailed] = useState(false)
	const [shareOpen, setShareOpen] = useState(false)

	const scannerRef = useRef<Html5Qrcode | null>(null)

	// ---- 読み込み画面の進捗（既存の script.js と同じ段階） ----
	const stage = useLoadingStage('ログインシステムの読み込みに時間がかかる場合があります｡')
	const { setStage } = stage
	useEffect(() => {
		setStage('Firebaseに接続しています｡', 25, 60)
	}, [setStage])

	// ---- ログイン状態が確定したら、進捗を進める。ログイン済みなら、先へ進む ----
	//   navigate・location は、再描画のたびに変わりうるので、effect の条件には入れず、ref 経由で読む（移動を、1回だけにするため）。
	const navigateRef = useRef(navigate)
	navigateRef.current = navigate
	const fromRef = useRef<string | undefined>(undefined)
	fromRef.current = (location.state as { from?: string } | null)?.from
	useEffect(() => {
		if (loading) return
		setStage('ログイン状態を確認しています｡', 65, 95)
		if (!user) return
		setStage('ページを移動しています｡', 100)
		const from = fromRef.current
		navigateRef.current(from && from.startsWith('/') ? from : '/', { replace: true })
	}, [loading, user, setStage])

	// ---- QRコードの読み取り ----
	const stopScan = useCallback(async () => {
		const scanner = scannerRef.current
		if (!scanner) return
		scannerRef.current = null
		try {
			await scanner.stop()
		} catch {
			/* すでに止まっている */
		}
	}, [])

	const inputQrData = useCallback((decoded: string) => {
		const parts = decoded.split(' ')
		if (parts.length === 2) {
			setId(parts[0])
			setPassword(parts[1])
			setQrOpen(false)
		} else {
			setQrFailed(true) // 非対応のQRコード
		}
	}, [])

	const startScan = useCallback(async () => {
		try {
			const { Html5Qrcode } = await import('html5-qrcode') // QRを使うときだけ読み込む
			const scanner = new Html5Qrcode(QR_READER_ID)
			scannerRef.current = scanner
			await scanner.start(
				{ facingMode: 'environment' }, // 背面カメラ
				{ fps: 10, qrbox: { width: 250, height: 250 } },
				(decodedText) => {
					console.log('読み取り成功:', decodedText)
					void stopScan()
					inputQrData(decodedText)
				},
				() => {
					/* スキャン中に、QRが見つからない間は、ここが呼ばれ続ける（無視してよい） */
				},
			)
		} catch (err) {
			console.error('カメラ起動エラー:', err)
			alert('カメラの起動に失敗しました。ブラウザの権限を確認してください。')
			await stopScan()
			setQrOpen(false)
		}
	}, [inputQrData, stopScan])

	// ページを離れるときは、カメラを止める
	useEffect(() => () => void stopScan(), [stopScan])

	// ---- ログイン ----
	const handleLogin = async () => {
		setErrorMessage('')
		setSubmitting(true) // 多重クリックを防ぐ
		try {
			await login(id, password)
			// 成功すると、ログイン状態の変化で、上の effect が先へ進める（それまで「ログイン中...」のまま）
		} catch (error) {
			setErrorMessage('ログインに失敗しました。IDとパスワードを確認してください。')
			console.error('ログインエラー:', error)
			setSubmitting(false)
		}
	}

	const canSubmit = id.trim() !== '' && password.trim() !== ''

	return (
		<PageShell name="login">
			{/* 起動時オーバーレイ：ログイン状態が確定して、ログインしていないと分かったら閉じる */}
			<LoadingOverlay text={stage.text} percent={stage.percent} hidden={!loading && !user} />

			<div
				id="qr-login-modal"
				className={'modal-overlay' + (qrOpen ? '' : ' hidden')}
			>
				<div className="modal-content">
					<div className="modal-header">
						<p className="title">QRコードで入力</p>
						<span
							id="qr-login-modal-close"
							className="close-button"
							onClick={() => {
								setQrOpen(false)
								void stopScan()
							}}
						>
							&times;
						</span>
					</div>
					<div id={QR_READER_ID} style={{ width: '100%', maxWidth: '500px', margin: 'auto' }}></div>

					<div id="qr-login-failure" className={qrFailed ? undefined : 'hidden'}>
						<p>非対応のQRコードです｡</p>
						<button
							id="qr-login-retry"
							onClick={() => {
								setQrFailed(false)
								void startScan()
							}}
						>
							もう一度
						</button>
					</div>
				</div>
			</div>

			<div id="share-modal" className={'modal-overlay' + (shareOpen ? '' : ' hidden')}>
				<div className="modal-content">
					<div className="modal-header">
						<p className="title">シェア</p>
						<span id="share-modal-close" className="close-button" onClick={() => setShareOpen(false)}>
							&times;
						</span>
					</div>
					<img src={`${import.meta.env.BASE_URL}qrcode.png`} alt="QR Code" />
				</div>
			</div>

			<header id="app-header">
				<p id="header-title">問題投稿</p>
				<button id="share-modal-btn" onClick={() => setShareOpen(true)}>
					シェア
				</button>
			</header>

			<main>
				<div id="login-container" className={user ? 'hidden' : undefined}>
					<p id="login-title">ログイン</p>
					<p className="login-subtitle" id="to-pc">
						このサイトを利用するには、ログインが必要です。
					</p>
					<p className="login-subtitle" id="to-sp">
						このサイトを利用するには、<br />
						ログインが必要です。
					</p>

					<div id="login-input">
						<input type="text" id="id" placeholder="ID" value={id} onChange={(e) => setId(e.target.value)} />
						<input
							type="password"
							id="password"
							placeholder="パスワード"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
						<a
							id="qr-login-button"
							onClick={() => {
								setQrOpen(true)
								void startScan()
							}}
						>
							QRコードで入力
						</a>

						<button type="submit" id="login-button" disabled={submitting || !canSubmit} onClick={() => void handleLogin()}>
							{submitting ? 'ログイン中...' : 'ログイン'}
						</button>
						<p id="error-message">{errorMessage}</p>
					</div>
				</div>
			</main>

			<footer>
				<p>QRコードは株式会社デンソーウェーブの登録商標です。</p>
			</footer>
		</PageShell>
	)
}
