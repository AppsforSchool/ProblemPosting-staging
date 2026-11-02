// ★ すべてのCSSを、ここで、決まった順序で読み込む。
//   src/styles/new/ の CSS は、中身を書き換えず、ビルド時に、ページごとに限定される（build/scopeCss.ts）。
//   ・問題投稿には、旧UIがない（高校見学と違い、src/styles/old/ はない）。
//   ・既存のCSSは、ページごとに別々に読み込まれていた。ページのCSSを移したら、ここに1行ずつ足す。
//   ・dialog は、全ページ共通のダイアログ用。元のサイトと同じく、ページのCSSより「あと」に読み込む（同じ詳細度のとき、あとのものが勝つため）。
import './base.css'
import './new/login.css'
import './new/dialog.css'
