#!/bin/bash
# logger importを自動追加するスクリプト

for file in $(grep -l "logger\." src/**/*.{ts,tsx} 2>/dev/null); do
  # すでにloggerをimportしているかチェック
  if ! grep -q "import.*logger.*from.*logger" "$file"; then
    # ファイルの相対パスを計算
    depth=$(echo "$file" | tr -cd '/' | wc -c)
    depth=$((depth - 1)) # srcディレクトリからの深さ
    
    if [ $depth -eq 0 ]; then
      import_path="./logger"
    else
      import_path="../logger"
      for ((i=1; i<depth; i++)); do
        import_path="../$import_path"
      done
    fi
    
    # 最初のimport文の後にlogger importを追加
    sed -i '' "1,/^import/s|^\(import.*\)$|\1\nimport { logger } from '$import_path';|" "$file"
    
    echo "✅ $file に logger import を追加"
  else
    echo "⏭️  $file はすでに logger をimport済み"
  fi
done

echo "完了！"
