import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import './styles' // すべてのCSS（順序が大切なので、1か所で読み込む）
import { DialogProvider } from './ui/DialogProvider'
import { perfMark } from './lib/perf'

perfMark('JSモジュールの読み込み・実行開始（HTML解析・Firebase等の取得）')

// ★ 問題投稿には、旧UIがない。<html> の ui-new は、index.html に付けてある（CSSの範囲の印）。
createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<AuthProvider>
			<DialogProvider>
				<HashRouter>
					<App />
				</HashRouter>
			</DialogProvider>
		</AuthProvider>
	</StrictMode>,
)
