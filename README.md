# じゆうに おんがく！ 🎵

子供向けの音楽作成ゲームです。タイムライン上に楽器マークを配置して、オリジナルのリズム音楽を作れます。

## ゲーム概要

- **タイトル画面**: 「かいし」でゲーム開始、「ぎゃらりー」で作った音楽を確認
- **ゲーム画面**: 6種類の楽器（たいこ・すず・ぱん・ぴこ・ぽろん・しゃら）を16ビートのグリッドに配置
- **ギャラリー**: 自分と他の人の音楽を再生・編集・削除・LINE共有

## 技術スタック

- **フロントエンド**: Vanilla JavaScript (ES Modules) + CSS
- **オーディオ**: Web Audio API によるリアルタイム音声合成
- **バックエンド**: Google Cloud Functions (オプション)
- **ストレージ**: localStorage (ローカル) / Google Cloud Storage (クラウド)
- **ホスティング**: Google Cloud Storage 静的ウェブサイト

## プロジェクト構成

```
jiyu-ni-ongaku/
├── index.html          # エントリーポイント
├── src/
│   ├── main.js         # ルーター
│   ├── style.css       # スタイル
│   ├── audio.js        # Web Audio API 音声エンジン
│   ├── api.js          # API / localStorage
│   ├── title.js        # タイトル画面
│   ├── game.js         # ゲーム画面（シーケンサー）
│   └── gallery.js      # ギャラリー画面
├── functions/
│   ├── package.json    # Cloud Function 依存関係
│   └── index.js        # Cloud Function API
├── build.js            # ビルドスクリプト
└── package.json
```

## ローカル開発

### 必要なツール

- Node.js 18+
- npm

### 開発サーバーの起動

```bash
# 依存関係なしでそのまま起動可能
npx serve . -l 3000 --cors

# または http-server を使用
npx http-server . -p 3000 --cors -c-1
```

ブラウザで http://localhost:3000 を開きます。

> **ローカルモード**: Cloud Function の URL を設定しない場合、すべてのデータは localStorage に保存されます。ゲームの基本機能はすべてローカルモードで動作します。

## Google Cloud へのデプロイ

### 前提条件

- [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) がインストール済み
- Google Cloud プロジェクトが作成済み
- 課金が有効化済み

### 1. プロジェクトの設定

```bash
# プロジェクトIDを設定
export PROJECT_ID="your-project-id"
export BUCKET_NAME="your-bucket-name"
export REGION="asia-northeast1"

# gcloud の設定
gcloud config set project $PROJECT_ID
```

### 2. Cloud Storage バケットの作成と設定

```bash
# バケット作成
gsutil mb -l $REGION gs://$BUCKET_NAME

# 静的ウェブサイトの設定
gsutil web set -m index.html -e index.html gs://$BUCKET_NAME

# 公開アクセスの設定
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# CORS 設定（Cloud Function と連携する場合）
cat > cors.json << 'EOF'
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF
gsutil cors set cors.json gs://$BUCKET_NAME
rm cors.json
```

### 3. フロントエンドのデプロイ

```bash
# ビルド
node build.js

# Cloud Storage にアップロード
gsutil -m rsync -r -d dist gs://$BUCKET_NAME

# キャッシュ設定（HTML はキャッシュなし、その他は1時間）
gsutil -m setmeta -h "Cache-Control:no-cache" gs://$BUCKET_NAME/index.html
gsutil -m setmeta -r -h "Cache-Control:public, max-age=3600" gs://$BUCKET_NAME/src/
```

デプロイ後のURL:
```
https://storage.googleapis.com/$BUCKET_NAME/index.html
```

### 4. Cloud Function のデプロイ（オプション・クラウド保存機能）

Cloud Function をデプロイすると、曲データが Cloud Storage に保存され、他のユーザーの曲もギャラリーで共有できます。

```bash
cd functions

# 依存関係のインストール
npm install

# Cloud Function のデプロイ
gcloud functions deploy api \
  --gen2 \
  --runtime=nodejs18 \
  --region=$REGION \
  --source=. \
  --entry-point=api \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars=BUCKET_NAME=$BUCKET_NAME

cd ..
```

デプロイ後に表示される URL をメモしてください。

### 5. フロントエンドに API URL を設定

`src/api.js` の先頭にある `API_URL` を Cloud Function の URL に更新します：

```javascript
// src/api.js の先頭を変更
const API_URL = window.__API_URL || 'https://REGION-PROJECT_ID.cloudfunctions.net/api';
```

または `index.html` の `<script type="module">` の前に設定を追加：

```html
<script>
  window.__API_URL = 'https://REGION-PROJECT_ID.cloudfunctions.net/api';
</script>
```

変更後、フロントエンドを再デプロイしてください：

```bash
node build.js
gsutil -m rsync -r -d dist gs://$BUCKET_NAME
```

### 6. カスタムドメインの設定（オプション）

Cloud Storage の静的ウェブサイトにカスタムドメインを設定する場合：

1. バケット名をドメイン名と一致させる（例: `www.example.com`）
2. DNS に CNAME レコードを追加: `www.example.com` → `c.storage.googleapis.com`
3. ドメインの所有権を確認

詳細: https://cloud.google.com/storage/docs/hosting-static-website

## 機能一覧

### ゲーム画面
- 🥁🔔👏⭐🎸🎶 6種類の楽器
- 16ビートのステップシーケンサー
- BPM 調整（60〜240）
- プリセットパターン（どんどん・きらきら・たのしい）
- ランダム生成
- 再生/停止とリアルタイムアニメーション
- 楽器ラベルをタップで音を試聴

### ギャラリー
- 自分の音楽: 再生・編集・削除・LINE共有・ダウンロード
- みんなの音楽: 最新30件を再生（クラウドモード時）
- ミニグリッドでパターンをプレビュー

### 対応デバイス
- PC (Chrome, Firefox, Safari, Edge)
- タブレット (iPad, Android)
- スマートフォン (iPhone, Android)

## ライセンス

ISC
