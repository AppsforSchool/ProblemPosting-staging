import { useCallback, useEffect, useRef, useState } from 'react'

// ★ 読み込み画面の進捗表示（既存の loading.js の setLoadingStage / createReadTracker と同じ挙動）。
//   ・setStage(text, percent, ceilingPercent) … 段階の文言と進捗バーを更新する。
//       ceilingPercent を渡すと、次の更新が来るまでの間、上限に向けてゆっくり進める（通信待ちで、止まって見えないための演出）。
//       200ミリ秒ごとに、上限までの残りの6%ずつ進め、残りが0.5%未満になったら、そこで止める。
//   ・createReadTracker(total, from, to) … 同時に発行した読み取りが「いくつ終わったか」で、バーを、実際の完了数に応じて進める。
//   ※ 既存は、各ページのスクリプトが、HTMLの #loading-status-text / #loading-progress-bar-fill を直接書き換えていた。
//     SPAでは、状態（text / percent）として持ち、LoadingOverlay に渡す。

export interface LoadingStage {
	text: string
	percent: number
	setStage: (text: string, percent?: number, ceilingPercent?: number) => void
	createReadTracker: (total: number, fromPercent: number, toPercent: number) => <T>(label: string, promise: Promise<T>) => Promise<T>
}

export function useLoadingStage(initialText: string, initialPercent = 0): LoadingStage {
	const [text, setText] = useState(initialText)
	const [percent, setPercent] = useState(initialPercent)
	const creepTimer = useRef<ReturnType<typeof setInterval> | null>(null)
	const creepCurrent = useRef(initialPercent)

	const stopCreep = useCallback(() => {
		if (creepTimer.current) {
			clearInterval(creepTimer.current)
			creepTimer.current = null
		}
	}, [])

	const setStage = useCallback(
		(nextText: string, nextPercent?: number, ceilingPercent?: number) => {
			stopCreep()
			setText(nextText)
			if (typeof nextPercent === 'number') {
				const clamped = Math.max(0, Math.min(100, nextPercent))
				setPercent(clamped)
				creepCurrent.current = clamped
				if (typeof ceilingPercent === 'number' && ceilingPercent > clamped) {
					creepTimer.current = setInterval(() => {
						const remaining = ceilingPercent - creepCurrent.current
						if (remaining < 0.5) return // 上限の手前で止め、本当の進捗を待つ
						creepCurrent.current += remaining * 0.06
						setPercent(creepCurrent.current)
					}, 200)
				}
			}
		},
		[stopCreep],
	)

	// 画面を離れるときは、タイマーを止める
	useEffect(() => stopCreep, [stopCreep])

	const createReadTracker = useCallback(
		(total: number, fromPercent: number, toPercent: number) => {
			let finished = 0
			return <T,>(label: string, promise: Promise<T>): Promise<T> =>
				promise.then((result) => {
					finished++
					setStage(
						`${label}を取得しました (${finished}/${total})｡`,
						fromPercent + (finished / total) * (toPercent - fromPercent),
						toPercent + 5,
					)
					return result
				})
		},
		[setStage],
	)

	return { text, percent, setStage, createReadTracker }
}
