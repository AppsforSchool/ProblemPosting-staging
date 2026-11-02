# 問題投稿 SPA移行 — 現在地（会話をまたいで引き継ぐための記録）

最終更新：フェーズ3a-①（土台・ログイン画面）

## 方針（確定）
| 項目 | 決定 |
| --- | --- |
| 構成 | サイトごとに別々のSPA。高校見学の土台（`KokoKengaku-modern-staging`）をコピーして、問題投稿用に直した。共通部品はコピーして持つ |
| 深さ | **同じ挙動の移植のみ。UI・機能は一切変更しない**。例外は、下の「挙動の変更点」の1件だけ |
| 旧UI | **問題投稿には、旧UIがない**（`uiMode` を使う箇所がゼロ）。`<html class="ui-new">` を固定し、`src/styles/new/` だけを使う。ドロワーのトグル・`UiModeProvider`・`UiSwitchSection` は、持たない |
| CSS | 中身は書き換えず、ビルド時に、ページごとに限定（`build/scopeCss.ts`。高校見学と同じ仕組み） |
| 検証 | 別リポジトリ `ProblemPosting-staging` で確認してから、本番 `ProblemPosting` へ反映 |
| 診断・計測 | すべて移植。ただし `?fs=` と `?cache=` は移さず、**常にロングポーリング・永続キャッシュなし** |
| APIキーのWorker化 | 移植が終わったあとの別作業（フェーズ4）。それまでは `system_keys/*` を取得して直接呼ぶ現状のまま。呼び出しは `lib/imageUpload.ts`・`lib/push.ts`、Geminiの1か所にまとめる |
| 旧URL | リダイレクト用ファイルを、無期限に残す（`public/*.html`）。共有・QR・通知に入っている `app.html#<ID>`・`answer.html?id=…` などが、動き続ける |
| ルート（確定） | 下の「ルート」のとおり |

## 公開先
| | リポジトリ | 公開URL | `base` |
| --- | --- | --- | --- |
| 検証用 | `ProblemPosting-staging` | `https://appsforschool.github.io/ProblemPosting-staging/` | `/ProblemPosting-staging/`（既定） |
| 本番 | `ProblemPosting` | `https://appsforschool.github.io/ProblemPosting/` | `/ProblemPosting/`（Actions が、リポジトリ名から自動で決める） |

バックアップ：本番リポジトリに、`pre-spa` タグと `legacy` ブランチを作成済み（元の最新コミットは `b2bd9dd…`）。戻すときは、Settings → Pages の配信元を `legacy` ブランチにする。

## ルート（確定）
| 新しいルート | 旧URL |
| --- | --- |
| `#/login` | `index.html` |
| `#/`（`#/books` に置き換え） | `app.html`（ハッシュなし） |
| `#/books`、`#/cards` | `app.html#books`、`#cards` |
| `#/books/:id`、`#/cards/:id`（一覧を出して、出題設定のモーダルを開く） | `app.html#<ID>` |
| `#/open/:id`（IDを調べて、上の2つのどちらかへ） | `app.html#<ID>`（旧URLの変換先） |
| `#/books/new`、`#/cards/new` | `make.html`、`makeCard.html` |
| `#/books/:id/edit`、`#/cards/:id/edit` | `edit.html?id=`、`editCard.html?id=` |
| `#/books/:id/answer`、`#/cards/:id/answer`（`?shuffle=1`・`?favoritesOnly=1`・`?flip=1`） | `answer.html?id=…`、`answerCard.html?id=…` |
| `#/live/:id`、`#/live/:id/host` | `liveAnswer.html?id=`、`liveHost.html?id=` |
| `*` | 存在しないパス：「指定されたページは見つかりませんでした。」のアラート → OKでホーム |

## 挙動の変更点（唯一）
- **出題設定のモーダルの、戻るボタン**：現行は、開くとハッシュだけが `#<ID>` になり、戻るボタンを押すと、ハッシュだけが戻って、**モーダルは開いたまま**。新サイトは、開くと `#/books/:id`（暗記カードは `#/cards/:id`）に移り、閉じると `#/books` に置き換える。**戻るボタンで、モーダルが閉じる**。（ユーザー了承済み。実装は、ホームの段階）
- 共有・QRのURLは、現行と同じ `…/ProblemPosting/app.html#<ID>` の形のまま（変えない）。

## 守ること
- `src/firebase.ts` の Auth の初期化は、全サイト一字一句同じ（SDK `12.14.0` 固定、アプリ名なし、`initializeAuth`、保存先 local→session→memory）。**高校見学の `firebase.ts` との差は、「追加」だけ**（`firebase/database` の `rtdb` と `rtdb〜` の別名、`deleteDoc`・`deleteField`・`increment` の書き出し）。
- `src/firebaseConfig.ts` は、問題投稿の既存の `firebase.js` から機械的に写した値。**`appId` だけが、高校見学と違う**（`…a1363adbab57f1ceec60e5`）。手で書き換えない。
- 既存のCSSは書き換えない（`src/styles/new/*.css` は、元のファイルのコピー。`login.css` ← `style.css`、`dialog.css` ← `appDialogStyle.css`）。
- Firestore・RTDBへの書き込みの形は変えない（`ProblemPosting_確認チェックリスト_現行版.md` の「付録A」）。
- `localStorage` のキー（`liveAudioMuted`、`problemBookBackup_*`、`cardDeckBackup_*`）は、名前も中身も変えない（同じオリジンの旧サイトと共有される。付録B）。
- `package.json` と `package-lock.json` の両方をコミットする（`npm ci` を使うため）。
- 秘密のファイル（`.dev.vars`、`key.json`）は、コミットしない。

