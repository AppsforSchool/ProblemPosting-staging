import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { scopeCssPlugin } from './build/scopeCss.ts'

// ★ base は、公開先のパスに合わせる。
//   検証用  https://appsforschool.github.io/ProblemPosting-staging/  → '/ProblemPosting-staging/'（既定）
//   本番    https://appsforschool.github.io/ProblemPosting/          → '/ProblemPosting/'
//   本番用にビルドするときは、環境変数 VITE_BASE=/ProblemPosting/ を付ける（GitHub Actions では、リポジトリ名から自動で決まる）。
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, '.', '')
	const base = env.VITE_BASE || '/ProblemPosting-staging/'
	return {
		base,
		plugins: [scopeCssPlugin(), react()],
		build: {
			// ★ CSSの圧縮は行わない。既存のCSSには、ブラウザなら読み飛ばす無効な記述（例：「//」コメント）があり、
			//   厳密な圧縮ツールはそれをエラーにするため。既存のサイトも、圧縮せずに配信していた（配信時にgzipされる）。
			cssMinify: false,
		},
	}
})