## 既存の仕様書と食い違った点（コードを正とした）
- URLのパラメータは、`favorites` ではなく **`favoritesOnly=1`**（`answer.html`・`answerCard.html`）。`shuffle=1`・`flip=1` は、仕様書のとおり。
- 作成・編集の下書きバックアップが `localStorage` にある（仕様書の表にない）：`problemBookBackup_create`・`problemBookBackup_edit_<ID>`・`cardDeckBackup_create`・`cardDeckBackup_edit_<ID>`。
- ログアウトの「ログアウトしました。」のアラートは、問題投稿では**実際に見える**（OKを押すと、ログイン画面へ）。高校見学のように消さず、そのまま移す（ホームの段階）。
- `appId` が、高校見学と違う。`push.ts` の `KEY_DOC_ID` は、`onesignal_ProblemPosting`。

## 進み具合
| フェーズ | 内容 | 状態 |
| --- | --- | --- |
| 3前 | コードの調査、確認チェックリスト、ルートの確定、バックアップ、検証用リポジトリ | **完了** |
| 3a-① | 土台（Vite+React+TS、`firebase.ts`＋`rtdb`、認証、ダイアログ、読み込み画面と進捗、診断・計測、通知の部品）、**ログイン画面**、CSSの限定、公開設定、`app.html`・`404.html` の変換 | **完了（このzip）**。ブラウザ検証済み。**あなたの環境での動作確認は、これから** |
| 3a-② | ホームの一覧（`app.css`）、ドロワー、プロフィール、ユーザー一覧、通知ボタン、`#/open/:id`、ログアウト | 未着手 |
| 3a-③ | 出題設定のモーダル、共有、感想、解いた人、ライブの募集・参加 | 未着手 |
| 3b | 解答（`answer`・`answerCard`）、お気に入り、AI採点（Gemini） | 未着手 |
| 3c | 作成・編集（問題集・暗記カード）、JSON、下書きバックアップ、削除 | 未着手 |
| 3d | ライブ（主催者・参加者、RTDB、時刻補正、音） | 未着手 |
| 3e | 旧URLの互換確認（全ページ分のリダイレクト） | 未着手 |
| 3f | 本番への切り替え | 未着手 |
| 4 | 後片付け、APIキーのWorker化 | 未着手 |

## 3a-①で作った部品
| 部品 | 場所 |
| --- | --- |
| 認証（`login`・`logout`、ログイン状態） | `auth/AuthProvider.tsx`（`logout` は、`logoutPush()` → `signOut()` の順） |
| 未ログインのとき、ログイン画面へ送る（元の場所を覚える） | `auth/RequireAuth.tsx`（`loadingText` で、ページごとの読み込み文言を渡せる） |
| ログイン画面 | `pages/LoginPage.tsx`（既存の `index.html` + `script.js`） |
| 読み込み画面・進捗 | `components/LoadingOverlay.tsx`、`lib/loadingStage.ts`（`useLoadingStage`：既存の `setLoadingStage` の「ゆっくり進める」動き、`createReadTracker`） |
| ダイアログ | `ui/DialogProvider.tsx`（`useDialog().alert / confirm`。既存の `AppDialog` と同じHTML構造・ID） |
| ページの外枠 | `components/PageShell.tsx`（`<div class="ui-page page-◯◯">`。**既存の `<body>` の役割**） |
| 通知の部品 | `lib/push.ts`（`startPush`・`logoutPush`・`sendPushToUsers`・`getAllOtherUserIds`・`sendPushToAllOthers`）、`components/PushButton.tsx` |
| 診断・計測 | `lib/perf.ts`、`lib/diag.ts`、`lib/recover.ts`、`lib/statusBadge.ts`（`#live-header` にも対応）、`components/PerfRouteWatcher.tsx` |
| 旧URLの変換 | `public/app.html`（`#books`・`#cards`・`#<ID>` → 新ルート。検索パラメータは引き継ぐ）、`public/404.html` |
| 仮のホーム | `pages/HomePlaceholderPage.tsx`（**3a-②で、本物に置き換える**） |

### 既存との違い（意図したもの）
- 診断の「通信方式」の表示は、`long`（固定）と出す。
- ログイン画面の読み込み画面の文言は、既存と同じ段階で進む（「Firebaseに接続しています｡」25→60％ → 「ログイン状態を確認しています｡」65→95％ → 「ページを移動しています｡」100％）。
- QR読み取り（`html5-qrcode`）は、`unpkg` の `<script>` ではなく、使うときだけ読み込む（npmの部品）。
- ログイン画面のドロワー（高校見学の「アカウント情報」）は、問題投稿にはない。

## ページ間の読み込み（無駄の調査。コードを読んだ結果）
着手時の約束：ページ間の無駄な読み込み（毎回の全件取得、キャッシュの破棄）を、そのまま持ち込むかを、ホームの段階で決める。
- 既存のホームは、開くたびに、**自分の情報・問題集の全件・暗記カードの全件・`users_random` の全件**を、4本同時に取得する（`hedged` で、4秒で再送）。
- 画面を移ると、SPAでも、**同じ取得をやり直す**ことになる（既存と同じ挙動のため）。
- 改善の候補（記録のみ。実装しない。実装するなら、ユーザーの判断が要る）：一覧とユーザー情報を、画面を移っても使い回す。

## 検証の手順（毎回の納品のあと）
1. `npm install`（初回のみ。`package-lock.json` ができる）→ `npm run typecheck` → `npm run build`。
2. 検証用リポジトリに、コミット → プッシュ → Actionsが緑になるのを待つ。
3. 検証用のURLで、`ProblemPosting_確認チェックリスト_現行版.md` の、該当する項目を確認する（`Ctrl` + `Shift` + `R`）。
